import { Howler } from 'howler';

/**
 * Analyseur spectral branché sur l'élément <audio> de Howler (mode html5).
 *
 * Le flux est routé <audio> → AnalyserNode → destination : le son continue de
 * sortir normalement, on se contente de "l'écouter" pour animer le fond du
 * lecteur plein écran au rythme de la musique.
 *
 * Un flux cross-origin doit être chargé en mode CORS, sinon Web Audio ne
 * renverrait que du silence — d'où primeAudioPool(), à appeler avant de créer
 * le Howl. À défaut, l'analyse est abandonnée pour le morceau : le son prime
 * toujours sur l'animation.
 */

export interface AudioLevels {
  bass: number;
  mid: number;
  treble: number;
  level: number;
}

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let spectrum: Uint8Array<ArrayBuffer> | null = null;
let unavailable = false;

/** Un élément ne peut être "tapé" qu'une seule fois (Howler recycle ses nodes). */
const tapped = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

function sameOrigin(src: string): boolean {
  try {
    return new URL(src, window.location.href).origin === window.location.origin;
  } catch {
    // Dans le doute, on exige le mode CORS : sans lui, brancher Web Audio sur
    // un flux d'une autre origine ne sortirait aucun son.
    return false;
  }
}

/**
 * Marque en CORS les éléments <audio> que Howler va utiliser, AVANT qu'ils ne
 * reçoivent une source : le flux est alors chargé en mode CORS dès le départ.
 * On ne touche jamais à un élément déjà chargé — le recharger couperait la
 * lecture. À appeler juste avant de créer le Howl.
 *
 * Si un élément passe malgré tout sans CORS, l'analyse est simplement ignorée
 * pour ce morceau (voir tapAudioElement) : le son n'est jamais compromis.
 */
export function primeAudioPool(src: string): void {
  if (unavailable || sameOrigin(src)) return;
  const pool = (Howler as unknown as { _html5AudioPool?: HTMLAudioElement[] })
    ._html5AudioPool;
  if (!pool) return;
  for (const audio of pool) audio.crossOrigin = 'anonymous';
  // Pool vide (premier morceau, avant le déverrouillage Howler) : on fournit
  // l'élément nous-mêmes, sinon Howler en crée un sans CORS.
  if (!pool.length) {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    pool.push(audio);
  }
}

/** Branche l'analyseur sur l'élément audio du morceau en cours. */
export function tapAudioElement(
  node: HTMLMediaElement | null | undefined,
  src: string,
): void {
  if (unavailable || !node) return;
  // Cross-origin non passé en mode CORS : l'analyse ne donnerait que du silence.
  if (!sameOrigin(src) && node.crossOrigin !== 'anonymous') return;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      unavailable = true;
      return;
    }
    if (!ctx || !analyser) {
      // Contexte dédié : celui de Howler est mis en veille au bout de 30 s
      // quand seuls des sons html5 jouent, ce qui couperait le son routé ici.
      ctx = new Ctor();
      // Une mise en veille du contexte couperait le son : on le relance.
      ctx.addEventListener('statechange', () => {
        if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
      });
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.55;
      analyser.connect(ctx.destination);
      spectrum = new Uint8Array(analyser.frequencyBinCount);
    }
  } catch {
    // Navigateur récalcitrant : on reste sur l'animation purement CSS.
    unavailable = true;
    return;
  }
  if (!tapped.has(node)) {
    try {
      const source = ctx.createMediaElementSource(node);
      source.connect(analyser);
      tapped.set(node, source);
    } catch {
      // Élément déjà relié à un autre contexte : on le laisse tel quel.
      return;
    }
  }
  void ctx.resume().catch(() => {});
}

/** Réveille le contexte (suspendu par le navigateur hors geste utilisateur). */
export function resumeAudioAnalyser(): void {
  if (ctx?.state === 'suspended') void ctx.resume().catch(() => {});
}

function bandLevel(from: number, to: number, binHz: number): number {
  if (!spectrum) return 0;
  const a = Math.max(0, Math.floor(from / binHz));
  const b = Math.min(spectrum.length - 1, Math.ceil(to / binHz));
  if (b <= a) return 0;
  let sum = 0;
  for (let i = a; i <= b; i += 1) sum += spectrum[i];
  return sum / (b - a + 1) / 255;
}

/** Niveaux 0..1 par bande, ou null si l'analyse n'est pas disponible. */
export function readAudioLevels(): AudioLevels | null {
  if (!analyser || !spectrum || !ctx) return null;
  analyser.getByteFrequencyData(spectrum);
  const binHz = ctx.sampleRate / analyser.fftSize;
  const bass = bandLevel(30, 180, binHz);
  const mid = bandLevel(180, 2000, binHz);
  const treble = bandLevel(2000, 9000, binHz);
  return {
    bass,
    mid,
    treble,
    level: bass * 0.5 + mid * 0.35 + treble * 0.15,
  };
}

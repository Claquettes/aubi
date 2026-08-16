import { useEffect } from 'react';
import type { RefObject } from 'react';
import { readAudioLevels, resumeAudioAnalyser } from './audioAnalyser';

const VARS = [
  '--audio-bass',
  '--audio-mid',
  '--audio-treble',
  '--audio-level',
  '--audio-beat',
] as const;

/** Lissage exponentiel : montée rapide, descente plus douce. */
function smooth(
  current: number,
  target: number,
  dt: number,
  attack: number,
  release: number,
): number {
  const tau = target > current ? attack : release;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** Plage récente d'une bande, pour ramener le niveau brut sur 0..1. */
interface Range {
  lo: number;
  hi: number;
}

/**
 * Normalisation adaptative : la musique moderne est très compressée et sature
 * les graves autour de 0,9. En suivant le minimum et le maximum récents, on
 * étale la dynamique réelle du morceau sur toute la plage 0..1, ce qui rend le
 * fond nettement plus vivant sans devenir épileptique sur un morceau calme.
 */
function normalize(range: Range, raw: number, dt: number): number {
  const k = 1 - Math.exp(-dt / 3.5);
  range.hi = raw > range.hi ? raw : range.hi + (raw - range.hi) * k;
  range.lo = raw < range.lo ? raw : range.lo + (raw - range.lo) * k;
  if (range.hi < 0.06) return 0; // silence : rien à animer
  const span = Math.max(range.hi - range.lo, 0.1);
  return Math.min(1, Math.max(0, (raw - range.lo) / span));
}

/**
 * Écrit les niveaux audio dans des variables CSS (--audio-bass, --audio-beat…)
 * sur l'élément passé, à chaque frame. Le CSS s'en sert pour faire respirer le
 * fond au rythme de la musique. Sans analyse disponible, tout retombe à 0 et
 * seules les animations CSS de base continuent.
 */
export function useAudioPulse(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    resumeAudioAnalyser();

    let raf = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let level = 0;
    let beat = 0;
    let bassAvg = 0;
    let lastBeatAt = 0;
    let last = performance.now();
    const ranges: Record<'bass' | 'mid' | 'treble' | 'level', Range> = {
      bass: { lo: 1, hi: 0 },
      mid: { lo: 1, hi: 0 },
      treble: { lo: 1, hi: 0 },
      level: { lo: 1, hi: 0 },
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) || 0.016;
      last = now;
      const s = readAudioLevels();

      // Dynamique relative × intensité absolue : un passage calme reste calme.
      const gain = s ? 0.35 + 0.65 * s.level : 0;
      const target = {
        bass: s ? normalize(ranges.bass, s.bass, dt) * gain : 0,
        mid: s ? normalize(ranges.mid, s.mid, dt) * gain : 0,
        treble: s ? normalize(ranges.treble, s.treble, dt) * gain : 0,
        level: s ? normalize(ranges.level, s.level, dt) * gain : 0,
      };

      // Attaque franche, retour lent : le mouvement suit la musique sans
      // jamais saccader.
      bass = smooth(bass, target.bass, dt, 0.06, 0.34);
      mid = smooth(mid, target.mid, dt, 0.11, 0.5);
      treble = smooth(treble, target.treble, dt, 0.08, 0.42);
      level = smooth(level, target.level, dt, 0.12, 0.6);

      // Beat = pic de grave nettement au-dessus de la moyenne glissante.
      bassAvg += (bass - bassAvg) * (1 - Math.exp(-dt / 1.1));
      if (bass > bassAvg + 0.18 && now - lastBeatAt > 230) {
        beat = 1;
        lastBeatAt = now;
      }
      beat *= Math.exp(-dt / 0.26);

      el.style.setProperty('--audio-bass', bass.toFixed(3));
      el.style.setProperty('--audio-mid', mid.toFixed(3));
      el.style.setProperty('--audio-treble', treble.toFixed(3));
      el.style.setProperty('--audio-level', level.toFixed(3));
      el.style.setProperty('--audio-beat', beat.toFixed(3));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const v of VARS) el.style.removeProperty(v);
    };
  }, [ref, active]);
}

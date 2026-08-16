import { useEffect, useState } from 'react';
import { apiUrl } from '@/api/client';

/**
 * Variables --art-* dérivées d'une pochette. Elles NE recolorent PAS le texte
 * principal : elles alimentent fonds dynamiques, boutons, progression, focus et
 * états actifs. Le reste (surfaces, bordures) est dérivé en CSS via color-mix.
 */
export type CoverTheme = Record<string, string>;

const cache = new Map<string, CoverTheme>();

export function useCoverPalette(
  src: string | null | undefined,
): CoverTheme | null {
  const [theme, setTheme] = useState<CoverTheme | null>(() =>
    src ? (cache.get(apiUrl(src)) ?? null) : null,
  );

  useEffect(() => {
    if (!src) {
      setTheme(null);
      return;
    }
    const url = apiUrl(src);
    const cached = cache.get(url);
    if (cached) {
      setTheme(cached);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = url;
    img.onload = () => {
      if (cancelled) return;
      try {
        const t = buildTheme(img);
        cache.set(url, t);
        if (!cancelled) setTheme(t);
      } catch {
        /* image tainted : on garde le thème par défaut */
      }
    };
    return () => {
      cancelled = true;
    };
  }, [src]);

  return theme;
}

type RGB = [number, number, number];

function buildTheme(img: HTMLImageElement): CoverTheme {
  const { primary, secondary, tertiary, extra } = extractPalette(img);
  const { action, ink: actionInk } = correctAction(secondary);

  // Teinte de thème = la plus saturée entre dominante et vibrante.
  const pHsl = rgbToHsl(primary[0], primary[1], primary[2]);
  const sHsl = rgbToHsl(secondary[0], secondary[1], secondary[2]);
  const base = sHsl[1] >= pHsl[1] ? sHsl : pHsl;
  const H = base[0];
  const S = base[1];
  const bgS = Math.min(S, 0.5); // saturation des fonds sombres
  const inkS = Math.min(S, 0.28); // saturation (faible) des textes clairs
  const hx = (h: number, s: number, l: number) => rgbToHex(hslToRgb(h, s, l));

  // Toute la palette est dérivée de la pochette : fonds sombres teintés,
  // textes/icônes clairs teintés (contraste AA garanti car fond sombre + texte
  // clair), lignes teintées. Une pochette N&B donne des gris neutres.
  return {
    '--color-canvas': hx(H, bgS * 0.9, 0.07),
    '--color-paper': hx(H, bgS * 0.85, 0.105),
    '--color-paper-raised': hx(H, bgS * 0.78, 0.15),
    '--color-paper-high': hx(H, bgS * 0.7, 0.2),
    '--color-ink': hx(H, inkS * 0.4, 0.95),
    '--color-ink-soft': hx(H, inkS * 0.75, 0.8),
    '--color-ink-muted': hx(H, inkS * 0.85, 0.64),
    '--color-hairline': `color-mix(in oklab, ${hx(H, bgS, 0.5)} 40%, transparent)`,
    '--color-hairline-strong': `color-mix(in oklab, ${hx(H, bgS, 0.6)} 52%, transparent)`,
    '--color-accent': rgbToHex(action),
    '--art-primary': rgbToHex(primary),
    '--art-secondary': rgbToHex(secondary),
    '--art-tertiary': rgbToHex(tertiary),
    // Teintes supplémentaires (fond ambiant) : d'autres couleurs présentes
    // dans la pochette, choisies aussi éloignées que possible les unes des
    // autres, complétées par des variantes si la pochette en manque.
    '--art-4': rgbToHex(extra[0]),
    '--art-5': rgbToHex(extra[1]),
    '--art-6': rgbToHex(extra[2]),
    '--art-action': rgbToHex(action),
    '--art-action-ink': rgbToHex(actionInk),
  };
}

/**
 * Corrige une couleur en "action" utilisable : luminosité bornée, chroma
 * bornée (pas de fluo), puis contraste >= 4.5:1 garanti avec son encre
 * (blanc cassé ou presque-noir), en poussant la luminosité si nécessaire.
 */
function correctAction(base: RGB): { action: RGB; ink: RGB } {
  const inkLight: RGB = [244, 237, 228];
  const inkDark: RGB = [24, 25, 38];
  let [h, s, l] = rgbToHsl(base[0], base[1], base[2]);
  // Pas de plancher de saturation : une pochette N&B garde une action neutre,
  // jamais recolorée par l'accent par défaut.
  s = Math.min(s, 0.82);
  l = Math.max(0.42, Math.min(l, 0.72));

  for (let i = 0; i < 14; i++) {
    const action = hslToRgb(h, s, l);
    const la = relLum(action);
    const cLight = contrast(la, relLum(inkLight));
    const cDark = contrast(la, relLum(inkDark));
    if (cLight >= 4.5 || cDark >= 4.5) {
      return { action, ink: cLight >= cDark ? inkLight : inkDark };
    }
    l = l <= 0.5 ? Math.max(0.28, l - 0.05) : Math.min(0.82, l + 0.05);
  }
  const action = hslToRgb(h, s, l);
  return {
    action,
    ink:
      contrast(relLum(action), relLum(inkLight)) >=
      contrast(relLum(action), relLum(inkDark))
        ? inkLight
        : inkDark,
  };
}

/** Deux couleurs assez proches pour former la même tache à l'écran. */
function near(a: RGB, b: RGB): boolean {
  return (
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40
  );
}

/** Retire les couleurs trop proches les unes des autres. */
function dedupe(colors: RGB[]): RGB[] {
  const out: RGB[] = [];
  for (const c of colors) {
    if (!out.some((o) => near(o, c))) out.push(c);
  }
  return out.length ? out : colors.slice(0, 1);
}

/**
 * Complète une palette jusqu'à `count` couleurs : on garde les teintes
 * réellement présentes dans la pochette, puis on décale la teinte des
 * couleurs retenues pour obtenir des variantes proches mais distinctes. Une
 * pochette bicolore donne ainsi quand même un fond nuancé.
 */
function widenPalette(base: RGB[], count: number): RGB[] {
  const out = dedupe(base);
  const shifts = [26, -26, 48, -48, 72, -72];
  for (let i = 0; out.length < count; i += 1) {
    const src = base[i % base.length];
    const [h, s, l] = rgbToHsl(src[0], src[1], src[2]);
    const shift = shifts[Math.floor(i / base.length) % shifts.length];
    out.push(hslToRgb((h + shift + 360) % 360, s, l));
  }
  return out.slice(0, count);
}

function extractPalette(img: HTMLImageElement): {
  primary: RGB;
  secondary: RGB;
  tertiary: RGB;
  /** Trois teintes de plus, pour le fond ambiant. */
  extra: RGB[];
} {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no ctx');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  type Bin = { count: number; r: number; g: number; b: number; sat: number };
  const bins = new Map<number, Bin>();
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  let satCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 128) continue;
    n += 1;
    sr += r;
    sg += g;
    sb += b;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.06 || l > 0.97) continue;
    if (s < 0.16) continue;
    satCount += 1;
    const key = Math.round(h / 15) % 24;
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0, sat: 0 };
    bin.count += 1;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bin.sat += s;
    bins.set(key, bin);
  }

  const avg = (bin: Bin): RGB => [
    Math.round(bin.r / bin.count),
    Math.round(bin.g / bin.count),
    Math.round(bin.b / bin.count),
  ];
  const list = [...bins.values()];

  // Pochette colorée : palette par teintes dominantes.
  if (n > 0 && satCount / n > 0.04 && list.length) {
    const vibrancy = (b: Bin) => (b.sat / b.count) * Math.log(b.count + 1);
    const dominant = list.reduce((a, b) => (b.count > a.count ? b : a));
    const byVibrancy = [...list].sort((a, b) => vibrancy(b) - vibrancy(a));
    const secondary = byVibrancy[0] ?? dominant;
    const tertiary =
      byVibrancy.find((b) => b !== secondary && b !== dominant) ??
      byVibrancy[1] ??
      dominant;

    // Teintes suivantes : on prend les plus vives encore éloignées d'au moins
    // 40° de celles déjà retenues, pour éviter six variantes du même orange.
    const picked = [dominant, secondary, tertiary];
    const hueOf = (b: Bin) => rgbToHsl(...avg(b))[0];
    const hues = picked.map(hueOf);
    for (const bin of byVibrancy) {
      if (picked.length >= 6) break;
      if (picked.includes(bin)) continue;
      const h = hueOf(bin);
      const far = hues.every((k) => {
        const d = Math.abs(((h - k + 540) % 360) - 180);
        return 180 - d >= 40;
      });
      if (far) {
        picked.push(bin);
        hues.push(h);
      }
    }
    // Les trois premières restent celles du thème actuel (elles pilotent
    // fonds, accent et boutons) ; les extras sont les autres teintes trouvées,
    // complétées par des variantes si la pochette n'en offre pas assez.
    const raw = picked.map(avg);
    const rest = widenPalette(raw, 9).filter(
      (c) => !raw.slice(0, 3).some((b) => near(b, c)),
    );
    return {
      primary: raw[0],
      secondary: raw[1],
      tertiary: raw[2],
      extra: widenPalette(rest.length ? rest : raw, 3),
    };
  }

  // Pochette monochrome (N&B) : palette NEUTRE dérivée de sa teinte moyenne,
  // pas de repli sur la couleur d'accent par défaut.
  if (n === 0) {
    const base: RGB[] = [
      [56, 56, 68],
      [150, 150, 165],
      [96, 96, 110],
    ];
    return {
      primary: base[0],
      secondary: base[1],
      tertiary: base[2],
      extra: widenPalette(base, 6).slice(3),
    };
  }
  const [mh, msRaw] = rgbToHsl(sr / n, sg / n, sb / n);
  const ms = Math.min(msRaw, 0.14);
  const mono: RGB[] = [
    hslToRgb(mh, ms, 0.32),
    hslToRgb(mh, ms, 0.68),
    hslToRgb(mh, ms, 0.5),
  ];
  return {
    primary: mono[0],
    secondary: mono[1],
    tertiary: mono[2],
    // Pochette neutre : on nuance par la luminosité plutôt que par la teinte.
    extra: [
      hslToRgb(mh, ms, 0.24),
      hslToRgb(mh, ms, 0.58),
      hslToRgb(mh, ms, 0.42),
    ],
  };
}

function relLum([r, g, b]: RGB): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHex([r, g, b]: RGB) {
  const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

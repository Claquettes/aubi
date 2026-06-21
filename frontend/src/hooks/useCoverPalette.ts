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
  const { primary, secondary, tertiary } = extractPalette(img);
  const { action, ink } = correctAction(secondary, primary);
  return {
    '--art-primary': rgbToHex(primary),
    '--art-secondary': rgbToHex(secondary),
    '--art-tertiary': rgbToHex(tertiary),
    '--art-action': rgbToHex(action),
    '--art-action-ink': rgbToHex(ink),
  };
}

/**
 * Corrige une couleur en "action" utilisable : luminosité bornée, chroma
 * bornée (pas de fluo), puis contraste >= 4.5:1 garanti avec son encre
 * (blanc cassé ou presque-noir), en poussant la luminosité si nécessaire.
 */
function correctAction(vibrant: RGB, fallback: RGB): { action: RGB; ink: RGB } {
  const inkLight: RGB = [244, 237, 228];
  const inkDark: RGB = [24, 25, 38];
  const src = saturation(vibrant) > 0.14 ? vibrant : fallback;
  let [h, s, l] = rgbToHsl(src[0], src[1], src[2]);
  s = Math.max(0.35, Math.min(s, 0.82));
  l = Math.max(0.42, Math.min(l, 0.72));

  for (let i = 0; i < 12; i++) {
    const action = hslToRgb(h, s, l);
    const la = relLum(action);
    const cLight = contrast(la, relLum(inkLight));
    const cDark = contrast(la, relLum(inkDark));
    if (cLight >= 4.5 || cDark >= 4.5) {
      return { action, ink: cLight >= cDark ? inkLight : inkDark };
    }
    // Contraste insuffisant : rapprocher d'une extrémité pour l'augmenter.
    l = l <= 0.5 ? Math.max(0.3, l - 0.05) : Math.min(0.82, l + 0.05);
  }
  const action = hslToRgb(h, s, l);
  return {
    action,
    ink: contrast(relLum(action), relLum(inkLight)) >= contrast(relLum(action), relLum(inkDark))
      ? inkLight
      : inkDark,
  };
}

function extractPalette(img: HTMLImageElement): {
  primary: RGB;
  secondary: RGB;
  tertiary: RGB;
} {
  const size = 44;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no ctx');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  type Bin = { count: number; r: number; g: number; b: number; sat: number };
  const bins = new Map<number, Bin>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 128) continue;
    const [, s, l] = rgbToHsl(r, g, b);
    if (l < 0.06 || l > 0.97) continue;
    if (s < 0.1) continue;
    const [h] = rgbToHsl(r, g, b);
    const key = Math.round(h / 15) % 24;
    const bin = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0, sat: 0 };
    bin.count += 1;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bin.sat += s;
    bins.set(key, bin);
  }

  const list = [...bins.values()];
  if (!list.length) {
    return {
      primary: [70, 68, 90],
      secondary: [198, 160, 246],
      tertiary: [138, 173, 244],
    };
  }
  const avg = (bin: Bin): RGB => [
    Math.round(bin.r / bin.count),
    Math.round(bin.g / bin.count),
    Math.round(bin.b / bin.count),
  ];
  const vibrancy = (b: Bin) => (b.sat / b.count) * Math.log(b.count + 1);
  const dominant = list.reduce((a, b) => (b.count > a.count ? b : a));
  const byVibrancy = [...list].sort((a, b) => vibrancy(b) - vibrancy(a));
  const secondary = byVibrancy[0] ?? dominant;
  const tertiary =
    byVibrancy.find((b) => b !== secondary && b !== dominant) ??
    byVibrancy[1] ??
    dominant;
  return {
    primary: avg(dominant),
    secondary: avg(secondary),
    tertiary: avg(tertiary),
  };
}

function saturation(rgb: RGB): number {
  return rgbToHsl(rgb[0], rgb[1], rgb[2])[1];
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

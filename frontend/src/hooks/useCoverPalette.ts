import { useEffect, useState } from 'react';
import { apiUrl } from '@/api/client';

/** Map de variables CSS à appliquer sur :root pour reteinter toute l'app. */
export type CoverTheme = Record<string, string>;

const cache = new Map<string, CoverTheme>();

/**
 * Construit un thème sombre cohérent (fond, surfaces, texte, accent) à partir
 * des 2-3 couleurs dominantes d'une pochette — façon Apple Music.
 */
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

function buildTheme(img: HTMLImageElement): CoverTheme {
  const { bg, accent } = extractPalette(img);
  const [bh, bsRaw] = rgbToHsl(bg[0], bg[1], bg[2]);
  const bs = Math.min(bsRaw, 0.5);
  const [ah, asRaw, al] = rgbToHsl(accent[0], accent[1], accent[2]);
  const as = Math.max(0.55, Math.min(asRaw, 0.95));
  const accentL = Math.max(0.58, Math.min(al, 0.72));

  const hx = (h: number, s: number, l: number) => rgbToHex(hslToRgb(h, s, l));
  const accentHex = hx(ah, as, accentL);
  const mantle = hx(bh, bs * 0.85, 0.07);

  return {
    '--color-bg-crust': hx(bh, bs * 0.85, 0.05),
    '--color-bg-mantle': mantle,
    '--color-bg-base': hx(bh, bs, 0.1),
    '--color-bg-subtle': hx(bh, bs * 0.8, 0.16),
    '--color-bg-elevated': hx(bh, bs * 0.8, 0.16),
    '--color-bg-overlay': hx(bh, bs * 0.75, 0.22),
    '--color-border': hx(bh, bs * 0.65, 0.27),
    '--color-border-focus': hx(bh, bs * 0.6, 0.4),
    '--color-text-primary': hx(bh, 0.12, 0.96),
    '--color-text-secondary': hx(bh, 0.1, 0.73),
    '--color-text-tertiary': hx(bh, 0.1, 0.52),
    '--color-accent': accentHex,
    '--color-accent-dim': hx(ah, as, Math.max(0.42, accentL - 0.16)),
    '--color-accent-subtle': hx(ah, as * 0.5, 0.16),
    '--color-playing': accentHex,
    '--color-on-accent': hx(ah, Math.min(as, 0.5), 0.1),
    '--glass-bg': `color-mix(in srgb, ${mantle} 78%, transparent)`,
  };
}

function extractPalette(img: HTMLImageElement): {
  bg: [number, number, number];
  accent: [number, number, number];
} {
  const size = 44;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no ctx');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Bins par teinte : couleur dominante (max count) + accent (max saturation×count).
  type Bin = { count: number; r: number; g: number; b: number; sat: number };
  const bins = new Map<number, Bin>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (data[i + 3] < 128) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.06 || l > 0.97) continue;
    if (s < 0.12) continue;
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
    return { bg: [70, 68, 90], accent: [198, 160, 246] };
  }
  const avg = (bin: Bin): [number, number, number] => [
    Math.round(bin.r / bin.count),
    Math.round(bin.g / bin.count),
    Math.round(bin.b / bin.count),
  ];
  const dominant = list.reduce((a, b) => (b.count > a.count ? b : a));
  const vibrant = list.reduce((a, b) =>
    (b.sat / b.count) * Math.log(b.count + 1) >
    (a.sat / a.count) * Math.log(a.count + 1)
      ? b
      : a,
  );
  return { bg: avg(dominant), accent: avg(vibrant) };
}

function rgbToHex([r, g, b]: [number, number, number]) {
  const h = (n: number) => n.toString(16).padStart(2, '0');
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

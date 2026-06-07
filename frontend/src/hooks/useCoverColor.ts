import { useEffect, useState } from 'react';
import { apiUrl } from '@/api/client';

const cache = new Map<string, string>();

/**
 * Extrait une couleur d'accent vibrante d'une pochette (same-origin → pas de
 * taint canvas). Résultat mis en cache par URL. Renvoie null tant qu'indisponible
 * (les composants retombent alors sur l'accent Catppuccin par défaut).
 */
export function useCoverColor(src: string | null | undefined): string | null {
  const [color, setColor] = useState<string | null>(() =>
    src ? (cache.get(apiUrl(src)) ?? null) : null,
  );

  useEffect(() => {
    if (!src) {
      setColor(null);
      return;
    }
    const url = apiUrl(src);
    const cached = cache.get(url);
    if (cached) {
      setColor(cached);
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
        const c = extractAccent(img);
        cache.set(url, c);
        if (!cancelled) setColor(c);
      } catch {
        /* image tainted / erreur : on garde le défaut */
      }
    };
    return () => {
      cancelled = true;
    };
  }, [src]);

  return color;
}

function extractAccent(img: HTMLImageElement): string {
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no ctx');
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Bin par teinte, on retient la teinte dominante pondérée par saturation.
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.12 || l > 0.92) continue; // ignore quasi noir/blanc
    if (s < 0.15) continue; // ignore les gris
    const key = Math.round(h / 15); // 24 bins de teinte
    const weight = s * (1 - Math.abs(l - 0.55));
    const cur = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    cur.count += weight;
    cur.r += r * weight;
    cur.g += g * weight;
    cur.b += b * weight;
    bins.set(key, cur);
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bin of bins.values()) {
    if (!best || bin.count > best.count) best = bin;
  }
  if (!best || best.count === 0) return 'rgb(198, 160, 246)'; // fallback mauve

  let r = Math.round(best.r / best.count);
  let g = Math.round(best.g / best.count);
  let b = Math.round(best.b / best.count);

  // Ajuste pour un accent lisible sur fond sombre : saturé, luminosité mi-haute.
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.min(1, Math.max(0.5, s));
  l = Math.min(0.72, Math.max(0.58, l));
  [r, g, b] = hslToRgb(h, s, l);
  return `rgb(${r}, ${g}, ${b})`;
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

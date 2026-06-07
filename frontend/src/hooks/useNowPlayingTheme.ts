import { useEffect } from 'react';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useCoverPalette } from './useCoverPalette';

/** Toutes les variables que le thème "en lecture" peut surcharger. */
const THEME_KEYS = [
  '--color-bg-crust',
  '--color-bg-mantle',
  '--color-bg-base',
  '--color-bg-subtle',
  '--color-bg-elevated',
  '--color-bg-overlay',
  '--color-border',
  '--color-border-focus',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-tertiary',
  '--color-accent',
  '--color-accent-dim',
  '--color-accent-subtle',
  '--color-playing',
  '--color-on-accent',
  '--glass-bg',
];

/**
 * Reteinte TOUTE l'application aux couleurs de la pochette du titre en cours
 * (fond, surfaces, texte, accent) — comme Apple Music. Retour à Catppuccin
 * Macchiato quand plus rien ne joue.
 */
export function useNowPlayingTheme() {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const theme = useCoverPalette(coverUrl);

  useEffect(() => {
    const root = document.documentElement;
    if (!coverUrl) {
      // Plus de titre → on retire les surcharges (retour Macchiato).
      for (const k of THEME_KEYS) root.style.removeProperty(k);
      root.removeAttribute('data-np');
      return;
    }
    if (theme) {
      for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v);
      root.setAttribute('data-np', '');
    }
  }, [coverUrl, theme]);
}

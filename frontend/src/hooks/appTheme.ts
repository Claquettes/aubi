import { useEffect } from 'react';
import { create } from 'zustand';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useCoverPalette } from './useCoverPalette';

/** Pochette de la page actuellement consultée (album/artiste/collection…). */
interface ThemeState {
  viewedCover: string | null;
  setViewedCover: (url: string | null) => void;
}
export const useThemeStore = create<ThemeState>((set) => ({
  viewedCover: null,
  setViewedCover: (viewedCover) => set({ viewedCover }),
}));

const THEME_KEYS = [
  '--color-canvas',
  '--color-paper',
  '--color-paper-raised',
  '--color-paper-high',
  '--color-ink',
  '--color-ink-soft',
  '--color-ink-muted',
  '--color-hairline',
  '--color-hairline-strong',
  '--color-accent',
  '--art-primary',
  '--art-secondary',
  '--art-tertiary',
  '--art-action',
  '--art-action-ink',
];

/**
 * Pose les couleurs de pochette (--art-*) sur :root. Priorité : page consultée
 * (album/artiste ouvert) > titre en cours de lecture > défaut (accent papier).
 * Le texte principal reste encre ; seuls fonds/boutons/états actifs se teintent.
 */
export function useAppTheme() {
  const viewedCover = useThemeStore((s) => s.viewedCover);
  const nowPlaying = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const active = viewedCover ?? nowPlaying ?? null;
  const theme = useCoverPalette(active);

  useEffect(() => {
    const root = document.documentElement;
    if (!active) {
      for (const k of THEME_KEYS) root.style.removeProperty(k);
      root.removeAttribute('data-themed');
      return;
    }
    if (theme) {
      for (const [k, v] of Object.entries(theme)) root.style.setProperty(k, v);
      root.setAttribute('data-themed', '');
    }
  }, [active, theme]);
}

/** À appeler sur une page d'entité : teinte l'app à sa pochette tant qu'elle est ouverte. */
export function usePageTheme(coverUrl: string | null | undefined) {
  const setViewedCover = useThemeStore((s) => s.setViewedCover);
  useEffect(() => {
    setViewedCover(coverUrl ?? null);
    return () => setViewedCover(null);
  }, [coverUrl, setViewedCover]);
}

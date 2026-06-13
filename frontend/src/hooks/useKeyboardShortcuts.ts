import { useEffect } from 'react';
import { usePlayerStore } from '@/features/player/usePlayerStore';

/** Espace = play/pause, Maj+← / Maj+→ = précédent / suivant. */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      ) {
        return;
      }
      const s = usePlayerStore.getState();
      if (e.code === 'Space') {
        if (!s.currentTrack) return;
        e.preventDefault();
        s.togglePlay();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        s.next();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        s.prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

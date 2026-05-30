import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { likesApi } from '@/api/likes';
import type { Track } from '@/types/api';

/** Toggle optimiste du like d'un titre. Ignore les erreurs réseau (app perso). */
export function useToggleLike(track: Track) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(track.isLiked);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setPending(true);
    try {
      if (next) await likesApi.like(track.id);
      else await likesApi.unlike(track.id);
    } catch {
      /* 409 (déjà liké) ou réseau : on garde l'état optimiste */
    } finally {
      setPending(false);
      qc.invalidateQueries({ queryKey: ['likes'] });
    }
  };

  return { liked, toggle };
}

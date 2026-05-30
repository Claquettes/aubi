import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { likesApi } from '@/api/likes';

type Kind = 'album' | 'artist';

/** Toggle optimiste du like d'un album ou d'un artiste. */
export function useToggleEntityLike(kind: Kind, id: string, initial: boolean) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(initial);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setPending(true);
    try {
      if (kind === 'album') {
        if (next) await likesApi.likeAlbum(id);
        else await likesApi.unlikeAlbum(id);
      } else {
        if (next) await likesApi.likeArtist(id);
        else await likesApi.unlikeArtist(id);
      }
    } catch {
      /* 409 / réseau : on garde l'état optimiste */
    } finally {
      setPending(false);
      qc.invalidateQueries({ queryKey: [kind === 'album' ? 'albums' : 'artists'] });
      qc.invalidateQueries({ queryKey: [kind, id] });
    }
  };

  return { liked, toggle };
}

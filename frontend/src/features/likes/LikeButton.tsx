import { Heart } from 'lucide-react';
import type { Track } from '@/types/api';
import { useToggleLike } from './useLikes';

export function LikeButton({ track, size = 16 }: { track: Track; size?: number }) {
  const { liked, toggle } = useToggleLike(track);
  return (
    <button
      type="button"
      aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={liked}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        padding: 4,
        color: liked ? 'var(--color-like)' : 'var(--color-text-tertiary)',
      }}
    >
      <Heart size={size} fill={liked ? 'var(--color-like)' : 'none'} />
    </button>
  );
}

import { Heart } from 'lucide-react';
import { useToggleEntityLike } from './useToggleEntityLike';

export function EntityLikeButton({
  kind,
  id,
  isLiked,
  size = 16,
  className = '',
}: {
  kind: 'album' | 'artist';
  id: string;
  isLiked: boolean;
  size?: number;
  className?: string;
}) {
  const { liked, toggle } = useToggleEntityLike(kind, id, isLiked);
  return (
    <button
      type="button"
      className={className}
      aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={liked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      style={{
        cursor: 'pointer',
        display: 'flex',
        color: liked ? 'var(--color-like)' : undefined,
      }}
    >
      <Heart size={size} fill={liked ? 'var(--color-like)' : 'none'} />
    </button>
  );
}

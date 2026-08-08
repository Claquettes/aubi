import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { useSelection } from '@/features/selection/selectionStore';
import type { Album } from '@/types/api';
import { AlbumContextMenu } from './AlbumContextMenu';
import styles from './library.module.css';

export function AlbumCard({ album }: { album: Album }) {
  const selActive = useSelection((s) => s.active && s.kind === 'album');
  const selected = useSelection((s) => s.ids.has(album.id));
  const toggleSel = useSelection((s) => s.toggle);

  return (
    <Link
      to={`/music/albums/${album.id}`}
      className={`${styles.card} ${selActive && selected ? styles.cardSelected : ''}`}
      // En mode sélection, la vignette coche au lieu d'ouvrir l'album.
      onClick={
        selActive
          ? (e) => {
              e.preventDefault();
              toggleSel(album.id, 'album');
            }
          : undefined
      }
    >
      <div className={styles.cardCover}>
        <div className={styles.coverImg}>
          <CoverArt src={album.coverUrl} label={album.title} size="fill" />
        </div>
        {selActive ? (
          <span
            className={`${styles.cardCheck} ${selected ? styles.cardCheckOn : ''}`}
            aria-hidden="true"
          >
            {selected && <Check size={14} />}
          </span>
        ) : (
          <>
            <AlbumContextMenu album={album} />
            <EntityLikeButton
              kind="album"
              id={album.id}
              isLiked={album.isLiked}
              className={`${styles.cardLike} ${album.isLiked ? styles.cardLikeActive : ''}`}
            />
          </>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{album.title}</div>
        <div className={styles.cardSub}>
          {album.isCompilation
            ? `Artistes variés · ${album.trackCount} titres`
            : `${album.artist?.name ?? '—'}${album.year ? ` · ${album.year}` : ''}`}
        </div>
      </div>
    </Link>
  );
}

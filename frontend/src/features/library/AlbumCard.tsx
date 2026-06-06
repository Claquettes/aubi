import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import type { Album } from '@/types/api';
import styles from './library.module.css';

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link to={`/music/albums/${album.id}`} className={styles.card}>
      <div className={styles.cardCover}>
        <CoverArt src={album.coverUrl} label={album.title} size="lg" />
        <EntityLikeButton
          kind="album"
          id={album.id}
          isLiked={album.isLiked}
          className={`${styles.cardLike} ${album.isLiked ? styles.cardLikeActive : ''}`}
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{album.title}</div>
        <div className={styles.cardSub}>
          {album.artist?.name ?? '—'}
          {album.year ? ` · ${album.year}` : ''}
        </div>
      </div>
    </Link>
  );
}

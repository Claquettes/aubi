import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import type { Artist } from '@/types/api';
import styles from './library.module.css';

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link to={`/music/artists/${artist.id}`} className={styles.card}>
      <div className={styles.cardCover}>
        <CoverArt src={artist.coverUrl} label={artist.name} size="lg" />
        <EntityLikeButton
          kind="artist"
          id={artist.id}
          isLiked={artist.isLiked}
          className={`${styles.cardLike} ${artist.isLiked ? styles.cardLikeActive : ''}`}
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{artist.name}</div>
        <div className={styles.cardSub}>
          {artist.albumCount} album{artist.albumCount > 1 ? 's' : ''} ·{' '}
          {artist.trackCount} titres
        </div>
      </div>
    </Link>
  );
}

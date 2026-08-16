import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { useT } from '@/i18n';
import type { Artist } from '@/types/api';
import styles from './library.module.css';

export function ArtistCard({ artist }: { artist: Artist }) {
  const t = useT();
  return (
    <Link to={`/music/artists/${artist.id}`} className={styles.card}>
      <div className={styles.cardCover}>
        <div className={styles.coverImg}>
          <CoverArt src={artist.coverUrl} label={artist.name} size="fill" />
        </div>
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
          {t('count.albums', { count: artist.albumCount })} ·{' '}
          {t('count.tracks', { count: artist.trackCount })}
        </div>
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { useT } from '@/i18n';
import type { Playlist } from '@/types/api';
import styles from '@/features/library/library.module.css';

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const t = useT();
  return (
    <Link to={`/playlists/${playlist.id}`} className={styles.card}>
      <CoverArt src={playlist.coverUrl} label={playlist.name} size="lg" />
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{playlist.name}</div>
        <div className={styles.cardSub}>
          {t('count.tracks', { count: playlist.trackCount })}
        </div>
      </div>
    </Link>
  );
}

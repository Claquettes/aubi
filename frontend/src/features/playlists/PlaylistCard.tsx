import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import type { Playlist } from '@/types/api';
import styles from '@/features/library/library.module.css';

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link to={`/playlists/${playlist.id}`} className={styles.card}>
      <CoverArt src={playlist.coverUrl} label={playlist.name} size="lg" />
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{playlist.name}</div>
        <div className={styles.cardSub}>
          {playlist.trackCount} titre{playlist.trackCount > 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  );
}

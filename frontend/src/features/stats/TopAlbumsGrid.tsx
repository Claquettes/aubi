import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import type { TopAlbum } from '@/types/api';
import { duration, int, percent, plural } from './statsFormat';
import styles from './stats.module.css';

/** Podium d'albums : pochette, rang, et la part de l'album réellement parcourue. */
export function TopAlbumsGrid({ items }: { items: TopAlbum[] }) {
  return (
    <div className={styles.albumGrid}>
      {items.map((it, i) => (
        <Link
          key={it.album.id}
          to={`/music/albums/${it.album.id}`}
          className={styles.albumCard}
        >
          <div className={styles.albumCover}>
            <CoverArt
              src={it.album.coverUrl}
              label={it.album.title}
              size="fill"
            />
            <span className={styles.albumRank}>{i + 1}</span>
          </div>
          <div className={styles.albumTitle}>{it.album.title}</div>
          <div className={styles.albumSub}>
            {it.album.artist?.name ?? 'Artistes divers'}
            {it.album.year ? ` · ${it.album.year}` : ''}
          </div>
          <div className={styles.albumStats}>
            <strong>{int(it.playCount)}</strong> lecture
            {plural(it.playCount)} · {duration(it.totalListenedMs)}
          </div>
          <div className={styles.albumMeter} aria-hidden="true">
            <div
              className={styles.albumMeterFill}
              style={{ width: `${Math.max(2, it.coverage * 100)}%` }}
            />
          </div>
          <div className={styles.albumSub}>
            {percent(it.coverage)} de l'album parcouru
            {it.albumPlayCount > 0 &&
              ` · ${int(it.albumPlayCount)} lancement${plural(it.albumPlayCount)}`}
          </div>
        </Link>
      ))}
    </div>
  );
}

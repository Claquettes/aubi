import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { useT } from '@/i18n';
import type { TopAlbum } from '@/types/api';
import { duration, percent } from './statsFormat';
import styles from './stats.module.css';

/** Podium d'albums : pochette, rang, et la part de l'album réellement parcourue. */
export function TopAlbumsGrid({ items }: { items: TopAlbum[] }) {
  const t = useT();
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
            {it.album.artist?.name ?? t('common.variousArtists')}
            {it.album.year ? ` · ${it.album.year}` : ''}
          </div>
          <div className={styles.albumStats}>
            {t('count.plays', { count: it.playCount })} ·{' '}
            {duration(it.totalListenedMs)}
          </div>
          <div className={styles.albumMeter} aria-hidden="true">
            <div
              className={styles.albumMeterFill}
              style={{ width: `${Math.max(2, it.coverage * 100)}%` }}
            />
          </div>
          <div className={styles.albumSub}>
            {t('stats.albumCoverage', { percent: percent(it.coverage) })}
            {it.albumPlayCount > 0 &&
              ` · ${t('count.launches', { count: it.albumPlayCount })}`}
          </div>
        </Link>
      ))}
    </div>
  );
}

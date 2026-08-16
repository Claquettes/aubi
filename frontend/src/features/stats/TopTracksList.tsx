import { CoverArt } from '@/components/media/CoverArt';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useT } from '@/i18n';
import type { TopTrack } from '@/types/api';
import { duration } from './statsFormat';
import styles from './stats.module.css';

export function TopTracksList({ items }: { items: TopTrack[] }) {
  const t = useT();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);
  const queue = items.map((it) => it.track);
  const max = Math.max(1, ...items.map((it) => it.playCount));

  return (
    <ol className={styles.rankList}>
      {items.map((it, i) => (
        <li key={it.track.id} className={styles.rankRow}>
          <button
            type="button"
            className={styles.rankLink}
            onClick={() => {
              setSource('stats');
              playTrack(it.track, queue, i);
            }}
          >
            <span className={styles.rank}>{i + 1}</span>
            <CoverArt
              src={it.track.coverUrl}
              label={it.track.title}
              size="xs"
            />
            <div className={styles.rankMeta}>
              <div className={styles.rankLabel}>{it.track.title}</div>
              <div className={styles.rankSub}>
                {it.track.artist?.name ?? '—'}
                {it.track.album ? ` · ${it.track.album.title}` : ''}
                {' · '}
                {duration(it.totalListenedMs)}
              </div>
              <div className={styles.rankTrack} aria-hidden="true">
                <div
                  className={styles.rankBar}
                  style={{
                    width: `${Math.max(2, (it.playCount / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <span className={styles.rankValue}>
              {t('count.listens', { count: it.playCount })}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

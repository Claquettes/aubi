import { CoverArt } from '@/components/media/CoverArt';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import type { RecentPlay } from '@/types/api';
import { relative } from './statsFormat';
import styles from './stats.module.css';

export function RecentPlays({ items }: { items: RecentPlay[] }) {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);
  const queue = items.map((it) => it.track);

  return (
    <ul className={styles.recentList}>
      {items.map((it, i) => (
        <li key={`${it.playedAt}-${it.track.id}`} className={styles.recentRow}>
          <button
            type="button"
            className={styles.recentLink}
            onClick={() => {
              setSource('stats');
              playTrack(it.track, queue, i);
            }}
          >
            <CoverArt
              src={it.track.coverUrl}
              label={it.track.title}
              size="xs"
            />
            <div className={styles.rankMeta}>
              <div className={styles.rankLabel}>{it.track.title}</div>
              <div className={styles.rankSub}>
                {it.track.artist?.name ?? '—'}
              </div>
            </div>
            <span className={styles.recentTime}>{relative(it.playedAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

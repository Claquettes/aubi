import { CoverArt } from '@/components/media/CoverArt';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import type { TopTrack } from '@/types/api';
import styles from './stats.module.css';

export function TopTracksList({ items }: { items: TopTrack[] }) {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);
  const queue = items.map((it) => it.track);

  return (
    <div>
      {items.map((it, i) => (
        <div
          key={it.track.id}
          className={styles.topRow}
          onClick={() => {
            setSource('stats');
            playTrack(it.track, queue, i);
          }}
        >
          <span className={styles.topRank}>{i + 1}</span>
          <CoverArt src={it.track.coverUrl} label={it.track.title} size="xs" />
          <div className={styles.topMeta}>
            <div className={styles.topTitle}>{it.track.title}</div>
            <div className={styles.topSub}>{it.track.artist?.name ?? '—'}</div>
          </div>
          <span className={styles.topCount}>{it.playCount} écoutes</span>
        </div>
      ))}
    </div>
  );
}

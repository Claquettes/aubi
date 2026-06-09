import type { MouseEvent } from 'react';
import { DurationText } from '@/components/media/DurationText';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function PlayerProgress() {
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeMs = usePlayerStore((s) => s.currentTimeMs);
  const seek = usePlayerStore((s) => s.seek);
  const dur = usePlayerStore((s) => s.currentTrack?.durationMs ?? 0);

  const onSeek = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio);
  };

  return (
    <div className={styles.progressWrap}>
      <span className={styles.time}>
        <DurationText ms={currentTimeMs} />
      </span>
      <div className={styles.progressTrack} onClick={onSeek}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <span className={styles.time}>
        <DurationText ms={dur} />
      </span>
    </div>
  );
}

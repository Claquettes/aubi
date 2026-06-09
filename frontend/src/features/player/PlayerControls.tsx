import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function PlayerControls({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const big = size === 'lg';

  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={`${styles.ctrlBtn} ${isShuffle ? styles.ctrlActive : ''}`}
        onClick={toggleShuffle}
        aria-label="Lecture aléatoire"
      >
        <Shuffle size={18} />
      </button>
      <button
        type="button"
        className={styles.ctrlBtn}
        onClick={prev}
        aria-label="Précédent"
      >
        <SkipBack size={big ? 26 : 20} />
      </button>
      <button
        type="button"
        className={styles.playBtn}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isPlaying ? <Pause size={big ? 28 : 22} /> : <Play size={big ? 28 : 22} />}
      </button>
      <button
        type="button"
        className={styles.ctrlBtn}
        onClick={next}
        aria-label="Suivant"
      >
        <SkipForward size={big ? 26 : 20} />
      </button>
      <button
        type="button"
        className={`${styles.ctrlBtn} ${repeatMode !== 'none' ? styles.ctrlActive : ''}`}
        onClick={cycleRepeat}
        aria-label="Répéter"
      >
        {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
      </button>
    </div>
  );
}

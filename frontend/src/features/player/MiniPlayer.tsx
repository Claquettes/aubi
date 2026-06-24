import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { CoverArt } from '@/components/media/CoverArt';
import { Button } from '@/components/primitives/Button';
import { usePlayerStore } from './usePlayerStore';
import styles from './MiniPlayer.module.css';

export function MiniPlayer() {
  const current = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const setFull = usePlayerStore((s) => s.setFullPlayerOpen);

  if (!current) return null;

  const artist = current.artist?.name ?? '—';
  const label = current.title;

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <div className={styles.bar}>
        <CoverArt
          size="sm"
          label={label}
          src={current.coverUrl ?? undefined}
        />
        <button
          type="button"
          className={styles.meta}
          onClick={() => setFull(true)}
        >
          <p className={styles.title}>{current.title}</p>
          <p className={styles.sub}>{artist}</p>
        </button>
        <div className={styles.controls}>
          <Button variant="icon" onClick={() => prev()} aria-label="Précédent">
            <SkipBack size={20} />
          </Button>
          <Button
            variant="icon"
            onClick={() => togglePlay()}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </Button>
          <Button variant="icon" onClick={() => next()} aria-label="Suivant">
            <SkipForward size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

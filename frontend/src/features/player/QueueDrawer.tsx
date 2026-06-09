import { X } from 'lucide-react';
import { CoverArt } from '@/components/media/CoverArt';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function QueueDrawer() {
  const open = usePlayerStore((s) => s.queueOpen);
  const setOpen = usePlayerStore((s) => s.setQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playTrack = usePlayerStore((s) => s.playTrack);

  if (!open) return null;

  return (
    <>
      <div className={styles.scrim} onClick={() => setOpen(false)} />
      <aside className={styles.queue}>
        <header className={styles.queueHead}>
          <span>File d'attente · {queue.length}</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>
        <div className={styles.queueList}>
          {queue.map((t, i) => (
            <button
              type="button"
              key={`${t.id}-${i}`}
              className={`${styles.queueItem} ${i === queueIndex ? styles.queueActive : ''}`}
              onClick={() => playTrack(t, queue, i)}
            >
              <CoverArt src={t.coverUrl} label={t.title} size="xs" />
              <div className={styles.queueMeta}>
                <div className={styles.queueTitle}>{t.title}</div>
                <div className={styles.queueSub}>{t.artist?.name ?? '—'}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

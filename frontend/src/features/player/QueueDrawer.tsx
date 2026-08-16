import { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { CoverArt } from '@/components/media/CoverArt';
import { useT } from '@/i18n';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function QueueDrawer() {
  const t = useT();
  const open = usePlayerStore((s) => s.queueOpen);
  const setOpen = usePlayerStore((s) => s.setQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const moveInQueue = usePlayerStore((s) => s.moveInQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (!open) return null;

  const drop = (i: number) => {
    if (dragIndex != null && dragIndex !== i) moveInQueue(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <>
      <div className={styles.scrim} onClick={() => setOpen(false)} />
      <aside className={styles.queue}>
        <header className={styles.queueHead}>
          <span>
            {t('player.queue')} · {queue.length}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles.queueList}>
          {queue.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className={`${styles.queueItem} ${i === queueIndex ? styles.queueActive : ''} ${
                overIndex === i && dragIndex != null && dragIndex !== i
                  ? styles.queueOver
                  : ''
              }`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(i);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
            >
              <span className={styles.queueGrip} aria-hidden="true">
                <GripVertical size={16} />
              </span>
              <button
                type="button"
                className={styles.queuePlay}
                onClick={() => playTrack(item, queue, i)}
              >
                <CoverArt src={item.coverUrl} label={item.title} size="xs" />
                <div className={styles.queueMeta}>
                  <div className={styles.queueTitle}>{item.title}</div>
                  <div className={styles.queueSub}>
                    {item.artist?.name ?? '—'}
                  </div>
                </div>
              </button>
              {i !== queueIndex && (
                <button
                  type="button"
                  className={styles.queueRemove}
                  onClick={() => removeFromQueue(i)}
                  aria-label={t('player.queueRemove')}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

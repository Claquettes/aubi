import { useState } from 'react';
import { BookOpen, Mic2, Music2, RefreshCw, Trash2, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { bytes, duration, timeLabel } from '@/features/stats/statsFormat';
import { useT } from '@/i18n';
import type { Library, LibraryType } from '@/types/api';
import { LibraryModal } from './LibraryModal';
import { useLibraryActions } from './useLibraryActions';
import styles from './libraries.module.css';

const ICONS: Record<LibraryType, LucideIcon> = {
  music: Music2,
  concert: Mic2,
  audiobook: BookOpen,
};

export function LibraryCard({ library }: { library: Library }) {
  const t = useT();
  const actions = useLibraryActions();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const Icon = ICONS[library.type];

  return (
    <>
      <article
        className={`${styles.card} ${library.enabled ? '' : styles.cardOff}`}
      >
        <div className={styles.cardHead}>
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          <h3 className={styles.cardName}>{library.name}</h3>
          <span className={styles.badge}>{t(`section.${library.type}`)}</span>
          <button
            type="button"
            role="switch"
            aria-checked={library.enabled}
            aria-label={t(
              library.enabled ? 'libraries.disable' : 'libraries.enable',
            )}
            className={library.enabled ? styles.switchOn : styles.switch}
            onClick={() => actions.toggle(library)}
          >
            <span className={styles.knob} />
          </button>
        </div>

        <p className={styles.path} title={library.path}>
          {library.path}
        </p>

        {!library.available && (
          <p className={styles.error}>{t('libraries.unavailable')}</p>
        )}

        <p className={styles.stats}>
          {t('libraries.tracks', { count: library.trackCount })}
          {' · '}
          {bytes(library.sizeBytes)}
          {library.durationMs > 0 && ` · ${duration(library.durationMs)}`}
          {library.diskFreeBytes != null &&
            ` · ${t('libraries.diskFree', { size: bytes(library.diskFreeBytes) })}`}
        </p>

        <div className={styles.cardFoot}>
          <span className={styles.meta}>
            {library.enabled
              ? library.lastScanAt
                ? t('libraries.lastScan', { date: timeLabel(library.lastScanAt) })
                : t('libraries.neverScanned')
              : t('libraries.hidden', { count: library.trackCount })}
          </span>
          <div className={styles.cardActions}>
            {library.enabled && (
              <Button
                variant="ghost"
                onClick={() => actions.scan(library)}
                aria-label={t('libraries.scan')}
                title={t('libraries.scan')}
              >
                <RefreshCw size={15} aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setEditing(true)}
              aria-label={t('libraries.edit')}
              title={t('libraries.edit')}
            >
              <Pencil size={15} aria-hidden="true" />
            </Button>
            {confirming ? (
              <>
                <Button
                  variant="ghost"
                  className={styles.danger}
                  onClick={() => actions.remove(library)}
                >
                  {t('libraries.confirmRemove')}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setConfirming(true)}
                aria-label={t('libraries.remove')}
                title={t('libraries.remove')}
              >
                <Trash2 size={15} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
        {confirming && (
          <p className={styles.hint}>{t('libraries.removeHint')}</p>
        )}
      </article>

      {editing && (
        <LibraryModal library={library} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

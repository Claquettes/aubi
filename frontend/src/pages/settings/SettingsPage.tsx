import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { scannerApi } from '@/api/scanner';
import { systemApi } from '@/api/system';
import { useToast } from '@/components/feedback/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { LibraryCard } from '@/features/libraries/LibraryCard';
import { LibraryModal } from '@/features/libraries/LibraryModal';
import {
  bytes,
  duration,
  int,
  percent,
  sectionLabel,
} from '@/features/stats/statsFormat';
import { useLibraries } from '@/hooks/useLibraries';
import { LANGS, localeTag, useLang, useSetLang, useT } from '@/i18n';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const [adding, setAdding] = useState(false);
  const { data: status } = useQuery({
    queryKey: ['scanner'],
    queryFn: () => scannerApi.status(),
    refetchInterval: (query) =>
      query.state.data?.status === 'scanning' ? 2000 : false,
  });
  const { data: libraries } = useLibraries();
  const { data: storage } = useQuery({
    queryKey: ['storage'],
    queryFn: () => systemApi.storage(),
  });
  const scanning = status?.status === 'scanning';

  const onScan = async () => {
    try {
      await scannerApi.scan();
      toast(t('settings.scanStarted'));
    } finally {
      qc.invalidateQueries({ queryKey: ['scanner'] });
    }
  };

  const disk = storage?.disk;
  const used = disk ? (disk.totalBytes - disk.freeBytes) / disk.totalBytes : 0;

  return (
    <div>
      <PageHeader title={t('settings.title')} />

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.librariesCard')}</h2>
        <p className={styles.info}>{t('settings.librariesHint')}</p>
        <div className={styles.list}>
          {libraries?.map((l) => (
            <LibraryCard key={l.id} library={l} />
          ))}
          {libraries?.length === 0 && (
            <p className={styles.info}>{t('settings.noLibrary')}</p>
          )}
        </div>
        <Button variant="ghost" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden="true" />
          {t('libraries.addTitle')}
        </Button>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.storageCard')}</h2>
        <div className={styles.figures}>
          <div className={styles.figure}>
            <span className={styles.figureValue}>
              {int(storage?.trackCount ?? 0)}
            </span>
            <span className={styles.figureLabel}>
              {t('settings.figure.tracks')}
            </span>
          </div>
          <div className={styles.figure}>
            <span className={styles.figureValue}>
              {bytes(storage?.sizeBytes ?? 0)}
            </span>
            <span className={styles.figureLabel}>
              {t('settings.figure.size')}
            </span>
          </div>
          <div className={styles.figure}>
            <span className={styles.figureValue}>
              {duration(storage?.durationMs ?? 0)}
            </span>
            <span className={styles.figureLabel}>
              {t('settings.figure.duration')}
            </span>
          </div>
          <div className={styles.figure}>
            <span className={styles.figureValue}>
              {int(storage?.albumCount ?? 0)}
            </span>
            <span className={styles.figureLabel}>
              {t('settings.figure.albums')}
            </span>
          </div>
          <div className={styles.figure}>
            <span className={styles.figureValue}>
              {int(storage?.artistCount ?? 0)}
            </span>
            <span className={styles.figureLabel}>
              {t('settings.figure.artists')}
            </span>
          </div>
        </div>

        {storage && storage.bySection.length > 1 && (
          <ul className={styles.breakdown}>
            {storage.bySection.map((s) => (
              <li key={s.section}>
                <span>{sectionLabel(s.section)}</span>
                <span className={styles.breakdownValue}>
                  {t('settings.indexed', { count: s.trackCount })} ·{' '}
                  {bytes(s.sizeBytes)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {storage && storage.hiddenTrackCount > 0 && (
          <p className={styles.info}>
            {t('settings.hidden', {
              count: storage.hiddenTrackCount,
              size: bytes(storage.hiddenSizeBytes),
            })}
          </p>
        )}

        {disk && (
          <>
            <div className={styles.progressRow}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.round(used * 100)}%` }}
                />
              </div>
              <span className={styles.progressPct}>{percent(used)}</span>
            </div>
            <p className={styles.info}>
              {t('settings.disk', {
                free: bytes(disk.freeBytes),
                total: bytes(disk.totalBytes),
                path: storage.mediaRoot,
              })}
            </p>
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.libraryCard')}</h2>
        <p className={styles.info}>
          {t('settings.indexed', { count: status?.tracksFound ?? 0 })}
          {status?.lastScanAt
            ? t('settings.lastScan', {
                date: new Date(status.lastScanAt).toLocaleString(localeTag()),
              })
            : ''}
        </p>
        {scanning && (
          <div className={styles.progressRow}>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${status?.progress ?? 0}%` }}
              />
            </div>
            <span className={styles.progressPct}>{status?.progress ?? 0}%</span>
          </div>
        )}
        {status?.status === 'error' && status.errorMessage && (
          <p className={styles.error}>
            {t('settings.error', { message: status.errorMessage })}
          </p>
        )}
        <Button variant="primary" onClick={onScan} disabled={scanning}>
          {scanning ? t('settings.scanning') : t('settings.scan')}
        </Button>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.languageCard')}</h2>
        <div
          className={styles.langRow}
          role="group"
          aria-label={t('settings.languageCard')}
        >
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              className={l.key === lang ? styles.langOn : styles.lang}
              aria-pressed={l.key === lang}
              onClick={() => setLang(l.key)}
            >
              {t(l.labelKey)}
            </button>
          ))}
        </div>
        <p className={styles.info}>{t('settings.languageHint')}</p>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.aboutCard')}</h2>
        <p className={styles.info}>{t('settings.about')}</p>
      </section>

      {adding && <LibraryModal onClose={() => setAdding(false)} />}
    </div>
  );
}

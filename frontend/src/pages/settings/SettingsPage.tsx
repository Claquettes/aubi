import { useQuery, useQueryClient } from '@tanstack/react-query';
import { scannerApi } from '@/api/scanner';
import { useToast } from '@/components/feedback/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { LANGS, localeTag, useLang, useSetLang, useT } from '@/i18n';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const { data: status } = useQuery({
    queryKey: ['scanner'],
    queryFn: () => scannerApi.status(),
    refetchInterval: (query) =>
      query.state.data?.status === 'scanning' ? 2000 : false,
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

  return (
    <div>
      <PageHeader title={t('settings.title')} />

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('settings.languageCard')}</h2>
        <div className={styles.langRow} role="group" aria-label={t('settings.languageCard')}>
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
        <h2 className={styles.cardTitle}>{t('settings.aboutCard')}</h2>
        <p className={styles.info}>{t('settings.about')}</p>
      </section>
    </div>
  );
}

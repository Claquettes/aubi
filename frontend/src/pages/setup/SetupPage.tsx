import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { scannerApi } from '@/api/scanner';
import { systemApi } from '@/api/system';
import { Button } from '@/components/primitives/Button';
import { Spinner } from '@/components/primitives/Spinner';
import { LibraryCard } from '@/features/libraries/LibraryCard';
import { LibraryModal } from '@/features/libraries/LibraryModal';
import { useLibraries } from '@/hooks/useLibraries';
import { LANGS, useApiError, useLang, useSetLang, useT } from '@/i18n';
import styles from './SetupPage.module.css';

type Step = 'welcome' | 'libraries' | 'scan';
const STEPS: Step[] = ['welcome', 'libraries', 'scan'];

/**
 * Premier lancement : choisir sa langue, déclarer ses dossiers, lancer le
 * premier scan. Tant que l'assistant n'est pas terminé, la garde du routeur
 * ramène ici — l'application n'a rien à montrer sans bibliothèque.
 */
export function SetupPage() {
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const apiError = useApiError();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: setup } = useQuery({
    queryKey: ['setup'],
    queryFn: () => systemApi.setup(),
  });
  const { data: libraries } = useLibraries();
  const [step, setStep] = useState<Step>('welcome');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const { data: scanner } = useQuery({
    queryKey: ['scanner'],
    queryFn: () => scannerApi.status(),
    enabled: step === 'scan',
    refetchInterval: (query) =>
      query.state.data?.status === 'scanning' ? 1500 : 4000,
  });

  const count = libraries?.length ?? 0;

  const finish = async () => {
    setFinishing(true);
    try {
      await systemApi.completeSetup();
      await qc.invalidateQueries();
      navigate('/music', { replace: true });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.head}>
          <span className={styles.wordmark}>aubi</span>
          <ol className={styles.steps} aria-label={t('setup.stepsAria')}>
            {STEPS.map((s) => (
              <li
                key={s}
                className={s === step ? styles.stepOn : styles.step}
                aria-current={s === step ? 'step' : undefined}
              />
            ))}
          </ol>
        </header>

        {step === 'welcome' && (
          <section className={styles.section}>
            <h1 className={styles.title}>{t('setup.welcomeTitle')}</h1>
            <p className={styles.text}>{t('setup.welcomeText')}</p>
            <div className={styles.langRow} role="group">
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
            <Button variant="primary" onClick={() => setStep('libraries')}>
              {t('setup.start')}
            </Button>
          </section>
        )}

        {step === 'libraries' && (
          <section className={styles.section}>
            <h1 className={styles.title}>{t('setup.librariesTitle')}</h1>
            <p className={styles.text}>{t('setup.librariesText')}</p>
            {setup && (
              <p className={styles.hint}>
                {t('setup.mediaRoot', { path: setup.mediaRoot })}
              </p>
            )}

            <div className={styles.list}>
              {libraries?.map((l) => (
                <LibraryCard key={l.id} library={l} />
              ))}
            </div>

            <Button variant="ghost" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden="true" />
              {t('libraries.addTitle')}
            </Button>

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setStep('welcome')}>
                {t('setup.back')}
              </Button>
              <Button
                variant="primary"
                disabled={count === 0}
                onClick={() => setStep('scan')}
              >
                {t('setup.next')}
              </Button>
            </div>
            {count === 0 && <p className={styles.hint}>{t('setup.needOne')}</p>}
          </section>
        )}

        {step === 'scan' && (
          <section className={styles.section}>
            <h1 className={styles.title}>{t('setup.scanTitle')}</h1>
            <p className={styles.text}>{t('setup.scanText')}</p>
            {scanner?.status === 'scanning' ? (
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${scanner.progress}%` }}
                  />
                </div>
                <span className={styles.progressPct}>{scanner.progress}%</span>
              </div>
            ) : (
              <p className={styles.hint}>
                {t('setup.indexed', { count: scanner?.tracksFound ?? 0 })}
              </p>
            )}
            {scanner?.status === 'error' && scanner.errorMessage && (
              <p className={styles.error}>{scanner.errorMessage}</p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => setStep('libraries')}>
                {t('setup.back')}
              </Button>
              <Button variant="primary" onClick={finish} disabled={finishing}>
                {finishing ? <Spinner /> : t('setup.enter')}
              </Button>
            </div>
            <p className={styles.hint}>{t('setup.scanBackground')}</p>
          </section>
        )}
      </div>

      {adding && <LibraryModal onClose={() => setAdding(false)} />}
    </div>
  );
}

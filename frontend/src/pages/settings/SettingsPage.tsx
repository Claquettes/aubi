import { useQuery, useQueryClient } from '@tanstack/react-query';
import { scannerApi } from '@/api/scanner';
import { useToast } from '@/components/feedback/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
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
      toast('Scan de la bibliothèque lancé');
    } finally {
      qc.invalidateQueries({ queryKey: ['scanner'] });
    }
  };

  return (
    <div>
      <PageHeader title="Paramètres" />

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Bibliothèque audio</h2>
        <p className={styles.info}>
          {status?.tracksFound ?? 0} titres indexés
          {status?.lastScanAt
            ? ` · dernier scan le ${new Date(status.lastScanAt).toLocaleString('fr-FR')}`
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
          <p className={styles.error}>Erreur : {status.errorMessage}</p>
        )}
        <Button variant="primary" onClick={onScan} disabled={scanning}>
          {scanning ? 'Scan en cours…' : 'Scanner la bibliothèque'}
        </Button>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>À propos</h2>
        <p className={styles.info}>
          aubi — streaming audio personnel auto-hébergé. L'accès est protégé par
          Authelia ; cette interface se concentre sur l'écoute.
        </p>
      </section>
    </div>
  );
}

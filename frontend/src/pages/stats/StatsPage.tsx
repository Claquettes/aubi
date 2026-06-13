import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/api/stats';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { HeatmapCalendar } from '@/features/stats/HeatmapCalendar';
import { ListeningChart } from '@/features/stats/ListeningChart';
import { SectionDonut } from '@/features/stats/SectionDonut';
import { StatsOverview } from '@/features/stats/StatsOverview';
import { TopTracksList } from '@/features/stats/TopTracksList';
import styles from '@/features/stats/stats.module.css';

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function StatsPage() {
  const overview = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsApi.overview(),
  });
  const top = useQuery({
    queryKey: ['stats', 'top'],
    queryFn: () => statsApi.topTracks('all', 10),
  });
  const heat = useQuery({
    queryKey: ['stats', 'heatmap'],
    queryFn: () => statsApi.heatmap(),
  });
  const daily = useQuery({
    queryKey: ['stats', 'daily'],
    queryFn: () => statsApi.daily(isoDaysAgo(30)),
  });

  if (overview.isLoading) return <Spinner />;
  if (!overview.data)
    return (
      <div>
        <PageHeader title="Statistiques" />
        <EmptyState>Pas encore de données — écoute de la musique !</EmptyState>
      </div>
    );

  const dailyData = daily.data?.data ?? [];
  const topItems = top.data?.data ?? [];

  return (
    <div>
      <PageHeader title="Statistiques" />
      <StatsOverview data={overview.data} />

      <div className={styles.charts}>
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Écoute · 30 derniers jours</h2>
          {dailyData.length ? (
            <ListeningChart data={dailyData} />
          ) : (
            <EmptyState>Pas encore d'écoute enregistrée.</EmptyState>
          )}
        </div>
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Par catégorie</h2>
          <SectionDonut daily={dailyData} />
        </div>
      </div>

      <div className={styles.block}>
        <h2 className={styles.blockTitle}>Activité · 12 mois</h2>
        <HeatmapCalendar cells={heat.data?.data ?? []} />
      </div>

      <div className={styles.block}>
        <h2 className={styles.blockTitle}>Top titres</h2>
        {topItems.length ? (
          <TopTracksList items={topItems} />
        ) : (
          <EmptyState>Aucune écoute pour l'instant.</EmptyState>
        )}
      </div>
    </div>
  );
}

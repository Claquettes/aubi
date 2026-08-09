import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi, type RangeArgs } from '@/api/stats';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DiscoveryChart } from '@/features/stats/DiscoveryChart';
import { HeatmapCalendar } from '@/features/stats/HeatmapCalendar';
import { HourChart } from '@/features/stats/HourChart';
import { LibraryPanel } from '@/features/stats/LibraryPanel';
import { ListeningChart } from '@/features/stats/ListeningChart';
import { MonthlyChart } from '@/features/stats/MonthlyChart';
import { Punchcard } from '@/features/stats/Punchcard';
import { RecentPlays } from '@/features/stats/RecentPlays';
import { RecordsPanel } from '@/features/stats/RecordsPanel';
import { SectionDonut } from '@/features/stats/SectionDonut';
import { StatTiles } from '@/features/stats/StatTiles';
import {
  Block,
  PeriodSelector,
  PERIODS,
  TabBar,
} from '@/features/stats/StatsControls';
import { TopAlbumsGrid } from '@/features/stats/TopAlbumsGrid';
import { TopArtistsList } from '@/features/stats/TopArtistsList';
import { TopTracksList } from '@/features/stats/TopTracksList';
import { WeekdayChart } from '@/features/stats/WeekdayChart';
import {
  bytes,
  duration,
  hours,
  int,
  percent,
  plural,
  sectionLabel,
} from '@/features/stats/statsFormat';
import type { StatsPeriod } from '@/types/api';
import styles from '@/features/stats/stats.module.css';

type Tab = 'overview' | 'habits' | 'artists' | 'albums' | 'tracks' | 'library';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'habits', label: 'Habitudes' },
  { key: 'artists', label: 'Artistes' },
  { key: 'albums', label: 'Albums' },
  { key: 'tracks', label: 'Titres' },
  { key: 'library', label: 'Bibliothèque' },
];

const PERIOD_LABEL: Record<StatsPeriod, string> = {
  week: 'sur 7 jours',
  month: 'sur 30 jours',
  year: 'sur 1 an',
  all: 'depuis le début',
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const [tab, setTab] = useState<Tab>('overview');
  const args: RangeArgs = { period };
  const key = ['stats', period] as const;

  const overview = useQuery({
    queryKey: [...key, 'overview'],
    queryFn: () => statsApi.overview(args),
  });

  const enabled = (t: Tab) => tab === t;

  const records = useQuery({
    queryKey: [...key, 'records'],
    queryFn: () => statsApi.records(args),
    enabled: enabled('overview'),
  });
  const daily = useQuery({
    queryKey: [...key, 'daily'],
    queryFn: () =>
      statsApi.daily(
        isoDaysAgo(PERIODS.find((p) => p.key === period)?.days ?? 30),
        new Date().toISOString().slice(0, 10),
      ),
    enabled: enabled('overview'),
  });
  const heat = useQuery({
    queryKey: ['stats', 'heatmap'],
    queryFn: () => statsApi.heatmap(),
    enabled: enabled('overview'),
  });
  const recent = useQuery({
    queryKey: ['stats', 'recent'],
    queryFn: () => statsApi.recent(12),
    enabled: enabled('overview'),
  });
  const patterns = useQuery({
    queryKey: [...key, 'patterns'],
    queryFn: () => statsApi.patterns(args),
    enabled: enabled('habits'),
  });
  const monthly = useQuery({
    queryKey: ['stats', 'monthly'],
    queryFn: () => statsApi.monthly(12),
    enabled: enabled('habits'),
  });
  // Aperçu du haut de classement dans la colonne de droite de la vue d'ensemble.
  const topPreview = useQuery({
    queryKey: [...key, 'top-preview'],
    queryFn: () => statsApi.topArtists({ ...args, limit: 5 }),
    enabled: enabled('overview'),
  });
  const topArtists = useQuery({
    queryKey: [...key, 'artists'],
    queryFn: () => statsApi.topArtists({ ...args, limit: 20 }),
    enabled: enabled('artists'),
  });
  const topAlbums = useQuery({
    queryKey: [...key, 'albums'],
    queryFn: () => statsApi.topAlbums({ ...args, limit: 18 }),
    enabled: enabled('albums'),
  });
  const topTracks = useQuery({
    queryKey: [...key, 'tracks'],
    queryFn: () => statsApi.topTracks({ ...args, limit: 30 }),
    enabled: enabled('tracks'),
  });
  const library = useQuery({
    queryKey: ['stats', 'library'],
    queryFn: () => statsApi.library(),
    enabled: enabled('library'),
  });

  const o = overview.data;

  return (
    <div>
      <PageHeader
        title="Statistiques"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {overview.isLoading && <Spinner />}

      {o && tab === 'overview' && (
        <>
          {o.totalPlayEvents === 0 ? (
            <EmptyState>
              Aucune écoute {PERIOD_LABEL[period]} — lance un titre, tout se
              remplit ensuite.
            </EmptyState>
          ) : (
            <StatTiles
              columns={4}
              tiles={[
                {
                  label: "Heures d'écoute",
                  value: hours(o.totalListenedMs),
                  hint: duration(o.totalListenedMs),
                },
                {
                  label: 'Lectures',
                  value: int(o.totalPlayEvents),
                  hint: `${percent(o.completedRate)} jusqu'au bout`,
                },
                {
                  label: 'Titres différents',
                  value: int(o.distinctTracksPlayed),
                  hint: `${percent(o.libraryCoverage, 1)} de la bibliothèque`,
                },
                {
                  label: 'Artistes différents',
                  value: int(o.distinctArtistsPlayed),
                  hint: `sur ${int(o.totalArtists)} au catalogue`,
                },
                {
                  label: 'Jours actifs',
                  value: int(o.activeDays),
                  hint: `${duration(o.avgDailyMs)} par jour actif`,
                },
                {
                  label: 'Albums lancés',
                  value: int(o.totalAlbumPlays),
                  hint: `${int(o.distinctAlbumsPlayed)} albums touchés`,
                },
                {
                  label: 'Série en cours',
                  value: `${o.currentStreak} j`,
                  hint: `record ${o.longestStreak} j`,
                },
                {
                  label: 'Titres aimés',
                  value: int(o.likedTracks),
                  hint: `${int(o.likedAlbums)} album${plural(
                    o.likedAlbums,
                  )} · ${int(o.likedArtists)} artiste${plural(o.likedArtists)}`,
                },
              ]}
            />
          )}

          <div className={styles.twoCol}>
            <Block
              title={`Écoute · ${PERIOD_LABEL[period]}`}
              caption="Minutes écoutées par jour."
            >
              {daily.data?.data.some((d) => d.totalMs > 0) ? (
                <ListeningChart data={daily.data.data} />
              ) : (
                <EmptyState>Pas encore d'écoute enregistrée.</EmptyState>
              )}
            </Block>
            {/* Un camembert à une seule part n'apprend rien : quand tout est
                musique, on montre plutôt le haut du classement. */}
            {o.bySection.length > 1 ? (
              <Block title="Par catégorie">
                <SectionDonut data={o.bySection} />
              </Block>
            ) : (
              <Block title="Artistes du moment">
                {topPreview.data?.data.length ? (
                  <TopArtistsList items={topPreview.data.data} />
                ) : (
                  <EmptyState>Aucune écoute sur cette période.</EmptyState>
                )}
              </Block>
            )}
          </div>

          <Block title="Faits marquants">
            {records.data ? (
              <RecordsPanel data={records.data} />
            ) : (
              <Spinner />
            )}
          </Block>

          <Block
            title="Activité · 12 mois"
            caption="Une case par jour, teinte selon le temps d'écoute."
          >
            <HeatmapCalendar cells={heat.data?.data ?? []} />
          </Block>

          <Block title="Dernières écoutes">
            {recent.data?.data.length ? (
              <RecentPlays items={recent.data.data} />
            ) : (
              <EmptyState>Rien pour l'instant.</EmptyState>
            )}
          </Block>
        </>
      )}

      {tab === 'habits' && (
        <>
          {patterns.isLoading ? (
            <Spinner />
          ) : patterns.data ? (
            <>
              <StatTiles
                columns={4}
                tiles={patterns.data.slots.map((s) => ({
                  label: s.label,
                  value: duration(s.totalMs),
                  hint: `${int(s.playCount)} lecture${plural(s.playCount)}`,
                }))}
              />
              <div className={styles.twoCol}>
                <Block
                  title="Heure de la journée"
                  caption={
                    patterns.data.peakHour != null
                      ? `Pic d'écoute vers ${patterns.data.peakHour}h.`
                      : undefined
                  }
                >
                  <HourChart data={patterns.data.byHour} />
                </Block>
                <Block title="Jour de la semaine">
                  <WeekdayChart data={patterns.data.byWeekday} />
                </Block>
              </div>
              <Block
                title="Semaine type"
                caption="Croisement jour × heure : où se logent réellement les écoutes."
              >
                <Punchcard cells={patterns.data.punchcard} />
              </Block>
            </>
          ) : null}

          <Block title="Mois par mois" caption="Volume écouté sur 12 mois.">
            {monthly.data ? (
              <MonthlyChart data={monthly.data.data} />
            ) : (
              <Spinner />
            )}
          </Block>
          <Block
            title="Découvertes"
            caption="Titres et artistes entendus pour la première fois."
          >
            {monthly.data ? (
              <DiscoveryChart data={monthly.data.data} />
            ) : (
              <Spinner />
            )}
          </Block>
        </>
      )}

      {tab === 'artists' && (
        <Block
          title={`Top artistes · ${PERIOD_LABEL[period]}`}
          caption="Les featurings comptent pour les deux artistes."
        >
          {topArtists.isLoading ? (
            <Spinner />
          ) : topArtists.data?.data.length ? (
            <TopArtistsList items={topArtists.data.data} />
          ) : (
            <EmptyState>Aucune écoute sur cette période.</EmptyState>
          )}
        </Block>
      )}

      {tab === 'albums' && (
        <Block
          title={`Top albums · ${PERIOD_LABEL[period]}`}
          caption="La jauge indique la part de l'album réellement parcourue."
        >
          {topAlbums.isLoading ? (
            <Spinner />
          ) : topAlbums.data?.data.length ? (
            <TopAlbumsGrid items={topAlbums.data.data} />
          ) : (
            <EmptyState>Aucune écoute sur cette période.</EmptyState>
          )}
        </Block>
      )}

      {tab === 'tracks' && (
        <Block title={`Top titres · ${PERIOD_LABEL[period]}`}>
          {topTracks.isLoading ? (
            <Spinner />
          ) : topTracks.data?.data.length ? (
            <TopTracksList items={topTracks.data.data} />
          ) : (
            <EmptyState>Aucune écoute sur cette période.</EmptyState>
          )}
        </Block>
      )}

      {tab === 'library' && (
        <>
          {library.isLoading && <Spinner />}
          {library.data && <LibraryPanel data={library.data} />}
          {o && (
            <p className={styles.footnote}>
              {int(o.totalTracks)} titres · {int(o.totalAlbums)} albums ·{' '}
              {int(o.totalArtists)} artistes · {bytes(o.librarySizeBytes)} ·
              catégorie dominante&nbsp;: {sectionLabel(o.mostPlayedSection)}.
            </p>
          )}
        </>
      )}
    </div>
  );
}

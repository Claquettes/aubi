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
  sectionLabel,
} from '@/features/stats/statsFormat';
import { useT, type TKey } from '@/i18n';
import type { StatsPeriod } from '@/types/api';
import styles from '@/features/stats/stats.module.css';

type Tab = 'overview' | 'habits' | 'artists' | 'albums' | 'tracks' | 'library';

const TAB_KEYS: { key: Tab; label: TKey }[] = [
  { key: 'overview', label: 'stats.tab.overview' },
  { key: 'habits', label: 'stats.tab.habits' },
  { key: 'artists', label: 'stats.tab.artists' },
  { key: 'albums', label: 'stats.tab.albums' },
  { key: 'tracks', label: 'stats.tab.tracks' },
  { key: 'library', label: 'stats.tab.library' },
];

const PERIOD_LABEL: Record<StatsPeriod, TKey> = {
  week: 'stats.periodLabel.week',
  month: 'stats.periodLabel.month',
  year: 'stats.periodLabel.year',
  all: 'stats.periodLabel.all',
};

/** Créneaux horaires : le serveur renvoie un libellé français, on traduit sur la clé. */
const SLOT_LABEL: Record<string, TKey> = {
  night: 'stats.slot.night',
  morning: 'stats.slot.morning',
  afternoon: 'stats.slot.afternoon',
  evening: 'stats.slot.evening',
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function StatsPage() {
  const t = useT();
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
  const periodLabel = t(PERIOD_LABEL[period]);
  const tabs = TAB_KEYS.map((tab) => ({ key: tab.key, label: t(tab.label) }));

  return (
    <div>
      <PageHeader
        title={t('nav.stats')}
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <TabBar tabs={tabs} value={tab} onChange={setTab} />

      {overview.isLoading && <Spinner />}

      {o && tab === 'overview' && (
        <>
          {o.totalPlayEvents === 0 ? (
            <EmptyState>
              {t('stats.emptyPeriod', { period: periodLabel })}
            </EmptyState>
          ) : (
            <StatTiles
              columns={4}
              tiles={[
                {
                  label: t('stats.tile.hours'),
                  value: hours(o.totalListenedMs),
                  hint: duration(o.totalListenedMs),
                },
                {
                  label: t('stats.tile.plays'),
                  value: int(o.totalPlayEvents),
                  hint: t('stats.tile.playsHint', {
                    percent: percent(o.completedRate),
                  }),
                },
                {
                  label: t('stats.tile.distinctTracks'),
                  value: int(o.distinctTracksPlayed),
                  hint: t('stats.tile.distinctTracksHint', {
                    percent: percent(o.libraryCoverage, 1),
                  }),
                },
                {
                  label: t('stats.tile.distinctArtists'),
                  value: int(o.distinctArtistsPlayed),
                  hint: t('stats.tile.distinctArtistsHint', {
                    count: int(o.totalArtists),
                  }),
                },
                {
                  label: t('stats.tile.activeDays'),
                  value: int(o.activeDays),
                  hint: t('stats.tile.activeDaysHint', {
                    duration: duration(o.avgDailyMs),
                  }),
                },
                {
                  label: t('stats.tile.albumPlays'),
                  value: int(o.totalAlbumPlays),
                  hint: t('stats.tile.albumPlaysHint', {
                    count: int(o.distinctAlbumsPlayed),
                  }),
                },
                {
                  label: t('stats.tile.streak'),
                  value: t('stats.tile.streakValue', {
                    count: o.currentStreak,
                  }),
                  hint: t('stats.tile.streakHint', {
                    count: o.longestStreak,
                  }),
                },
                {
                  label: t('stats.tile.likedTracks'),
                  value: int(o.likedTracks),
                  hint: t('stats.tile.likedHint', {
                    albums: t('count.albums', { count: o.likedAlbums }),
                    artists: t('count.artists', { count: o.likedArtists }),
                  }),
                },
              ]}
            />
          )}

          <div className={styles.twoCol}>
            <Block
              title={t('stats.block.listening', { period: periodLabel })}
              caption={t('stats.block.listeningCaption')}
            >
              {daily.data?.data.some((d) => d.totalMs > 0) ? (
                <ListeningChart data={daily.data.data} />
              ) : (
                <EmptyState>{t('stats.block.noListening')}</EmptyState>
              )}
            </Block>
            {/* Un camembert à une seule part n'apprend rien : quand tout est
                musique, on montre plutôt le haut du classement. */}
            {o.bySection.length > 1 ? (
              <Block title={t('stats.block.bySection')}>
                <SectionDonut data={o.bySection} />
              </Block>
            ) : (
              <Block title={t('stats.block.currentArtists')}>
                {topPreview.data?.data.length ? (
                  <TopArtistsList items={topPreview.data.data} />
                ) : (
                  <EmptyState>{t('stats.noPlaysPeriod')}</EmptyState>
                )}
              </Block>
            )}
          </div>

          <Block title={t('stats.block.records')}>
            {records.data ? (
              <RecordsPanel data={records.data} />
            ) : (
              <Spinner />
            )}
          </Block>

          <Block
            title={t('stats.block.activity')}
            caption={t('stats.block.activityCaption')}
          >
            <HeatmapCalendar cells={heat.data?.data ?? []} />
          </Block>

          <Block title={t('stats.block.recent')}>
            {recent.data?.data.length ? (
              <RecentPlays items={recent.data.data} />
            ) : (
              <EmptyState>{t('stats.nothingYet')}</EmptyState>
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
                  label: SLOT_LABEL[s.key] ? t(SLOT_LABEL[s.key]) : s.label,
                  value: duration(s.totalMs),
                  hint: t('count.plays', { count: s.playCount }),
                }))}
              />
              <div className={styles.twoCol}>
                <Block
                  title={t('stats.block.hour')}
                  caption={
                    patterns.data.peakHour != null
                      ? t('stats.block.hourCaption', {
                          hour: patterns.data.peakHour,
                        })
                      : undefined
                  }
                >
                  <HourChart data={patterns.data.byHour} />
                </Block>
                <Block title={t('stats.block.weekday')}>
                  <WeekdayChart data={patterns.data.byWeekday} />
                </Block>
              </div>
              <Block
                title={t('stats.block.punchcard')}
                caption={t('stats.block.punchcardCaption')}
              >
                <Punchcard cells={patterns.data.punchcard} />
              </Block>
            </>
          ) : null}

          <Block
            title={t('stats.block.monthly')}
            caption={t('stats.block.monthlyCaption')}
          >
            {monthly.data ? (
              <MonthlyChart data={monthly.data.data} />
            ) : (
              <Spinner />
            )}
          </Block>
          <Block
            title={t('stats.block.discovery')}
            caption={t('stats.block.discoveryCaption')}
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
          title={t('stats.block.topArtists', { period: periodLabel })}
          caption={t('stats.block.topArtistsCaption')}
        >
          {topArtists.isLoading ? (
            <Spinner />
          ) : topArtists.data?.data.length ? (
            <TopArtistsList items={topArtists.data.data} />
          ) : (
            <EmptyState>{t('stats.noPlaysPeriod')}</EmptyState>
          )}
        </Block>
      )}

      {tab === 'albums' && (
        <Block
          title={t('stats.block.topAlbums', { period: periodLabel })}
          caption={t('stats.block.topAlbumsCaption')}
        >
          {topAlbums.isLoading ? (
            <Spinner />
          ) : topAlbums.data?.data.length ? (
            <TopAlbumsGrid items={topAlbums.data.data} />
          ) : (
            <EmptyState>{t('stats.noPlaysPeriod')}</EmptyState>
          )}
        </Block>
      )}

      {tab === 'tracks' && (
        <Block title={t('stats.block.topTracks', { period: periodLabel })}>
          {topTracks.isLoading ? (
            <Spinner />
          ) : topTracks.data?.data.length ? (
            <TopTracksList items={topTracks.data.data} />
          ) : (
            <EmptyState>{t('stats.noPlaysPeriod')}</EmptyState>
          )}
        </Block>
      )}

      {tab === 'library' && (
        <>
          {library.isLoading && <Spinner />}
          {library.data && <LibraryPanel data={library.data} />}
          {o && (
            <p className={styles.footnote}>
              {t('stats.footnote', {
                tracks: int(o.totalTracks),
                albums: int(o.totalAlbums),
                artists: int(o.totalArtists),
                size: bytes(o.librarySizeBytes),
                section: sectionLabel(o.mostPlayedSection),
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}

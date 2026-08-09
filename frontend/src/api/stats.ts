import { apiJson } from './client';
import { qs } from './qs';
import type {
  DailyStat,
  HeatmapCell,
  LibraryStats,
  ListeningPatterns,
  MonthlyStat,
  RecentPlay,
  StatsOverview,
  StatsPeriod,
  StatsRecords,
  TopAlbum,
  TopArtist,
  TopTrack,
} from '@/types/api';

export interface PlayEventBody {
  trackId: string;
  durationMs: number;
  completed: boolean;
  source: string;
}

/** Les découpages jour/heure/mois sont calculés dans le fuseau du navigateur. */
export function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export interface RangeArgs {
  period?: StatsPeriod;
  section?: string;
  limit?: number;
}

const range = (a: RangeArgs = {}) =>
  qs({
    period: a.period ?? 'all',
    section: a.section,
    limit: a.limit,
    tz: browserTz(),
  });

export const statsApi = {
  overview: (a?: RangeArgs) =>
    apiJson<StatsOverview>(`/api/v1/stats/overview${range(a)}`),
  topTracks: (a?: RangeArgs) =>
    apiJson<{ data: TopTrack[] }>(`/api/v1/stats/top-tracks${range(a)}`),
  topArtists: (a?: RangeArgs) =>
    apiJson<{ data: TopArtist[] }>(`/api/v1/stats/top-artists${range(a)}`),
  topAlbums: (a?: RangeArgs) =>
    apiJson<{ data: TopAlbum[] }>(`/api/v1/stats/top-albums${range(a)}`),
  patterns: (a?: RangeArgs) =>
    apiJson<ListeningPatterns>(`/api/v1/stats/patterns${range(a)}`),
  records: (a?: RangeArgs) =>
    apiJson<StatsRecords>(`/api/v1/stats/records${range(a)}`),
  heatmap: () =>
    apiJson<{ data: HeatmapCell[] }>(
      `/api/v1/stats/heatmap${qs({ tz: browserTz() })}`,
    ),
  daily: (from?: string, to?: string, section?: string) =>
    apiJson<{ data: DailyStat[] }>(
      `/api/v1/stats/daily${qs({ from, to, section, tz: browserTz() })}`,
    ),
  monthly: (months = 12, section?: string) =>
    apiJson<{ data: MonthlyStat[] }>(
      `/api/v1/stats/monthly${qs({ months, section, tz: browserTz() })}`,
    ),
  recent: (limit = 12) =>
    apiJson<{ data: RecentPlay[] }>(`/api/v1/stats/recent${qs({ limit })}`),
  library: () => apiJson<LibraryStats>(`/api/v1/stats/library`),
  play: (body: PlayEventBody) =>
    apiJson<void>(`/api/v1/stats/play`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  // Appui sur le bouton lecture d'un album (≠ écoute d'un titre).
  albumPlay: (albumId: string, source = 'album') =>
    apiJson<{ id: string; albumPlayCount: number }>(
      `/api/v1/stats/album-play`,
      { method: 'POST', body: JSON.stringify({ albumId, source }) },
    ),
};

import { apiJson } from './client';
import { qs } from './qs';
import type {
  DailyStat,
  HeatmapCell,
  StatsOverview,
  StatsPeriod,
  TopTrack,
} from '@/types/api';

export interface PlayEventBody {
  trackId: string;
  durationMs: number;
  completed: boolean;
  source: string;
}

export const statsApi = {
  overview: () => apiJson<StatsOverview>(`/api/v1/stats/overview`),
  topTracks: (period: StatsPeriod = 'all', limit = 10, section?: string) =>
    apiJson<{ data: TopTrack[] }>(
      `/api/v1/stats/top-tracks${qs({ period, limit, section })}`,
    ),
  heatmap: () => apiJson<{ data: HeatmapCell[] }>(`/api/v1/stats/heatmap`),
  daily: (from?: string, to?: string, section?: string) =>
    apiJson<{ data: DailyStat[] }>(
      `/api/v1/stats/daily${qs({ from, to, section })}`,
    ),
  play: (body: PlayEventBody) =>
    apiJson<void>(`/api/v1/stats/play`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

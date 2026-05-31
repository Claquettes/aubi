import { apiJson } from './client';
import { qs } from './qs';
import type { Paginated, Track } from '@/types/api';

export interface TracksQuery {
  section?: string;
  artistId?: string;
  albumId?: string;
  concertId?: string;
  search?: string;
  isLiked?: boolean;
  isCover?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const tracksApi = {
  list: (q: TracksQuery = {}) =>
    apiJson<Paginated<Track>>(`/api/v1/tracks${qs({ ...q })}`),
  get: (id: string) => apiJson<Track>(`/api/v1/tracks/${id}`),
  similar: (id: string) => apiJson<Track[]>(`/api/v1/tracks/${id}/similar`),
  edit: (id: string, dto: { title?: string; artistName?: string }) =>
    apiJson<{ id: string; fileWritten: boolean }>(`/api/v1/tracks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
};

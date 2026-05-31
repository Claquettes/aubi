import { apiJson } from './client';
import { qs } from './qs';
import type { Album, AlbumDetail, Paginated, Track } from '@/types/api';

export interface AlbumsQuery {
  artistId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
  page?: number;
  limit?: number;
}

export const albumsApi = {
  list: (q: AlbumsQuery = {}) =>
    apiJson<Paginated<Album>>(`/api/v1/albums${qs({ ...q })}`),
  get: (id: string) => apiJson<AlbumDetail>(`/api/v1/albums/${id}`),
  tracks: (id: string) => apiJson<Track[]>(`/api/v1/albums/${id}/tracks`),
  edit: (id: string, dto: { title?: string; year?: number }) =>
    apiJson<{ id: string; filesWritten: number; totalTracks: number }>(
      `/api/v1/albums/${id}`,
      { method: 'PATCH', body: JSON.stringify(dto) },
    ),
};

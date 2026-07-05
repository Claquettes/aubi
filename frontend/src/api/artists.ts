import { apiJson } from './client';
import { qs } from './qs';
import type {
  Album,
  Artist,
  ArtistDetail,
  Paginated,
  Track,
} from '@/types/api';

export interface ArtistsQuery {
  section?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
  minTracks?: number;
  maxTracks?: number;
  page?: number;
  limit?: number;
}

export const artistsApi = {
  list: (q: ArtistsQuery = {}) =>
    apiJson<Paginated<Artist>>(`/api/v1/artists${qs({ ...q })}`),
  get: (id: string) => apiJson<ArtistDetail>(`/api/v1/artists/${id}`),
  albums: (id: string) => apiJson<Album[]>(`/api/v1/artists/${id}/albums`),
  tracks: (id: string, page = 1) =>
    apiJson<Paginated<Track>>(`/api/v1/artists/${id}/tracks${qs({ page })}`),
};

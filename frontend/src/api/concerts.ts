import { apiJson } from './client';
import { qs } from './qs';
import type { Concert, ConcertDetail, Paginated } from '@/types/api';

export interface ConcertsQuery {
  artistId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const concertsApi = {
  list: (q: ConcertsQuery = {}) =>
    apiJson<Paginated<Concert>>(`/api/v1/concerts${qs({ ...q })}`),
  get: (id: string) => apiJson<ConcertDetail>(`/api/v1/concerts/${id}`),
};

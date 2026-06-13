import { apiJson } from './client';
import { qs } from './qs';
import type { SearchResults } from '@/types/api';

export const searchApi = {
  search: (q: string, section?: string) =>
    apiJson<SearchResults>(`/api/v1/search${qs({ q, section })}`),
};

import { apiJson } from './client';
import type { Collection, CollectionDetail } from '@/types/api';

export const collectionsApi = {
  list: () => apiJson<{ data: Collection[] }>(`/api/v1/collections`),
  get: (id: string) => apiJson<CollectionDetail>(`/api/v1/collections/${id}`),
};

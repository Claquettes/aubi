import { apiJson } from './client';
import type { GraphData } from '@/types/api';

export const graphApi = {
  collaborations: () => apiJson<GraphData>(`/api/v1/graph/collaborations`),
};

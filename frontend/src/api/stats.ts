import { apiJson } from './client';
export const statsApi = { get: () => apiJson(`/api/v1/stats`) };

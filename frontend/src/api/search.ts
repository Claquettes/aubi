import { apiJson } from './client';
export const searchApi = { get: () => apiJson(`/api/v1/search`) };

import { apiJson } from './client';
export const concertsApi = { get: () => apiJson(`/api/v1/concerts`) };

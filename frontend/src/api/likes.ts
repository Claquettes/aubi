import { apiJson } from './client';
export const likesApi = { get: () => apiJson(`/api/v1/likes`) };

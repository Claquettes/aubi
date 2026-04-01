import { apiJson } from './client';
export const albumsApi = { get: () => apiJson(`/api/v1/albums`) };

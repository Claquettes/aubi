import { apiJson } from './client';
export const artistsApi = { get: () => apiJson(`/api/v1/artists`) };

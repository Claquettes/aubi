import { apiJson } from './client';
export const tracksApi = { get: () => apiJson(`/api/v1/tracks`) };

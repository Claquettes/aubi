import { apiJson } from './client';
export const audiobooksApi = { get: () => apiJson(`/api/v1/audiobooks`) };

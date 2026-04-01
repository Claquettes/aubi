import { apiJson } from './client';
export const scannerApi = { get: () => apiJson(`/api/v1/scanner`) };

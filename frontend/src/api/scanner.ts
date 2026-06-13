import { apiJson } from './client';
import type { ScannerStatus } from '@/types/api';

export const scannerApi = {
  status: () => apiJson<ScannerStatus>(`/api/v1/scanner/status`),
  scan: () =>
    apiJson<{ status: string; scanId: string }>(`/api/v1/scanner/scan`, {
      method: 'POST',
    }),
};

import { apiJson } from './client';
import { qs } from './qs';
import type { BrowseResult, SetupState, StorageInfo } from '@/types/api';

export const systemApi = {
  setup: () => apiJson<SetupState>(`/api/v1/system/setup`),
  completeSetup: () =>
    apiJson<SetupState>(`/api/v1/system/setup/complete`, { method: 'POST' }),
  browse: (path?: string) =>
    apiJson<BrowseResult>(`/api/v1/system/browse${qs({ path })}`),
  storage: () => apiJson<StorageInfo>(`/api/v1/system/storage`),
};

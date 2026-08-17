import { apiJson } from './client';
import type { Library, LibraryType } from '@/types/api';

export interface LibraryInput {
  name: string;
  type: LibraryType;
  path: string;
}

export const librariesApi = {
  list: () => apiJson<Library[]>(`/api/v1/libraries`),
  /** Rubriques alimentées, pour n'afficher que la navigation utile. */
  sections: () => apiJson<LibraryType[]>(`/api/v1/libraries/sections`),
  create: (body: LibraryInput) =>
    apiJson<Library>(`/api/v1/libraries`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<LibraryInput> & { enabled?: boolean }) =>
    apiJson<Library>(`/api/v1/libraries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiJson<void>(`/api/v1/libraries/${id}`, { method: 'DELETE' }),
  scan: (id: string) =>
    apiJson<{ status: string; scanId: string }>(
      `/api/v1/libraries/${id}/scan`,
      { method: 'POST' },
    ),
};

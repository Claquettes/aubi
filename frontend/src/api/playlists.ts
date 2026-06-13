import { apiJson } from './client';
import type { Paginated, Playlist, PlaylistDetail } from '@/types/api';

export const playlistsApi = {
  list: () => apiJson<Paginated<Playlist>>(`/api/v1/playlists`),
  get: (id: string) => apiJson<PlaylistDetail>(`/api/v1/playlists/${id}`),
  create: (body: { name: string; description?: string }) =>
    apiJson<Playlist>(`/api/v1/playlists`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: { name?: string; description?: string }) =>
    apiJson<Playlist>(`/api/v1/playlists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    apiJson<void>(`/api/v1/playlists/${id}`, { method: 'DELETE' }),
  addTracks: (id: string, trackIds: string[]) =>
    apiJson<{ added: number }>(`/api/v1/playlists/${id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackIds }),
    }),
  removeTrack: (id: string, trackId: string) =>
    apiJson<void>(`/api/v1/playlists/${id}/tracks/${trackId}`, {
      method: 'DELETE',
    }),
  reorder: (id: string, trackIds: string[]) =>
    apiJson<void>(`/api/v1/playlists/${id}/tracks/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ trackIds }),
    }),
};

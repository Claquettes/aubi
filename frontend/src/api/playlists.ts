import { apiJson } from './client';
export const playlistsApi = { get: () => apiJson(`/api/v1/playlists`) };

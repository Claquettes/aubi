import { apiJson } from './client';
import type { Paginated, Track } from '@/types/api';

export const likesApi = {
  list: () => apiJson<Paginated<Track>>(`/api/v1/likes`),
  like: (trackId: string) =>
    apiJson<void>(`/api/v1/likes/${trackId}`, { method: 'POST' }),
  unlike: (trackId: string) =>
    apiJson<void>(`/api/v1/likes/${trackId}`, { method: 'DELETE' }),
  likeAlbum: (id: string) =>
    apiJson<void>(`/api/v1/likes/albums/${id}`, { method: 'POST' }),
  unlikeAlbum: (id: string) =>
    apiJson<void>(`/api/v1/likes/albums/${id}`, { method: 'DELETE' }),
  likeArtist: (id: string) =>
    apiJson<void>(`/api/v1/likes/artists/${id}`, { method: 'POST' }),
  unlikeArtist: (id: string) =>
    apiJson<void>(`/api/v1/likes/artists/${id}`, { method: 'DELETE' }),
};

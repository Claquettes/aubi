import { apiJson } from './client';
import { qs } from './qs';
import type { Audiobook, AudiobookDetail, Paginated } from '@/types/api';

export interface AudiobooksQuery {
  search?: string;
  isBible?: boolean;
  page?: number;
  limit?: number;
}

export interface BibleBook {
  id: string;
  title: string;
  section: string;
  chapterCount: number;
}

export const audiobooksApi = {
  list: (q: AudiobooksQuery = {}) =>
    apiJson<Paginated<Audiobook>>(`/api/v1/audiobooks${qs({ ...q })}`),
  get: (id: string) => apiJson<AudiobookDetail>(`/api/v1/audiobooks/${id}`),
  bibleBooks: () =>
    apiJson<{ data: BibleBook[] }>(`/api/v1/audiobooks/bible/books`),
  saveProgress: (trackId: string, positionMs: number) =>
    apiJson<void>(`/api/v1/audiobooks/progress/${trackId}`, {
      method: 'PATCH',
      body: JSON.stringify({ positionMs }),
    }),
};

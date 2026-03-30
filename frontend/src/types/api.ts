export interface Track {
  id: string;
  title: string;
  artist: { id: string; name: string } | null;
  album: { id: string; title: string; year: number | null } | null;
  trackNumber: number | null;
  durationMs: number;
  fileFormat: string | null;
  section: 'music' | 'concert' | 'audiobook';
  isCover: boolean;
  isLiked: boolean;
  playCount: number;
  lastPlayedAt: string | null;
  coverUrl: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

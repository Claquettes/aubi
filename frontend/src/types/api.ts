export interface ArtistRef {
  id: string;
  name: string;
}

export interface AlbumRef {
  id: string;
  title: string;
  year: number | null;
}

export interface Track {
  id: string;
  title: string;
  artist: ArtistRef | null;
  album: AlbumRef | null;
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

export interface Album {
  id: string;
  title: string;
  artist: ArtistRef | null;
  year: number | null;
  trackCount: number;
  durationMs: number;
  coverUrl: string | null;
  playCount: number;
  isLiked: boolean;
}

export interface AlbumDetail extends Album {
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  albumCount: number;
  trackCount: number;
  coverUrl: string | null;
  isLiked: boolean;
}

export interface ArtistDetail extends Artist {
  albums: Album[];
}

export interface Concert {
  id: string;
  title: string;
  artist: ArtistRef | null;
  venue: string | null;
  concertDate: string | null;
  trackCount: number;
  durationMs: number;
  coverUrl: string | null;
  notes: string | null;
}

export interface ConcertDetail extends Concert {
  tracks: Track[];
}

export interface Audiobook {
  id: string;
  title: string;
  author: string | null;
  isBible: boolean;
  chapterCount: number;
  durationMs: number;
  coverUrl: string | null;
  progressPercent: number;
}

export interface AudiobookChapter {
  id: string;
  title: string;
  chapterNumber: number;
  parentSection: string | null;
  track: { id: string; durationMs: number };
  positionMs: number;
  completed: boolean;
}

export interface AudiobookDetail extends Audiobook {
  chapters: AudiobookChapter[];
}

export interface Collection {
  id: string;
  name: string;
  path: string;
  trackCount: number;
  albumCount: number;
  artistCount: number;
  durationMs: number;
  coverUrl: string | null;
}

export interface CollectionDetail {
  id: string;
  name: string;
  path: string;
  trackCount: number;
  artistCount: number;
  durationMs: number;
  coverUrl: string | null;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  trackCount: number;
  durationMs: number;
  coverUrl: string | null;
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[];
}

export interface StatsOverview {
  totalTracks: number;
  totalListenedMs: number;
  totalPlayEvents: number;
  mostPlayedSection: string;
  currentStreak: number;
  longestStreak: number;
}

export interface TopTrack {
  track: Track;
  playCount: number;
  totalListenedMs: number;
}

export interface HeatmapCell {
  date: string;
  totalMs: number;
  intensity: number;
}

export interface DailyStat {
  day: string;
  totalMs: number;
  playCount: number;
  bySection: Record<string, { totalMs: number; playCount: number }>;
}

export interface SearchResults {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  concerts: Concert[];
  audiobooks: Audiobook[];
}

export interface GraphNode {
  id: string;
  name: string;
  trackCount: number;
}
export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ScannerStatus {
  status: 'scanning' | 'idle' | 'error';
  lastScanAt: string | null;
  tracksFound: number;
  progress: number;
  errorMessage: string | null;
}

export type StatsPeriod = 'week' | 'month' | 'year' | 'all';

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

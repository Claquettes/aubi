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
  /** Somme des écoutes des titres de l'album. */
  playCount: number;
  /** Nombre de fois où le bouton lecture de l'album a été pressé. */
  albumPlayCount: number;
  lastPlayedAt: string | null;
  isLiked: boolean;
  isCompilation: boolean;
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
  /** Somme des écoutes de tous les titres de l'artiste (feats compris). */
  playCount: number;
  lastPlayedAt: string | null;
  coverUrl: string | null;
  isLiked: boolean;
}

export interface ArtistDetail extends Artist {
  albums: Album[];
  tracks: Track[];
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

export interface SectionSplit {
  section: string;
  playCount: number;
  totalMs: number;
}

export interface StatsOverview {
  // Bibliothèque
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  libraryDurationMs: number;
  librarySizeBytes: number;
  // Écoute sur la période
  totalListenedMs: number;
  totalPlayEvents: number;
  totalAlbumPlays: number;
  completedRate: number;
  distinctTracksPlayed: number;
  distinctAlbumsPlayed: number;
  distinctArtistsPlayed: number;
  libraryCoverage: number;
  activeDays: number;
  avgDailyMs: number;
  firstPlayAt: string | null;
  lastPlayAt: string | null;
  // Favoris
  likedTracks: number;
  likedAlbums: number;
  likedArtists: number;
  // Répartition
  mostPlayedSection: string;
  bySection: SectionSplit[];
  currentStreak: number;
  longestStreak: number;
}

export interface TopTrack {
  track: Track;
  playCount: number;
  totalListenedMs: number;
  lastPlayedAt: string | null;
}

export interface TopArtist {
  artist: { id: string; name: string; coverUrl: string | null };
  playCount: number;
  totalListenedMs: number;
  distinctTracks: number;
  libraryTracks: number;
  lastPlayedAt: string | null;
}

export interface TopAlbum {
  album: {
    id: string;
    title: string;
    year: number | null;
    artist: ArtistRef | null;
    coverUrl: string | null;
    trackCount: number;
  };
  playCount: number;
  totalListenedMs: number;
  distinctTracks: number;
  albumPlayCount: number;
  /** Part des titres de l'album réellement écoutés sur la période (0–1). */
  coverage: number;
  lastPlayedAt: string | null;
}

export interface HeatmapCell {
  date: string;
  totalMs: number;
  playCount: number;
  /** 0 = rien, 1–5 = quintiles d'activité. */
  intensity: number;
}

export interface MonthlyStat {
  month: string;
  playCount: number;
  totalMs: number;
  distinctTracks: number;
  distinctArtists: number;
  newTracks: number;
  newArtists: number;
  addedTracks: number;
}

export interface ListeningPatterns {
  byHour: { hour: number; playCount: number; totalMs: number }[];
  byWeekday: { weekday: number; playCount: number; totalMs: number }[];
  punchcard: { weekday: number; hour: number; playCount: number }[];
  slots: { key: string; label: string; playCount: number; totalMs: number }[];
  peakHour: number | null;
}

export interface StatsRecords {
  bestDay: { date: string; totalMs: number; playCount: number } | null;
  bestMonth: { month: string; totalMs: number; playCount: number } | null;
  longestSession: {
    startedAt: string | null;
    endedAt: string | null;
    playCount: number;
    totalMs: number;
  } | null;
  obsession: {
    trackId: string;
    title: string;
    artistName: string | null;
    date: string;
    playCount: number;
  } | null;
  discoveredTracks: number;
  discoveredArtists: number;
}

export interface RecentPlay {
  playedAt: string;
  completed: boolean;
  track: Track;
}

export interface LibraryStats {
  bySection: {
    section: string;
    trackCount: number;
    totalMs: number;
    sizeBytes: number;
  }[];
  byFormat: {
    format: string;
    trackCount: number;
    totalMs: number;
    sizeBytes: number;
  }[];
  byGenre: { genre: string; trackCount: number; totalMs: number }[];
  byDecade: { decade: number; albumCount: number; trackCount: number }[];
  byQuality: { bucket: string; trackCount: number }[];
  durations: {
    avgMs: number;
    medianMs: number;
    maxMs: number;
    minMs: number;
  };
  topArtistsByTracks: {
    artist: { id: string; name: string; coverUrl: string | null };
    trackCount: number;
    albumCount: number;
  }[];
  neverPlayedTracks: number;
  neverPlayedAlbums: number;
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

export type LibraryType = 'music' | 'concert' | 'audiobook';

export interface Library {
  id: string;
  name: string;
  type: LibraryType;
  path: string;
  enabled: boolean;
  position: number;
  lastScanAt: string | null;
  trackCount: number;
  sizeBytes: number;
  durationMs: number;
  /** Faux quand le dossier a disparu ou n'est plus lisible par le serveur. */
  available: boolean;
  writable: boolean;
  diskTotalBytes: number | null;
  diskFreeBytes: number | null;
}

export interface SetupState {
  completed: boolean;
  completedAt: string | null;
  libraryCount: number;
  mediaRoot: string;
  mediaRootWritable: boolean;
}

export interface BrowseEntry {
  name: string;
  path: string;
}

export interface BrowseResult {
  path: string;
  parent: string | null;
  roots: string[];
  writable: boolean;
  audioFileCount: number;
  entries: BrowseEntry[];
}

export interface StorageInfo {
  trackCount: number;
  sizeBytes: number;
  durationMs: number;
  albumCount: number;
  artistCount: number;
  hiddenTrackCount: number;
  hiddenSizeBytes: number;
  bySection: {
    section: LibraryType;
    trackCount: number;
    sizeBytes: number;
    durationMs: number;
  }[];
  mediaRoot: string;
  disk: { totalBytes: number; freeBytes: number } | null;
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

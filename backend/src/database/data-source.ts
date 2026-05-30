import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { Artist } from './entities/artist.entity';
import { Album } from './entities/album.entity';
import { Track } from './entities/track.entity';
import { Concert } from './entities/concert.entity';
import { Audiobook } from './entities/audiobook.entity';
import { AudiobookChapter } from './entities/audiobook-chapter.entity';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track.entity';
import { Like } from './entities/like.entity';
import { AlbumLike } from './entities/album-like.entity';
import { ArtistLike } from './entities/artist-like.entity';
import { TrackArtist } from './entities/track-artist.entity';
import { PlayEvent } from './entities/play-event.entity';
import { AudiobookProgress } from './entities/audiobook-progress.entity';
import { ScannerState } from './entities/scanner-state.entity';
import { InitialSchema1738761600000 } from './migrations/1738761600000-InitialSchema';
import { AlbumArtistLikes1760000000000 } from './migrations/1760000000000-AlbumArtistLikes';
import { TrackArtists1760000100000 } from './migrations/1760000100000-TrackArtists';

config({ path: join(__dirname, '../../.env') });

const migrations = [
  InitialSchema1738761600000,
  AlbumArtistLikes1760000000000,
  TrackArtists1760000100000,
];

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    Artist,
    Album,
    Track,
    Concert,
    Audiobook,
    AudiobookChapter,
    Playlist,
    PlaylistTrack,
    Like,
    AlbumLike,
    ArtistLike,
    TrackArtist,
    PlayEvent,
    AudiobookProgress,
    ScannerState,
  ],
  migrations,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});

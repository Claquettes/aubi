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
import { PlayEvent } from './entities/play-event.entity';
import { AudiobookProgress } from './entities/audiobook-progress.entity';
import { ScannerState } from './entities/scanner-state.entity';
import { InitialSchema1738761600000 } from './migrations/1738761600000-InitialSchema';

config({ path: join(__dirname, '../../.env') });

const migrations = [InitialSchema1738761600000];

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
    PlayEvent,
    AudiobookProgress,
    ScannerState,
  ],
  migrations,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});

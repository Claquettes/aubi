import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AlbumPlay } from './entities/album-play.entity';
import { AudiobookProgress } from './entities/audiobook-progress.entity';
import { ScannerState } from './entities/scanner-state.entity';
import { Library } from './entities/library.entity';
import { AppSetting } from './entities/app-setting.entity';

const entities = [
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
  AlbumPlay,
  AudiobookProgress,
  ScannerState,
  Library,
  AppSetting,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('databaseUrl'),
        entities,
        synchronize: false,
        // Uniquement erreurs/avertissements : le log de chaque requête ralentit
        // fortement les scans (des milliers de requêtes) et noie les logs.
        logging: ['error', 'warn'],
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

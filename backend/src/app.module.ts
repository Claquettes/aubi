import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ScannerModule } from './modules/scanner/scanner.module';
import { TracksModule } from './modules/tracks/tracks.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { StreamModule } from './modules/stream/stream.module';
import { CoversModule } from './modules/covers/covers.module';
import { ConcertsModule } from './modules/concerts/concerts.module';
import { AudiobooksModule } from './modules/audiobooks/audiobooks.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { LikesModule } from './modules/likes/likes.module';
import { StatsModule } from './modules/stats/stats.module';
import { SearchModule } from './modules/search/search.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { GraphModule } from './modules/graph/graph.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { LibrariesModule } from './modules/libraries/libraries.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    HealthModule,
    ScannerModule,
    TracksModule,
    AlbumsModule,
    ArtistsModule,
    StreamModule,
    CoversModule,
    ConcertsModule,
    AudiobooksModule,
    PlaylistsModule,
    LikesModule,
    StatsModule,
    SearchModule,
    CollectionsModule,
    GraphModule,
    MetadataModule,
    LibrariesModule,
    SystemModule,
  ],
})
export class AppModule {}

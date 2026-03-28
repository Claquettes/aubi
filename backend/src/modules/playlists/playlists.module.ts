import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from '../../database/entities/playlist.entity';
import { PlaylistTrack } from '../../database/entities/playlist-track.entity';
import { Track } from '../../database/entities/track.entity';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistTrack, Track]),
    TracksModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
})
export class PlaylistsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayEvent } from '../../database/entities/play-event.entity';
import { AlbumPlay } from '../../database/entities/album-play.entity';
import { Album } from '../../database/entities/album.entity';
import { Track } from '../../database/entities/track.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayEvent, AlbumPlay, Album, Track]),
    TracksModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

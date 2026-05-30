import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../../database/entities/like.entity';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { Artist } from '../../database/entities/artist.entity';
import { AlbumLike } from '../../database/entities/album-like.entity';
import { ArtistLike } from '../../database/entities/artist-like.entity';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, Track, AlbumLike, ArtistLike, Album, Artist]),
    TracksModule,
  ],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../../database/entities/like.entity';
import { Track } from '../../database/entities/track.entity';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Track]), TracksModule],
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}

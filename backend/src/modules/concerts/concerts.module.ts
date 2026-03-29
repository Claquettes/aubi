import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from '../../database/entities/concert.entity';
import { Track } from '../../database/entities/track.entity';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Concert, Track]), TracksModule],
  controllers: [ConcertsController],
  providers: [ConcertsService],
})
export class ConcertsModule {}

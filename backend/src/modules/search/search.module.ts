import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { Artist } from '../../database/entities/artist.entity';
import { Concert } from '../../database/entities/concert.entity';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, Album, Artist, Concert, Audiobook]),
    TracksModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from '../../database/entities/artist.entity';
import { Album } from '../../database/entities/album.entity';
import { Track } from '../../database/entities/track.entity';
import { Concert } from '../../database/entities/concert.entity';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { AudiobookChapter } from '../../database/entities/audiobook-chapter.entity';
import { ScannerState } from '../../database/entities/scanner-state.entity';
import { TrackArtist } from '../../database/entities/track-artist.entity';
import { Library } from '../../database/entities/library.entity';
import { ScannerController } from './scanner.controller';
import { ScannerService } from './scanner.service';
import { MetadataService } from './metadata.service';
import { CoverExtractorService } from './cover-extractor.service';
import { CoversModule } from '../covers/covers.module';

@Module({
  imports: [
    CoversModule,
    TypeOrmModule.forFeature([
      Artist,
      Album,
      Track,
      Concert,
      Audiobook,
      AudiobookChapter,
      ScannerState,
      TrackArtist,
      Library,
    ]),
  ],
  controllers: [ScannerController],
  providers: [ScannerService, MetadataService, CoverExtractorService],
  exports: [ScannerService, MetadataService, CoverExtractorService],
})
export class ScannerModule {}

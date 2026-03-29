import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { AudiobookChapter } from '../../database/entities/audiobook-chapter.entity';
import { AudiobookProgress } from '../../database/entities/audiobook-progress.entity';
import { Track } from '../../database/entities/track.entity';
import { AudiobooksController } from './audiobooks.controller';
import { AudiobooksService } from './audiobooks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Audiobook,
      AudiobookChapter,
      AudiobookProgress,
      Track,
    ]),
  ],
  controllers: [AudiobooksController],
  providers: [AudiobooksService],
})
export class AudiobooksModule {}

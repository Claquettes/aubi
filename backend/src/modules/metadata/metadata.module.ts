import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { ScannerModule } from '../scanner/scanner.module';
import { MetadataController } from './metadata.controller';
import { MetadataEditService } from './metadata-edit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Track, Album]), ScannerModule],
  controllers: [MetadataController],
  providers: [MetadataEditService],
})
export class MetadataModule {}

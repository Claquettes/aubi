import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsQueryDto } from './dto/albums-query.dto';
import { AlbumTypeDto } from './dto/album-type.dto';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  findAll(@Query() query: AlbumsQueryDto) {
    return this.albums.findAll(query);
  }

  /**
   * Album ↔ playlist. Déclaré ici (AlbumsModule est importé avant
   * MetadataModule) pour passer avant le `PATCH albums/:id` de l'édition de
   * métadonnées, qui avalerait « type » dans son ParseUUIDPipe.
   */
  @Patch('type')
  setType(@Body() dto: AlbumTypeDto) {
    return this.albums.setType(dto.ids, dto.isCompilation);
  }

  @Get(':id/tracks')
  tracks(@Param('id', ParseUUIDPipe) id: string) {
    return this.albums.findTracks(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.albums.findOne(id);
  }
}

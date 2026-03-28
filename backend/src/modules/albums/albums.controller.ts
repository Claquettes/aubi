import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsQueryDto } from './dto/albums-query.dto';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  findAll(@Query() query: AlbumsQueryDto) {
    return this.albums.findAll(query);
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

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { ArtistsQueryDto } from './dto/artists-query.dto';
import { TracksQueryDto } from '../tracks/dto/tracks-query.dto';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  findAll(@Query() query: ArtistsQueryDto) {
    return this.artists.findAll(query);
  }

  @Get(':id/albums')
  albums(@Param('id', ParseUUIDPipe) id: string) {
    return this.artists.findAlbums(id);
  }

  @Get(':id/tracks')
  tracks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TracksQueryDto,
  ) {
    return this.artists.findTracks(id, { ...query, artistId: id });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.artists.findOne(id);
  }
}

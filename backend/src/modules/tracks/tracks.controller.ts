import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { TracksQueryDto } from './dto/tracks-query.dto';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  @Get()
  findAll(@Query() query: TracksQueryDto) {
    return this.tracks.findAll(query);
  }

  @Get(':id/similar')
  similar(@Param('id', ParseUUIDPipe) id: string) {
    return this.tracks.findSimilar(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tracks.findOne(id);
  }
}

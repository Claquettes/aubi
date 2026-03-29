import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { PlayEventDto } from './dto/play-event.dto';
import { DailyQueryDto, TopQueryDto } from './dto/stats-query.dto';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  overview() {
    return this.stats.overview();
  }

  @Get('top-tracks')
  topTracks(@Query() query: TopQueryDto) {
    return this.stats.topTracks(query);
  }

  @Get('top-artists')
  topArtists(@Query() query: TopQueryDto) {
    return this.stats.topArtists(query);
  }

  @Get('top-albums')
  topAlbums(@Query() query: TopQueryDto) {
    return this.stats.topAlbums(query);
  }

  @Get('daily')
  daily(@Query() query: DailyQueryDto) {
    return this.stats.daily(query);
  }

  @Get('heatmap')
  heatmap() {
    return this.stats.heatmap();
  }

  @Post('play')
  @HttpCode(201)
  recordPlay(@Body() body: PlayEventDto) {
    return this.stats.recordPlay(body);
  }
}

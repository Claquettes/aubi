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
import { AlbumPlayDto } from './dto/album-play.dto';
import {
  DailyQueryDto,
  MonthlyQueryDto,
  RangeQueryDto,
  RecentQueryDto,
  TopQueryDto,
  TzQueryDto,
} from './dto/stats-query.dto';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  overview(@Query() query: RangeQueryDto) {
    return this.stats.overview(query);
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

  @Get('monthly')
  monthly(@Query() query: MonthlyQueryDto) {
    return this.stats.monthly(query);
  }

  @Get('heatmap')
  heatmap(@Query() query: TzQueryDto) {
    return this.stats.heatmap(query.tz);
  }

  /** Répartition des écoutes par heure et par jour de la semaine. */
  @Get('patterns')
  patterns(@Query() query: RangeQueryDto) {
    return this.stats.patterns(query);
  }

  /** Faits marquants : meilleur jour, plus longue session, obsession du moment. */
  @Get('records')
  records(@Query() query: RangeQueryDto) {
    return this.stats.records(query);
  }

  @Get('recent')
  recent(@Query() query: RecentQueryDto) {
    return this.stats.recent(query);
  }

  /** Composition du catalogue (formats, décennies, genres) — hors écoutes. */
  @Get('library')
  library() {
    return this.stats.library();
  }

  @Post('play')
  @HttpCode(201)
  recordPlay(@Body() body: PlayEventDto) {
    return this.stats.recordPlay(body);
  }

  // Un appui sur le bouton lecture d'un album (≠ écoute d'un titre).
  @Post('album-play')
  @HttpCode(201)
  recordAlbumPlay(@Body() body: AlbumPlayDto) {
    return this.stats.recordAlbumPlay(body);
  }
}

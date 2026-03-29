import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AudiobooksService } from './audiobooks.service';
import { AudiobooksQueryDto } from './dto/audiobooks-query.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('audiobooks')
export class AudiobooksController {
  constructor(private readonly audiobooks: AudiobooksService) {}

  @Get()
  findAll(@Query() query: AudiobooksQueryDto) {
    return this.audiobooks.findAll(query);
  }

  @Get('bible/books')
  bibleBooks() {
    return this.audiobooks.bibleBooks();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.audiobooks.findOne(id);
  }

  @Patch('progress/:trackId')
  @HttpCode(204)
  async progress(
    @Param('trackId', ParseUUIDPipe) trackId: string,
    @Body() body: UpdateProgressDto,
  ) {
    await this.audiobooks.updateProgress(trackId, body);
  }
}

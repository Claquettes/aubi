import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTracksDto } from './dto/add-tracks.dto';
import { ReorderTracksDto } from './dto/reorder-tracks.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get()
  findAll() {
    return this.playlists.findAll();
  }

  @Post()
  create(@Body() dto: CreatePlaylistDto) {
    return this.playlists.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.playlists.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlists.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.playlists.remove(id);
  }

  @Post(':id/tracks')
  addTracks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTracksDto,
  ) {
    return this.playlists.addTracks(id, dto);
  }

  @Delete(':id/tracks/:trackId')
  @HttpCode(204)
  async removeTrack(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('trackId', ParseUUIDPipe) trackId: string,
  ) {
    await this.playlists.removeTrack(id, trackId);
  }

  @Patch(':id/tracks/reorder')
  reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderTracksDto,
  ) {
    return this.playlists.reorder(id, dto);
  }
}

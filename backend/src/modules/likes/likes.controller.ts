import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('likes')
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.likes.findAll(query);
  }

  // --- Albums (routes spécifiques déclarées avant :trackId) ---
  @Post('albums/:id')
  @HttpCode(201)
  likeAlbum(@Param('id', ParseUUIDPipe) id: string) {
    return this.likes.likeAlbum(id);
  }

  @Delete('albums/:id')
  @HttpCode(204)
  async unlikeAlbum(@Param('id', ParseUUIDPipe) id: string) {
    await this.likes.unlikeAlbum(id);
  }

  // --- Artistes ---
  @Post('artists/:id')
  @HttpCode(201)
  likeArtist(@Param('id', ParseUUIDPipe) id: string) {
    return this.likes.likeArtist(id);
  }

  @Delete('artists/:id')
  @HttpCode(204)
  async unlikeArtist(@Param('id', ParseUUIDPipe) id: string) {
    await this.likes.unlikeArtist(id);
  }

  // --- Titres ---
  @Post(':trackId')
  @HttpCode(201)
  like(@Param('trackId', ParseUUIDPipe) trackId: string) {
    return this.likes.like(trackId);
  }

  @Delete(':trackId')
  @HttpCode(204)
  async unlike(@Param('trackId', ParseUUIDPipe) trackId: string) {
    await this.likes.unlike(trackId);
  }
}

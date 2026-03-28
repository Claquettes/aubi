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

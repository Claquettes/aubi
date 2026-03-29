import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { ConcertsQueryDto } from './dto/concerts-query.dto';

@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concerts: ConcertsService) {}

  @Get()
  findAll(@Query() query: ConcertsQueryDto) {
    return this.concerts.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.concerts.findOne(id);
  }
}

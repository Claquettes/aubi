import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  query(@Query() query: SearchQueryDto) {
    return this.searchService.search(query.q ?? '', query.section);
  }
}


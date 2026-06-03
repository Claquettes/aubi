import { Controller, Get, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  findAll() {
    return this.collections.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collections.findOne(id);
  }
}

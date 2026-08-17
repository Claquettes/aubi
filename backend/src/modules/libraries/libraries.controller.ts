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
import { LibrariesService } from './libraries.service';
import { CreateLibraryDto, UpdateLibraryDto } from './dto/library.dto';

@Controller('libraries')
export class LibrariesController {
  constructor(private readonly libraries: LibrariesService) {}

  @Get()
  findAll() {
    return this.libraries.findAll();
  }

  /** Rubriques alimentées : sert à masquer les entrées de navigation vides. */
  @Get('sections')
  sections() {
    return this.libraries.sections();
  }

  @Post()
  create(@Body() dto: CreateLibraryDto) {
    return this.libraries.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLibraryDto,
  ) {
    return this.libraries.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.libraries.remove(id);
  }

  @Post(':id/scan')
  @HttpCode(202)
  scan(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraries.scan(id);
  }
}

import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { MetadataEditService } from './metadata-edit.service';
import { BulkEditDto, EditAlbumDto, EditTrackDto } from './dto/edit.dto';

@Controller()
export class MetadataController {
  constructor(private readonly meta: MetadataEditService) {}

  // Déclaré avant tracks/:id pour ne pas être avalé par le ParseUUIDPipe.
  @Patch('tracks/bulk')
  bulkEdit(@Body() dto: BulkEditDto) {
    return this.meta.bulkEdit(dto);
  }

  @Patch('tracks/:id')
  editTrack(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EditTrackDto) {
    return this.meta.editTrack(id, dto);
  }

  @Patch('albums/:id')
  editAlbum(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EditAlbumDto) {
    return this.meta.editAlbum(id, dto);
  }
}

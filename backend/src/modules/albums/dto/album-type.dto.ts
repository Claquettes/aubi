import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

/** Reclasse un ou plusieurs albums en playlists (ou l'inverse). */
export class AlbumTypeDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];

  /** `true` = c'est une playlist, `false` = c'est un vrai album. */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isCompilation: boolean;
}

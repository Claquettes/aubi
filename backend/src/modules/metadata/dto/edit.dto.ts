import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class EditTrackDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artistName?: string;
}

export class EditAlbumDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3000)
  year?: number;
}

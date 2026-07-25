import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AlbumPlayDto {
  @IsUUID()
  albumId: string;

  @IsOptional()
  @IsString()
  source?: string;
}

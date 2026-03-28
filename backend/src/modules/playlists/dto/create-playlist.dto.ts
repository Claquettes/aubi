import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

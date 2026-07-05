import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ArtistsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isLiked?: boolean;

  // Bornes sur le nombre de titres : grille principale (≥2), Artistes Divers (=1).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minTracks?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTracks?: number;
}

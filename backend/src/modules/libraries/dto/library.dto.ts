import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { LibraryType } from '../../../database/entities/library.entity';

export const LIBRARY_TYPES = ['music', 'concert', 'audiobook'] as const;

export class CreateLibraryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsIn(LIBRARY_TYPES)
  type: LibraryType;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateLibraryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(LIBRARY_TYPES)
  type?: LibraryType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

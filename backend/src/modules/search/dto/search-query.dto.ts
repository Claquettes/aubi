import { IsIn, IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;
}

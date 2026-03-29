import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TopQueryDto {
  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @IsIn(['week', 'month', 'year', 'all'])
  period: 'week' | 'month' | 'year' | 'all' = 'month';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

export class DailyQueryDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;
}

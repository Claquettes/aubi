import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ArtistsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['music', 'concert', 'audiobook'])
  section?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

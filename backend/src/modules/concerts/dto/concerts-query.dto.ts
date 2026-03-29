import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ConcertsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

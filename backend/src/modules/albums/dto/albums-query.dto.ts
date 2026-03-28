import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AlbumsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

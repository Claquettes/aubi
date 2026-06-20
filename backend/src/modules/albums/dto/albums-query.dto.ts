import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AlbumsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isLiked?: boolean;

  // true → renvoie les compilations (collections) ; sinon les vrais albums.
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isCompilation?: boolean;
}

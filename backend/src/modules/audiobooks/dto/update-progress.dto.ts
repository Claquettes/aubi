import { IsInt, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  positionMs: number;
}

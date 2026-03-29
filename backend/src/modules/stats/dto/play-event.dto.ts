import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class PlayEventDto {
  @IsUUID()
  trackId: string;

  @IsInt()
  @Min(0)
  durationMs: number;

  @IsBoolean()
  completed: boolean;

  @IsOptional()
  @IsString()
  source?: string;
}

import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderTracksDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  trackIds: string[];
}

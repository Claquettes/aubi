import { Module } from '@nestjs/common';
import { CoversController } from './covers.controller';

@Module({
  controllers: [CoversController],
})
export class CoversModule {}

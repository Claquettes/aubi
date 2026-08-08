import { Module } from '@nestjs/common';
import { CoversController } from './covers.controller';
import { CoverResolverService } from './cover-resolver.service';

@Module({
  controllers: [CoversController],
  providers: [CoverResolverService],
  exports: [CoverResolverService],
})
export class CoversModule {}

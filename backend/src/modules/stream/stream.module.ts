import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [TracksModule],
  controllers: [StreamController],
})
export class StreamModule {}

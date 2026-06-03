import { Controller, Get } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('graph')
export class GraphController {
  constructor(private readonly graph: GraphService) {}

  @Get('collaborations')
  collaborations() {
    return this.graph.collaborations();
  }
}

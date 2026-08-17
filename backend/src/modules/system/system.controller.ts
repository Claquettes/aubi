import { Controller, Get, Post, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { SystemService } from './system.service';

class BrowseQueryDto {
  @IsOptional()
  @IsString()
  path?: string;
}

@Controller('system')
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Get('setup')
  setup() {
    return this.system.setupState();
  }

  @Post('setup/complete')
  complete() {
    return this.system.completeSetup();
  }

  @Get('browse')
  browse(@Query() query: BrowseQueryDto) {
    return this.system.browse(query.path);
  }

  @Get('storage')
  storage() {
    return this.system.storage();
  }
}

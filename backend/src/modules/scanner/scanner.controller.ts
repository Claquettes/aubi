import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ScannerService } from './scanner.service';

@Controller('scanner')
export class ScannerController {
  constructor(private readonly scanner: ScannerService) {}

  @Post('scan')
  @HttpCode(202)
  startScan() {
    return this.scanner.startScan();
  }

  @Get('status')
  status() {
    return this.scanner.getStatus();
  }
}

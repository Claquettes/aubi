import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { extname } from 'path';

@Controller('covers')
export class CoversController {
  constructor(private readonly config: ConfigService) {}

  @Get(':filename')
  getCover(
    @Param('filename') filename: string,
    @Res({ passthrough: false }) res: Response,
  ): void {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new NotFoundException();
    }
    const dir = this.config.get<string>('coversPath') ?? './static/covers';
    const path = join(dir, filename);
    if (!existsSync(path)) {
      throw new NotFoundException();
    }
    const ext = extname(filename).toLowerCase();
    const type =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
    res.setHeader('Content-Type', type);
    res.setHeader(
      'Cache-Control',
      'public, max-age=31536000, immutable',
    );
    createReadStream(path).pipe(res);
  }
}

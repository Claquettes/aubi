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
import { basename, join } from 'path';
import { extname } from 'path';
import { CoverResolverService } from './cover-resolver.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('covers')
export class CoversController {
  constructor(
    private readonly config: ConfigService,
    private readonly resolver: CoverResolverService,
  ) {}

  @Get(':filename')
  async getCover(
    @Param('filename') filename: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new NotFoundException();
    }
    const dir = this.config.get<string>('coversPath') ?? './static/covers';
    let path = join(dir, filename);
    let ownCover = true;
    if (!existsSync(path)) {
      // Pas de pochette propre (cas des concerts) : on sert celle de l'artiste.
      const id = basename(filename, extname(filename));
      const fallback = UUID_RE.test(id) ? await this.resolver.resolve(id) : null;
      if (!fallback || !existsSync(fallback)) {
        throw new NotFoundException();
      }
      path = fallback;
      ownCover = false;
    }
    const ext = extname(filename).toLowerCase();
    const type =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
    res.setHeader('Content-Type', type);
    // Une pochette propre est immuable (nom = id) ; un repli peut changer dès
    // qu'une vraie pochette arrive, donc on ne le fige pas dans le navigateur.
    res.setHeader(
      'Cache-Control',
      ownCover ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    );
    createReadStream(path).pipe(res);
  }
}

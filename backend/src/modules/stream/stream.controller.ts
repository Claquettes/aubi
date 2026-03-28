import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import { extname } from 'path';
import { TracksService } from '../tracks/tracks.service';

const MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
};

@Controller('stream')
export class StreamController {
  constructor(private readonly tracks: TracksService) {}

  @Get(':trackId')
  @Header('Accept-Ranges', 'bytes')
  async stream(
    @Param('trackId', ParseUUIDPipe) trackId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { filePath, fileFormat } = await this.tracks.findFilePath(trackId);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Audio file not found on disk');
    }
    const st = statSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const mime =
      (fileFormat && `audio/${fileFormat}`) ||
      MIME[ext] ||
      'application/octet-stream';
    res.setHeader('Content-Type', mime);

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : st.size - 1;
      if (Number.isNaN(start) || start >= st.size || end < start) {
        res.status(416);
        res.setHeader('Content-Range', `bytes */${st.size}`);
        res.end();
        return;
      }
      const chunkEnd = Math.min(end, st.size - 1);
      const chunkSize = chunkEnd - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${chunkEnd}/${st.size}`);
      res.setHeader('Content-Length', String(chunkSize));
      createReadStream(filePath, { start, end: chunkEnd }).pipe(res);
    } else {
      res.setHeader('Content-Length', String(st.size));
      createReadStream(filePath).pipe(res);
    }
  }
}

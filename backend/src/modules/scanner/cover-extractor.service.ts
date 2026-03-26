import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, access } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { constants } from 'fs';

@Injectable()
export class CoverExtractorService {
  constructor(private readonly config: ConfigService) {}

  private coversDir(): string {
    return this.config.get<string>('coversPath') ?? './static/covers';
  }

  async ensureCoversDir(): Promise<void> {
    await mkdir(this.coversDir(), { recursive: true });
  }

  async saveAlbumCover(albumId: string, buffer: Buffer): Promise<string> {
    await this.ensureCoversDir();
    const out = join(this.coversDir(), `${albumId}.jpg`);
    const resized = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    await writeFile(out, resized);
    return out;
  }

  async saveFromFolderImage(albumId: string, folderPath: string): Promise<string | null> {
    for (const name of ['cover.jpg', 'folder.jpg', 'cover.png', 'folder.png']) {
      const p = join(folderPath, name);
      try {
        await access(p, constants.R_OK);
        const buf = await sharp(p)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        await this.ensureCoversDir();
        const out = join(this.coversDir(), `${albumId}.jpg`);
        await writeFile(out, buf);
        return out;
      } catch {
        /* try next */
      }
    }
    return null;
  }
}

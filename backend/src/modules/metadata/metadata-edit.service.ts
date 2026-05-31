import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as NodeID3 from 'node-id3';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { ScannerService } from '../scanner/scanner.service';
import { EditAlbumDto, EditTrackDto } from './dto/edit.dto';

@Injectable()
export class MetadataEditService {
  private readonly logger = new Logger(MetadataEditService.name);

  constructor(
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    private readonly scanner: ScannerService,
  ) {}

  /** Écrit des tags ID3 dans un MP3 (autres formats ignorés). Sauvegarde .aubi-bak au 1er passage. */
  private async writeMp3Tags(
    filePath: string,
    tags: NodeID3.Tags,
  ): Promise<boolean> {
    if (!filePath.toLowerCase().endsWith('.mp3')) return false;
    if (!Object.keys(tags).length) return false;
    const bak = `${filePath}.aubi-bak`;
    try {
      await fs.access(bak);
    } catch {
      try {
        await fs.copyFile(filePath, bak);
      } catch {
        /* backup best-effort */
      }
    }
    const res = NodeID3.update(tags, filePath);
    return res === true;
  }

  async editTrack(id: string, dto: EditTrackDto) {
    const track = await this.trackRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!track) throw new NotFoundException('Track not found');

    const tags: NodeID3.Tags = {};

    if (dto.title !== undefined && dto.title.trim()) {
      track.title = dto.title.trim();
      tags.title = track.title;
    }

    let newArtist: string | undefined;
    if (dto.artistName !== undefined && dto.artistName.trim()) {
      newArtist = dto.artistName.trim();
      const artists = await this.scanner.ensureArtists(newArtist);
      track.artistId = artists[0].id;
      await this.trackRepo.save(track);
      await this.scanner.syncTrackArtists(track.id, artists);
      tags.artist = newArtist;
    } else {
      await this.trackRepo.save(track);
    }

    let fileWritten = false;
    try {
      fileWritten = await this.writeMp3Tags(track.filePath, tags);
    } catch (e) {
      this.logger.warn(`Tag write failed for ${track.filePath}: ${e}`);
    }
    return { id: track.id, fileWritten };
  }

  async editAlbum(id: string, dto: EditAlbumDto) {
    const album = await this.albumRepo.findOne({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    const tags: NodeID3.Tags = {};
    if (dto.title !== undefined && dto.title.trim()) {
      album.title = dto.title.trim();
      tags.album = album.title;
    }
    if (dto.year !== undefined) {
      album.year = dto.year;
      if (dto.year) tags.year = String(dto.year);
    }
    await this.albumRepo.save(album);

    let filesWritten = 0;
    let totalTracks = 0;
    if (Object.keys(tags).length) {
      const tracks = await this.trackRepo.find({
        where: { albumId: id, deletedAt: IsNull() },
      });
      totalTracks = tracks.length;
      for (const t of tracks) {
        try {
          if (await this.writeMp3Tags(t.filePath, tags)) filesWritten++;
        } catch {
          /* per-file best-effort */
        }
      }
    }
    return { id: album.id, filesWritten, totalTracks };
  }
}

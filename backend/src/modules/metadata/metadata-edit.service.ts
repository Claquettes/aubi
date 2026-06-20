import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as NodeID3 from 'node-id3';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { ScannerService } from '../scanner/scanner.service';
import { BulkEditDto, EditAlbumDto, EditTrackDto } from './dto/edit.dto';

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

    if (dto.genre !== undefined) {
      track.genre = dto.genre.trim() || null;
      if (dto.genre.trim()) tags.genre = dto.genre.trim();
    }

    // Édition manuelle : verrouille pour que le scanner ne réécrase plus.
    track.metadataLocked = true;

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

  /** Édition en lot de plusieurs titres : album / artiste / genre / année. */
  async bulkEdit(dto: BulkEditDto) {
    const result = { updated: 0, filesWritten: 0, total: dto.ids.length };
    for (const id of dto.ids) {
      const track = await this.trackRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['artist'],
      });
      if (!track) continue;

      const tags: NodeID3.Tags = {};
      let primaryArtist = track.artist;

      if (dto.artistName !== undefined && dto.artistName.trim()) {
        const artists = await this.scanner.ensureArtists(dto.artistName.trim());
        track.artistId = artists[0].id;
        primaryArtist = artists[0];
        await this.scanner.syncTrackArtists(track.id, artists);
        tags.artist = dto.artistName.trim();
      }

      let albumId = track.albumId;
      if (dto.album !== undefined && dto.album.trim() && primaryArtist) {
        const album = await this.scanner.ensureAlbum(
          dto.album.trim(),
          primaryArtist,
          false,
        );
        track.albumId = album.id;
        albumId = album.id;
        tags.album = dto.album.trim();
      }

      if (dto.genre !== undefined) {
        track.genre = dto.genre.trim() || null;
        if (dto.genre.trim()) tags.genre = dto.genre.trim();
      }

      // Édition manuelle : verrouille pour que le scanner ne réécrase plus.
      track.metadataLocked = true;
      await this.trackRepo.save(track);

      if (dto.year !== undefined) {
        if (albumId) await this.albumRepo.update(albumId, { year: dto.year });
        if (dto.year) tags.year = String(dto.year);
      }

      try {
        if (await this.writeMp3Tags(track.filePath, tags)) result.filesWritten++;
      } catch {
        /* per-file best-effort */
      }
      result.updated++;
    }
    return result;
  }
}

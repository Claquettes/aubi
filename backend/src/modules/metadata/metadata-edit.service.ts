import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { File as TagFile } from 'node-taglib-sharp';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { ScannerService } from '../scanner/scanner.service';
import { BulkEditDto, EditAlbumDto, EditTrackDto } from './dto/edit.dto';

/** Tags qu'on sait réécrire dans un fichier, tous formats confondus. */
interface FileTags {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
}

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

  /**
   * Réécrit les tags DANS le fichier — mp3 (ID3), m4a/mp4 (atomes iTunes),
   * flac, ogg, wav… La bibliothèque est majoritairement en .m4a : se limiter
   * à l'ID3 laisserait les deux tiers des fichiers avec les anciens tags.
   * Copie de sauvegarde `.aubi-bak` au premier passage sur un fichier.
   */
  private async writeFileTags(
    filePath: string,
    tags: FileTags,
  ): Promise<boolean> {
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

    let file: TagFile | undefined;
    try {
      file = TagFile.createFromPath(filePath);
      if (tags.title !== undefined) file.tag.title = tags.title;
      if (tags.artist !== undefined) file.tag.performers = [tags.artist];
      if (tags.album !== undefined) file.tag.album = tags.album;
      if (tags.genre !== undefined) file.tag.genres = [tags.genre];
      if (tags.year !== undefined) file.tag.year = tags.year;
      file.save();
      return true;
    } catch (e) {
      // Format non géré (.aac brut par ex.) ou fichier verrouillé : la base
      // reste la référence, on n'interrompt pas l'édition pour autant.
      this.logger.warn(`Tags non écrits pour ${filePath} : ${e}`);
      return false;
    } finally {
      file?.dispose();
    }
  }

  async editTrack(id: string, dto: EditTrackDto) {
    const track = await this.trackRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!track) throw new NotFoundException('Track not found');

    const tags: FileTags = {};

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
      fileWritten = await this.writeFileTags(track.filePath, tags);
    } catch (e) {
      this.logger.warn(`Tag write failed for ${track.filePath}: ${e}`);
    }
    return { id: track.id, fileWritten };
  }

  async editAlbum(id: string, dto: EditAlbumDto) {
    const album = await this.albumRepo.findOne({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    const tags: FileTags = {};
    if (dto.title !== undefined && dto.title.trim()) {
      album.title = dto.title.trim();
      tags.album = album.title;
    }
    if (dto.year !== undefined) {
      album.year = dto.year;
      if (dto.year) tags.year = dto.year;
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
          if (await this.writeFileTags(t.filePath, tags)) filesWritten++;
        } catch {
          /* per-file best-effort */
        }
      }
    }
    return { id: album.id, filesWritten, totalTracks };
  }

  /**
   * Réaligne l'artiste des albums touchés sur celui de la majorité de leurs
   * titres — même règle que `reconcileAlbums` après un scan, mais tout de
   * suite : sinon l'en-tête de l'album continue d'afficher l'ancien artiste.
   */
  private async syncAlbumArtists(albumIds: string[]) {
    if (!albumIds.length) return;
    await this.albumRepo.query(
      `UPDATE albums a SET artist_id = s.aid
       FROM (
         SELECT t.album_id, mode() WITHIN GROUP (ORDER BY t.artist_id) AS aid
         FROM tracks t
         WHERE t.deleted_at IS NULL AND t.artist_id IS NOT NULL
           AND t.album_id = ANY($1)
         GROUP BY t.album_id
       ) s
       WHERE a.id = s.album_id AND a.artist_id IS DISTINCT FROM s.aid`,
      [albumIds],
    );
  }

  /** Édition en lot de plusieurs titres : album / artiste / genre / année. */
  async bulkEdit(dto: BulkEditDto) {
    const result = { updated: 0, filesWritten: 0, total: dto.ids.length };
    const touchedAlbums = new Set<string>();
    for (const id of dto.ids) {
      const track = await this.trackRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['artist'],
      });
      if (!track) continue;

      const tags: FileTags = {};
      let primaryArtist = track.artist;

      if (dto.artistName !== undefined && dto.artistName.trim()) {
        const artists = await this.scanner.ensureArtists(dto.artistName.trim());
        // La relation est chargée : il FAUT la réassigner, sinon TypeORM lui
        // donne priorité au save() et restaure l'ancien artist_id.
        track.artist = artists[0];
        track.artistId = artists[0].id;
        primaryArtist = artists[0];
        await this.scanner.syncTrackArtists(track.id, artists);
        tags.artist = dto.artistName.trim();
      }

      let albumId = track.albumId;
      if (albumId) touchedAlbums.add(albumId);
      if (dto.album !== undefined && dto.album.trim() && primaryArtist) {
        const album = await this.scanner.ensureAlbum(
          dto.album.trim(),
          primaryArtist,
          false,
        );
        track.albumId = album.id;
        albumId = album.id;
        touchedAlbums.add(album.id);
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
        if (dto.year) tags.year = dto.year;
      }

      try {
        if (await this.writeFileTags(track.filePath, tags)) result.filesWritten++;
      } catch {
        /* per-file best-effort */
      }
      result.updated++;
    }
    if (dto.artistName !== undefined || dto.album !== undefined) {
      await this.syncAlbumArtists([...touchedAlbums]);
    }
    return result;
  }
}

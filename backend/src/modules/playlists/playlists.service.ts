import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Playlist } from '../../database/entities/playlist.entity';
import { PlaylistTrack } from '../../database/entities/playlist-track.entity';
import { Track } from '../../database/entities/track.entity';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTracksDto } from './dto/add-tracks.dto';
import { ReorderTracksDto } from './dto/reorder-tracks.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private readonly ptRepo: Repository<PlaylistTrack>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  private async playlistAgg(ids: string[]) {
    const map = new Map<string, { trackCount: number; durationMs: number }>();
    if (ids.length === 0) return map;
    const rows = await this.dataSource.query<
      { playlist_id: string; c: string; d: string }[]
    >(
      `
      SELECT pt.playlist_id, COUNT(*)::int AS c, COALESCE(SUM(t.duration_ms),0)::bigint AS d
      FROM playlist_tracks pt
      JOIN tracks t ON t.id = pt.track_id AND t.deleted_at IS NULL
      WHERE pt.playlist_id = ANY($1)
      GROUP BY pt.playlist_id
    `,
      [ids],
    );
    for (const r of rows) {
      map.set(r.playlist_id, {
        trackCount: Number(r.c),
        durationMs: Number(r.d),
      });
    }
    return map;
  }

  async findAll() {
    const rows = await this.playlistRepo.find({
      order: { updatedAt: 'DESC' },
    });
    const agg = await this.playlistAgg(rows.map((p) => p.id));
    return {
      data: rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        trackCount: agg.get(p.id)?.trackCount ?? 0,
        durationMs: agg.get(p.id)?.durationMs ?? 0,
        coverUrl: `/api/v1/covers/playlist-${p.id}.jpg`,
      })),
    };
  }

  async create(dto: CreatePlaylistDto) {
    const p = this.playlistRepo.create({
      name: dto.name,
      description: dto.description ?? null,
    });
    await this.playlistRepo.save(p);
    return p;
  }

  async findOne(id: string) {
    const p = await this.playlistRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    const pts = await this.ptRepo.find({
      where: { playlistId: id },
      order: { position: 'ASC' },
      relations: ['track', 'track.artist', 'track.album'],
    });
    const trackRows = pts
      .map((x) => x.track)
      .filter((t): t is Track => t != null && !t.deletedAt);
    const ids = trackRows.map((t) => t.id);
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      tracks: trackRows.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist
          ? { id: t.artist.id, name: t.artist.name }
          : null,
        album: t.album
          ? { id: t.album.id, title: t.album.title, year: t.album.year }
          : null,
        trackNumber: t.trackNumber,
        durationMs: t.durationMs,
        fileFormat: t.fileFormat,
        section: t.section,
        isCover: t.isCover,
        isLiked: liked.has(t.id),
        playCount: playMap.get(t.id)?.play_count ?? 0,
        lastPlayedAt:
          playMap.get(t.id)?.last_played_at?.toISOString() ?? null,
        coverUrl: this.tracksService.coverUrlForTrack(t),
      })),
    };
  }

  async update(id: string, dto: UpdatePlaylistDto) {
    const p = await this.playlistRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    if (dto.name != null) p.name = dto.name;
    if (dto.description !== undefined) p.description = dto.description;
    await this.playlistRepo.save(p);
    return p;
  }

  async remove(id: string) {
    const p = await this.playlistRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    await this.playlistRepo.remove(p);
  }

  async addTracks(id: string, dto: AddTracksDto) {
    const p = await this.playlistRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    const maxRow = await this.ptRepo
      .createQueryBuilder('pt')
      .select('MAX(pt.position)', 'm')
      .where('pt.playlist_id = :id', { id })
      .getRawOne<{ m: string | null }>();
    let maxPos = maxRow?.m ? parseInt(maxRow.m, 10) : 0;
    let added = 0;
    for (const tid of dto.trackIds) {
      const t = await this.trackRepo.findOne({
        where: { id: tid, deletedAt: IsNull() },
      });
      if (!t) continue;
      const exists = await this.ptRepo.findOne({
        where: { playlistId: id, trackId: tid },
      });
      if (exists) continue;
      maxPos += 1;
      await this.ptRepo.save(
        this.ptRepo.create({
          playlistId: id,
          trackId: tid,
          position: maxPos,
        }),
      );
      added++;
    }
    return { added };
  }

  async removeTrack(playlistId: string, trackId: string) {
    const r = await this.ptRepo.findOne({
      where: { playlistId, trackId },
    });
    if (!r) throw new NotFoundException('Track not in playlist');
    await this.ptRepo.remove(r);
  }

  async reorder(id: string, dto: ReorderTracksDto) {
    const p = await this.playlistRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Playlist not found');
    const existing = await this.ptRepo.find({
      where: { playlistId: id },
    });
    const set = new Set(existing.map((e) => e.trackId));
    for (const tid of dto.trackIds) {
      if (!set.has(tid)) {
        throw new ConflictException('Track not in playlist: ' + tid);
      }
    }
    let pos = 1;
    for (const tid of dto.trackIds) {
      await this.ptRepo.update(
        { playlistId: id, trackId: tid },
        { position: pos++ },
      );
    }
    return { ok: true };
  }
}

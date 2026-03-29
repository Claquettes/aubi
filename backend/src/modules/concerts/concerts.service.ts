import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Concert } from '../../database/entities/concert.entity';
import { Track } from '../../database/entities/track.entity';
import { buildMeta } from '../../common/dto/pagination.dto';
import { ConcertsQueryDto } from './dto/concerts-query.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class ConcertsService {
  constructor(
    @InjectRepository(Concert)
    private readonly concertRepo: Repository<Concert>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  private async stats(ids: string[]) {
    const map = new Map<
      string,
      { trackCount: number; durationMs: number }
    >();
    if (ids.length === 0) return map;
    const rows = await this.dataSource.query<
      { concert_id: string; c: string; d: string }[]
    >(
      `
      SELECT t.concert_id, COUNT(t.id)::int AS c, COALESCE(SUM(t.duration_ms),0)::bigint AS d
      FROM tracks t
      WHERE t.deleted_at IS NULL AND t.concert_id = ANY($1)
      GROUP BY t.concert_id
    `,
      [ids],
    );
    for (const r of rows) {
      map.set(r.concert_id, {
        trackCount: Number(r.c),
        durationMs: Number(r.d),
      });
    }
    return map;
  }

  async findAll(query: ConcertsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.concertRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.artist', 'artist');
    if (query.artistId) {
      qb.andWhere('c.artist_id = :artistId', { artistId: query.artistId });
    }
    if (query.search?.trim()) {
      qb.andWhere(
        '(c.title ILIKE :q OR c.venue ILIKE :q)',
        { q: `%${query.search.trim()}%` },
      );
    }
    qb.orderBy('c.concert_date', 'DESC', 'NULLS LAST').addOrderBy(
      'c.created_at',
      'DESC',
    );
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const st = await this.stats(rows.map((r) => r.id));
    const data = rows.map((c) => ({
      id: c.id,
      title: c.title,
      artist: c.artist
        ? { id: c.artist.id, name: c.artist.name }
        : null,
      venue: c.venue,
      concertDate: c.concertDate,
      trackCount: st.get(c.id)?.trackCount ?? 0,
      durationMs: st.get(c.id)?.durationMs ?? 0,
      coverUrl: `/api/v1/covers/${c.id}.jpg`,
      notes: c.notes,
    }));
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const c = await this.concertRepo.findOne({
      where: { id },
      relations: ['artist'],
    });
    if (!c) throw new NotFoundException('Concert not found');
    const st = await this.stats([id]);
    const tracks = await this.trackRepo.find({
      where: { concertId: id, deletedAt: IsNull() },
      order: { trackNumber: 'ASC', title: 'ASC' },
      relations: ['artist', 'album'],
    });
    const ids = tracks.map((t) => t.id);
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);
    return {
      id: c.id,
      title: c.title,
      artist: c.artist
        ? { id: c.artist.id, name: c.artist.name }
        : null,
      venue: c.venue,
      concertDate: c.concertDate,
      trackCount: st.get(id)?.trackCount ?? 0,
      durationMs: st.get(id)?.durationMs ?? 0,
      coverUrl: `/api/v1/covers/${c.id}.jpg`,
      notes: c.notes,
      tracks: tracks.map((t) => ({
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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Track } from '../../database/entities/track.entity';
import { Like } from '../../database/entities/like.entity';
import { buildMeta } from '../../common/dto/pagination.dto';
import { TracksQueryDto } from './dto/tracks-query.dto';

export interface TrackJson {
  id: string;
  title: string;
  artist: { id: string; name: string } | null;
  album: { id: string; title: string; year: number | null } | null;
  trackNumber: number | null;
  durationMs: number;
  fileFormat: string | null;
  section: string;
  isCover: boolean;
  isLiked: boolean;
  playCount: number;
  lastPlayedAt: string | null;
  coverUrl: string | null;
}

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  coverUrlForTrack(t: Track): string | null {
    if (t.albumId) return `/api/v1/covers/${t.albumId}.jpg`;
    if (t.concertId) return `/api/v1/covers/${t.concertId}.jpg`;
    return null;
  }

  private toJson(
    t: Track,
    extras: {
      isLiked: boolean;
      playCount: number;
      lastPlayedAt: Date | null;
    },
  ): TrackJson {
    return {
      id: t.id,
      title: t.title,
      artist: t.artist
        ? { id: t.artist.id, name: t.artist.name }
        : null,
      album: t.album
        ? {
            id: t.album.id,
            title: t.album.title,
            year: t.album.year,
          }
        : null,
      trackNumber: t.trackNumber,
      durationMs: t.durationMs,
      fileFormat: t.fileFormat,
      section: t.section,
      isCover: t.isCover,
      isLiked: extras.isLiked,
      playCount: extras.playCount,
      lastPlayedAt: extras.lastPlayedAt?.toISOString() ?? null,
      coverUrl: this.coverUrlForTrack(t),
    };
  }

  async findAll(query: TracksQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.trackRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.artist', 'artist')
      .leftJoinAndSelect('t.album', 'album')
      .where('t.deleted_at IS NULL');

    if (query.section) {
      qb.andWhere('t.section = :section', { section: query.section });
    }
    if (query.artistId) {
      qb.andWhere('t.artist_id = :artistId', { artistId: query.artistId });
    }
    if (query.albumId) {
      qb.andWhere('t.album_id = :albumId', { albumId: query.albumId });
    }
    if (query.isCompilation !== undefined) {
      qb.andWhere('album.is_compilation = :ac', { ac: query.isCompilation });
    }
    if (query.concertId) {
      qb.andWhere('t.concert_id = :concertId', { concertId: query.concertId });
    }
    if (query.search?.trim()) {
      qb.andWhere('t.title ILIKE :q', { q: `%${query.search.trim()}%` });
    }
    if (query.folder) {
      qb.andWhere(`regexp_replace(t.file_path, '/[^/]*$', '') = :folder`, {
        folder: query.folder,
      });
    }
    if (query.isCover === true) {
      qb.andWhere('t.is_cover = true');
    } else if (query.isCover === false) {
      qb.andWhere('t.is_cover = false');
    }
    if (query.isLiked === true) {
      qb.innerJoin(Like, 'lk', 'lk.track_id = t.id');
    } else if (query.isLiked === false) {
      qb.leftJoin(Like, 'lk2', 'lk2.track_id = t.id').andWhere(
        'lk2.track_id IS NULL',
      );
    }

    const sortCol =
      query.sort === 'title'
        ? 't.title'
        : query.sort === 'duration'
          ? 't.durationMs'
          : query.sort === 'trackNumber'
            ? 't.trackNumber'
            : 't.createdAt';
    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(sortCol, order).addOrderBy('t.id', 'ASC');

    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const ids = rows.map((r) => r.id);
    const { playMap, liked } = await this.getBatchTrackStats(ids);
    const data = rows.map((t) =>
      this.toJson(t, {
        isLiked: liked.has(t.id),
        playCount: playMap.get(t.id)?.play_count ?? 0,
        lastPlayedAt: playMap.get(t.id)?.last_played_at ?? null,
      }),
    );

    return { data, meta: buildMeta(total, page, limit) };
  }

  async getBatchTrackStats(trackIds: string[]): Promise<{
    playMap: Map<
      string,
      { play_count: number; last_played_at: Date | null }
    >;
    liked: Set<string>;
  }> {
    const playMap = new Map<
      string,
      { play_count: number; last_played_at: Date | null }
    >();
    const liked = new Set<string>();
    if (trackIds.length === 0) return { playMap, liked };

    const counts = await this.dataSource.query<
      {
        track_id: string;
        play_count: string;
        last_played_at: Date | null;
      }[]
    >(
      `SELECT track_id, play_count::int, last_played_at FROM v_track_play_counts WHERE track_id = ANY($1)`,
      [trackIds],
    );
    for (const c of counts) {
      playMap.set(c.track_id, {
        play_count: Number(c.play_count),
        last_played_at: c.last_played_at,
      });
    }

    const likes = await this.likeRepo.find({
      where: { trackId: In(trackIds) },
    });
    for (const l of likes) liked.add(l.trackId);

    return { playMap, liked };
  }

  async findOne(id: string): Promise<TrackJson> {
    const t = await this.trackRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['artist', 'album'],
    });
    if (!t) throw new NotFoundException('Track not found');
    const { playMap, liked } = await this.getBatchTrackStats([id]);
    return this.toJson(t, {
      isLiked: liked.has(id),
      playCount: playMap.get(id)?.play_count ?? 0,
      lastPlayedAt: playMap.get(id)?.last_played_at ?? null,
    });
  }

  async findFilePath(id: string): Promise<{ filePath: string; fileFormat: string | null }> {
    const t = await this.trackRepo.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id', 'filePath', 'fileFormat'],
    });
    if (!t) throw new NotFoundException('Track not found');
    return { filePath: t.filePath, fileFormat: t.fileFormat };
  }

  async findSimilar(id: string, limit = 10): Promise<TrackJson[]> {
    const t = await this.trackRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!t) throw new NotFoundException('Track not found');

    const qb = this.trackRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.artist', 'artist')
      .leftJoinAndSelect('t.album', 'album')
      .where('t.deleted_at IS NULL')
      .andWhere('t.id != :id', { id })
      .andWhere(
        '(t.album_id = :albumId OR t.artist_id = :artistId)',
        { albumId: t.albumId, artistId: t.artistId },
      )
      .orderBy('t.track_number', 'ASC')
      .take(limit);

    const rows = await qb.getMany();
    const ids = rows.map((r) => r.id);
    const { playMap, liked } = await this.getBatchTrackStats(ids);
    return rows.map((tr) =>
      this.toJson(tr, {
        isLiked: liked.has(tr.id),
        playCount: playMap.get(tr.id)?.play_count ?? 0,
        lastPlayedAt: playMap.get(tr.id)?.last_played_at ?? null,
      }),
    );
  }
}

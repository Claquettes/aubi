import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Album } from '../../database/entities/album.entity';
import { Track } from '../../database/entities/track.entity';
import { buildMeta } from '../../common/dto/pagination.dto';
import { AlbumsQueryDto } from './dto/albums-query.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  private async albumStats(albumIds: string[]) {
    const map = new Map<
      string,
      { trackCount: number; durationMs: number; playCount: number }
    >();
    if (albumIds.length === 0) return map;
    const rows = await this.dataSource.query<
      {
        album_id: string;
        track_count: string;
        duration_ms: string;
        play_count: string;
      }[]
    >(
      `
      SELECT t.album_id,
             COUNT(t.id)::int AS track_count,
             COALESCE(SUM(t.duration_ms), 0)::bigint AS duration_ms,
             COALESCE(SUM(COALESCE(v.play_count, 0)), 0)::int AS play_count
      FROM tracks t
      LEFT JOIN v_track_play_counts v ON v.track_id = t.id
      WHERE t.deleted_at IS NULL AND t.album_id = ANY($1)
      GROUP BY t.album_id
    `,
      [albumIds],
    );
    for (const r of rows) {
      map.set(r.album_id, {
        trackCount: Number(r.track_count),
        durationMs: Number(r.duration_ms),
        playCount: Number(r.play_count),
      });
    }
    return map;
  }

  private async likedAlbumIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.dataSource.query<{ album_id: string }[]>(
      `SELECT album_id FROM album_likes WHERE album_id = ANY($1)`,
      [ids],
    );
    return new Set(rows.map((r) => r.album_id));
  }

  async findAll(query: AlbumsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.albumRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.artist', 'artist');
    if (query.artistId) {
      qb.andWhere('a.artist_id = :artistId', { artistId: query.artistId });
    }
    if (query.search?.trim()) {
      qb.andWhere('a.title ILIKE :q', { q: `%${query.search.trim()}%` });
    }
    if (query.isLiked) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM album_likes al WHERE al.album_id = a.id)',
      );
    }
    // Onglet Albums = vrais albums ; les compilations (≥8 artistes) sont
    // présentées comme des collections dans la page Playlists.
    qb.andWhere('a.is_compilation = :comp', {
      comp: query.isCompilation === true,
    });
    const sort =
      query.sort === 'title'
        ? 'a.title'
        : query.sort === 'year'
          ? 'a.year'
          : 'a.createdAt';
    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy(sort, order);
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const stats = await this.albumStats(rows.map((a) => a.id));
    const liked = await this.likedAlbumIds(rows.map((a) => a.id));
    const data = rows.map((a) => {
      const s = stats.get(a.id);
      return {
        id: a.id,
        title: a.title,
        artist: a.artist
          ? { id: a.artist.id, name: a.artist.name }
          : null,
        year: a.year,
        trackCount: s?.trackCount ?? 0,
        durationMs: s?.durationMs ?? 0,
        coverUrl: `/api/v1/covers/${a.id}.jpg`,
        playCount: s?.playCount ?? 0,
        isLiked: liked.has(a.id),
        isCompilation: a.isCompilation,
      };
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const a = await this.albumRepo.findOne({
      where: { id },
      relations: ['artist'],
    });
    if (!a) throw new NotFoundException('Album not found');
    const stats = await this.albumStats([id]);
    const s = stats.get(id);
    const likedSet = await this.likedAlbumIds([id]);
    const tracks = await this.trackRepo.find({
      where: { albumId: id, deletedAt: IsNull() },
      order: { discNumber: 'ASC', trackNumber: 'ASC', title: 'ASC' },
      relations: ['artist', 'album'],
    });
    const ids = tracks.map((t) => t.id);
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);

    return {
      id: a.id,
      title: a.title,
      artist: a.artist
        ? { id: a.artist.id, name: a.artist.name }
        : null,
      year: a.year,
      trackCount: s?.trackCount ?? 0,
      durationMs: s?.durationMs ?? 0,
      coverUrl: `/api/v1/covers/${a.id}.jpg`,
      playCount: s?.playCount ?? 0,
      isLiked: likedSet.has(a.id),
      isCompilation: a.isCompilation,
      tracks: tracks.map((t) =>
        this.mapTrack(t, {
          isLiked: liked.has(t.id),
          playCount: playMap.get(t.id)?.play_count ?? 0,
          lastPlayedAt: playMap.get(t.id)?.last_played_at ?? null,
        }),
      ),
    };
  }

  private mapTrack(
    t: Track,
    extras: {
      isLiked: boolean;
      playCount: number;
      lastPlayedAt: Date | null;
    },
  ) {
    return {
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
      isLiked: extras.isLiked,
      playCount: extras.playCount,
      lastPlayedAt: extras.lastPlayedAt?.toISOString() ?? null,
      coverUrl: this.tracksService.coverUrlForTrack(t),
    };
  }

  async findTracks(albumId: string) {
    const a = await this.albumRepo.findOne({ where: { id: albumId } });
    if (!a) throw new NotFoundException('Album not found');
    const tracks = await this.trackRepo.find({
      where: { albumId, deletedAt: IsNull() },
      order: { discNumber: 'ASC', trackNumber: 'ASC', title: 'ASC' },
      relations: ['artist', 'album'],
    });
    const ids = tracks.map((t) => t.id);
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);
    return {
      data: tracks.map((t) =>
        this.mapTrack(t, {
          isLiked: liked.has(t.id),
          playCount: playMap.get(t.id)?.play_count ?? 0,
          lastPlayedAt: playMap.get(t.id)?.last_played_at ?? null,
        }),
      ),
    };
  }
}

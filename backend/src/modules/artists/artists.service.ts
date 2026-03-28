import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Artist } from '../../database/entities/artist.entity';
import { Album } from '../../database/entities/album.entity';
import { Track } from '../../database/entities/track.entity';
import { buildMeta } from '../../common/dto/pagination.dto';
import { ArtistsQueryDto } from './dto/artists-query.dto';
import { TracksQueryDto } from '../tracks/dto/tracks-query.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  async findAll(query: ArtistsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.artistRepo.createQueryBuilder('ar');
    if (query.search?.trim()) {
      qb.andWhere('ar.name ILIKE :q', { q: `%${query.search.trim()}%` });
    }
    if (query.section) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM tracks t WHERE t.artist_id = ar.id AND t.section = :sec AND t.deleted_at IS NULL)`,
        { sec: query.section },
      );
    }
    const sort =
      query.sort === 'name' ? 'ar.name' : 'ar.created_at';
    const order = query.order === 'desc' ? 'DESC' : 'ASC';
    qb.orderBy(sort, order);
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const ids = rows.map((r) => r.id);
    const counts = await this.artistCounts(ids);
    const data = rows.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      albumCount: counts.get(a.id)?.albumCount ?? 0,
      trackCount: counts.get(a.id)?.trackCount ?? 0,
      coverUrl: counts.get(a.id)?.coverUrl ?? null,
    }));
    return { data, meta: buildMeta(total, page, limit) };
  }

  private async artistCounts(artistIds: string[]) {
    const map = new Map<
      string,
      { albumCount: number; trackCount: number; coverUrl: string | null }
    >();
    if (artistIds.length === 0) return map;
    const albums = await this.dataSource.query<
      { artist_id: string; c: string }[]
    >(
      `SELECT artist_id, COUNT(*)::int AS c FROM albums WHERE artist_id = ANY($1) GROUP BY artist_id`,
      [artistIds],
    );
    const tracks = await this.dataSource.query<
      { artist_id: string; c: string }[]
    >(
      `SELECT artist_id, COUNT(*)::int AS c FROM tracks WHERE deleted_at IS NULL AND artist_id = ANY($1) GROUP BY artist_id`,
      [artistIds],
    );
    const covers = await this.dataSource.query<
      { artist_id: string; album_id: string }[]
    >(
      `SELECT DISTINCT ON (a.artist_id) a.artist_id, a.id AS album_id
       FROM albums a
       JOIN tracks t ON t.album_id = a.id AND t.deleted_at IS NULL
       WHERE a.artist_id = ANY($1) AND a.cover_path IS NOT NULL
       ORDER BY a.artist_id, a.created_at DESC`,
      [artistIds],
    );
    const coverByArtist = new Map(
      covers.map((c) => [
        c.artist_id,
        `/api/v1/covers/${c.album_id}.jpg`,
      ]),
    );
    for (const id of artistIds) {
      map.set(id, {
        albumCount: 0,
        trackCount: 0,
        coverUrl: coverByArtist.get(id) ?? null,
      });
    }
    for (const r of albums) {
      const cur = map.get(r.artist_id);
      if (cur) cur.albumCount = Number(r.c);
    }
    for (const r of tracks) {
      const cur = map.get(r.artist_id);
      if (cur) cur.trackCount = Number(r.c);
    }
    return map;
  }

  async findOne(id: string) {
    const a = await this.artistRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Artist not found');
    const counts = await this.artistCounts([id]);
    const c = counts.get(id);
    const albums = await this.albumRepo.find({
      where: { artistId: id },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      albumCount: c?.albumCount ?? 0,
      trackCount: c?.trackCount ?? 0,
      coverUrl: c?.coverUrl ?? null,
      albums: albums.map((al) => ({
        id: al.id,
        title: al.title,
        year: al.year,
        coverUrl: `/api/v1/covers/${al.id}.jpg`,
      })),
    };
  }

  findAlbums(id: string) {
    return this.albumRepo.find({
      where: { artistId: id },
      order: { title: 'ASC' },
    });
  }

  findTracks(id: string, query: TracksQueryDto) {
    return this.tracksService.findAll({
      ...query,
      artistId: id,
    });
  }
}

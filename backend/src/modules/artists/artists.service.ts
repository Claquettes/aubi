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

  private async likedArtistIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.dataSource.query<{ artist_id: string }[]>(
      `SELECT artist_id FROM artist_likes WHERE artist_id = ANY($1)`,
      [ids],
    );
    return new Set(rows.map((r) => r.artist_id));
  }

  async findAll(query: ArtistsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.artistRepo.createQueryBuilder('ar');
    // Ne montrer que les artistes réellement présents via track_artists :
    // exclut les artistes combinés « A, B » désormais éclatés.
    qb.andWhere(
      `EXISTS (SELECT 1 FROM track_artists ta JOIN tracks t ON t.id = ta.track_id WHERE ta.artist_id = ar.id AND t.deleted_at IS NULL)`,
    );
    if (query.search?.trim()) {
      qb.andWhere('ar.name ILIKE :q', { q: `%${query.search.trim()}%` });
    }
    if (query.section) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM track_artists ta2 JOIN tracks t2 ON t2.id = ta2.track_id WHERE ta2.artist_id = ar.id AND t2.section = :sec AND t2.deleted_at IS NULL)`,
        { sec: query.section },
      );
    }
    if (query.isLiked) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM artist_likes al WHERE al.artist_id = ar.id)',
      );
    }
    // Bornes sur le nombre de titres (grille principale ≥ 2 ; Artistes Divers = 1).
    const trackCountSub = `(SELECT COUNT(DISTINCT t.id) FROM track_artists ta JOIN tracks t ON t.id = ta.track_id WHERE ta.artist_id = ar.id AND t.deleted_at IS NULL)`;
    if (query.minTracks != null) {
      qb.andWhere(`${trackCountSub} >= :minTracks`, {
        minTracks: query.minTracks,
      });
    }
    if (query.maxTracks != null) {
      qb.andWhere(`${trackCountSub} <= :maxTracks`, {
        maxTracks: query.maxTracks,
      });
    }
    const sort =
      query.sort === 'name' ? 'ar.name' : 'ar.createdAt';
    const order = query.order === 'desc' ? 'DESC' : 'ASC';
    qb.orderBy(sort, order);
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const ids = rows.map((r) => r.id);
    const counts = await this.artistCounts(ids);
    const liked = await this.likedArtistIds(ids);
    const data = rows.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      albumCount: counts.get(a.id)?.albumCount ?? 0,
      trackCount: counts.get(a.id)?.trackCount ?? 0,
      coverUrl: counts.get(a.id)?.coverUrl ?? null,
      isLiked: liked.has(a.id),
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
      `SELECT ta.artist_id, COUNT(DISTINCT t.album_id)::int AS c
       FROM track_artists ta JOIN tracks t ON t.id = ta.track_id
       WHERE t.deleted_at IS NULL AND t.album_id IS NOT NULL AND ta.artist_id = ANY($1)
       GROUP BY ta.artist_id`,
      [artistIds],
    );
    const tracks = await this.dataSource.query<
      { artist_id: string; c: string }[]
    >(
      `SELECT ta.artist_id, COUNT(DISTINCT t.id)::int AS c
       FROM track_artists ta JOIN tracks t ON t.id = ta.track_id
       WHERE t.deleted_at IS NULL AND ta.artist_id = ANY($1)
       GROUP BY ta.artist_id`,
      [artistIds],
    );
    const covers = await this.dataSource.query<
      { artist_id: string; album_id: string }[]
    >(
      `SELECT DISTINCT ON (ta.artist_id) ta.artist_id, al.id AS album_id
       FROM track_artists ta
       JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
       JOIN albums al ON al.id = t.album_id AND al.cover_path IS NOT NULL
       WHERE ta.artist_id = ANY($1)
       ORDER BY ta.artist_id, al.created_at DESC`,
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
    const likedSet = await this.likedArtistIds([id]);
    const albums = await this.dataSource.query<
      { id: string; title: string; year: number | null }[]
    >(
      `SELECT DISTINCT al.id, al.title, al.year, al.created_at
       FROM track_artists ta
       JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
       JOIN albums al ON al.id = t.album_id
       WHERE ta.artist_id = $1 AND al.is_compilation = false
       ORDER BY al.created_at DESC
       LIMIT 200`,
      [id],
    );
    // Titres « divers » : les titres de l'artiste rattachés à une compilation
    // (dont « Titres divers »), présentés à part dans une section « Titres ».
    const looseTracks = await this.tracksService.findAll({
      artistId: id,
      isCompilation: true,
      page: 1,
      limit: 300,
    } as TracksQueryDto);
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      albumCount: c?.albumCount ?? 0,
      trackCount: c?.trackCount ?? 0,
      coverUrl: c?.coverUrl ?? null,
      isLiked: likedSet.has(a.id),
      albums: albums.map((al) => ({
        id: al.id,
        title: al.title,
        year: al.year,
        coverUrl: `/api/v1/covers/${al.id}.jpg`,
      })),
      tracks: looseTracks.data,
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

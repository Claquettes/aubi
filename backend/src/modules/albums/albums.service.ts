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
  // Lectures d'un album = somme des écoutes de ses titres (v_track_play_counts
  // ne compte que les écoutes terminées).
  private static readonly PLAY_COUNT_SQL = `(
    SELECT COALESCE(SUM(COALESCE(v.play_count, 0)), 0)
    FROM tracks t
    LEFT JOIN v_track_play_counts v ON v.track_id = t.id
    WHERE t.album_id = a.id AND t.deleted_at IS NULL
  )`;

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
      {
        trackCount: number;
        durationMs: number;
        playCount: number;
        albumPlayCount: number;
        lastPlayedAt: Date | null;
      }
    >();
    if (albumIds.length === 0) return map;
    const rows = await this.dataSource.query<
      {
        album_id: string;
        track_count: string;
        duration_ms: string;
        play_count: string;
        last_played_at: Date | null;
      }[]
    >(
      `
      SELECT t.album_id,
             COUNT(t.id)::int AS track_count,
             COALESCE(SUM(t.duration_ms), 0)::bigint AS duration_ms,
             COALESCE(SUM(COALESCE(v.play_count, 0)), 0)::int AS play_count,
             MAX(v.last_played_at) AS last_played_at
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
        albumPlayCount: 0,
        lastPlayedAt: r.last_played_at,
      });
    }
    // Lancements de l'album (appuis sur son bouton lecture), comptés à part :
    // un album jamais lancé n'apparaît pas dans la requête ci-dessus non plus.
    const launches = await this.dataSource.query<
      { album_id: string; c: string }[]
    >(
      `SELECT album_id, COUNT(*)::int AS c FROM album_plays
       WHERE album_id = ANY($1) GROUP BY album_id`,
      [albumIds],
    );
    for (const r of launches) {
      const cur = map.get(r.album_id);
      if (cur) cur.albumPlayCount = Number(r.c);
      else
        map.set(r.album_id, {
          trackCount: 0,
          durationMs: 0,
          playCount: 0,
          albumPlayCount: Number(r.c),
          lastPlayedAt: null,
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
    // Compté avant l'ORDER BY : le tri « plays » est une sous-requête corrélée,
    // qui n'a rien à faire dans un COUNT.
    const total = await qb.clone().getCount();
    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    if (query.sort === 'plays') {
      qb.orderBy(AlbumsService.PLAY_COUNT_SQL, order);
      qb.addOrderBy('a.title', 'ASC');
    } else {
      const sort =
        query.sort === 'title'
          ? 'a.title'
          : query.sort === 'year'
            ? 'a.year'
            : 'a.createdAt';
      qb.orderBy(sort, order);
    }
    // offset/limit (et non skip/take) : la seule jointure est un ManyToOne, donc
    // pas de duplication de lignes, et on évite la pagination « distinct » de
    // TypeORM qui ne sait pas trier sur une expression brute.
    const rows = await qb
      .offset((page - 1) * limit)
      .limit(limit)
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
        albumPlayCount: s?.albumPlayCount ?? 0,
        lastPlayedAt: s?.lastPlayedAt?.toISOString() ?? null,
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
      albumPlayCount: s?.albumPlayCount ?? 0,
      lastPlayedAt: s?.lastPlayedAt?.toISOString() ?? null,
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

  /**
   * Reclasse des albums en playlists (ou l'inverse). Le scanner range en
   * « collection » tout dossier à ≥ 8 artistes : quand il se trompe, ce choix
   * manuel prend le dessus et est verrouillé contre les prochains scans.
   */
  async setType(ids: string[], isCompilation: boolean) {
    const result = await this.albumRepo
      .createQueryBuilder()
      .update(Album)
      .set({ isCompilation, isCompilationLocked: true })
      .whereInIds(ids)
      .execute();
    const updated = result.affected ?? 0;
    if (updated === 0) throw new NotFoundException('Aucun album trouvé');
    return { updated, isCompilation };
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

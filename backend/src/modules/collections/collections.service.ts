import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TracksService } from '../tracks/tracks.service';
import { TracksQueryDto } from '../tracks/dto/tracks-query.dto';

function encodeId(folder: string) {
  return Buffer.from(folder).toString('base64url');
}
function decodeId(id: string) {
  return Buffer.from(id, 'base64url').toString('utf8');
}
function prettyName(folder: string) {
  const seg = folder.split('/').filter(Boolean).pop() ?? folder;
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

interface FolderRow {
  folder: string;
  track_count: number;
  album_count: number;
  artist_count: number;
  duration_ms: string;
  cover_album: string | null;
}

/**
 * Une "collection" = un dossier disque contenant PLUSIEURS albums distincts
 * (typiquement une playlist téléchargée dont chaque piste est taguée
 * différemment). Regroupe ce fouillis en une entité unique. Dérivé des
 * file_path — aucune table ni re-scan.
 */
@Injectable()
export class CollectionsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tracks: TracksService,
  ) {}

  async findAll() {
    const rows = await this.ds.query<FolderRow[]>(`
      SELECT
        regexp_replace(t.file_path, '/[^/]*$', '') AS folder,
        COUNT(*)::int AS track_count,
        COUNT(DISTINCT t.album_id)::int AS album_count,
        COUNT(DISTINCT t.artist_id)::int AS artist_count,
        COALESCE(SUM(t.duration_ms), 0)::bigint AS duration_ms,
        (array_agg(t.album_id ORDER BY t.track_number NULLS LAST))[1] AS cover_album
      FROM tracks t
      WHERE t.deleted_at IS NULL AND t.section = 'music'
      GROUP BY folder
      HAVING COUNT(DISTINCT t.album_id) > 1
        AND array_length(string_to_array(MIN(t.file_path), '/'), 1) > 3
      ORDER BY COUNT(*) DESC
    `);
    const data = rows.map((r) => ({
      id: encodeId(r.folder),
      name: prettyName(r.folder),
      path: r.folder,
      trackCount: Number(r.track_count),
      albumCount: Number(r.album_count),
      artistCount: Number(r.artist_count),
      durationMs: Number(r.duration_ms),
      coverUrl: r.cover_album ? `/api/v1/covers/${r.cover_album}.jpg` : null,
    }));
    return { data };
  }

  async findOne(id: string) {
    const folder = decodeId(id);
    const meta = await this.ds.query<FolderRow[]>(
      `
      SELECT
        $1::text AS folder,
        COUNT(*)::int AS track_count,
        COUNT(DISTINCT t.album_id)::int AS album_count,
        COUNT(DISTINCT t.artist_id)::int AS artist_count,
        COALESCE(SUM(t.duration_ms), 0)::bigint AS duration_ms,
        (array_agg(t.album_id ORDER BY t.track_number NULLS LAST))[1] AS cover_album
      FROM tracks t
      WHERE t.deleted_at IS NULL
        AND regexp_replace(t.file_path, '/[^/]*$', '') = $1
    `,
      [folder],
    );
    if (!meta.length || Number(meta[0].track_count) === 0) {
      throw new NotFoundException('Collection not found');
    }
    const m = meta[0];
    const tracks = await this.tracks.findAll({
      folder,
      page: 1,
      limit: 1000,
      sort: 'title',
      order: 'asc',
    } as TracksQueryDto);
    return {
      id,
      name: prettyName(folder),
      path: folder,
      trackCount: Number(m.track_count),
      artistCount: Number(m.artist_count),
      durationMs: Number(m.duration_ms),
      coverUrl: m.cover_album ? `/api/v1/covers/${m.cover_album}.jpg` : null,
      tracks: tracks.data,
    };
  }
}

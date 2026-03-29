import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { PlayEvent } from '../../database/entities/play-event.entity';
import { Track } from '../../database/entities/track.entity';
import { PlayEventDto } from './dto/play-event.dto';
import { DailyQueryDto, TopQueryDto } from './dto/stats-query.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PlayEvent)
    private readonly playRepo: Repository<PlayEvent>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  private since(period: string): Date | null {
    const d = new Date();
    if (period === 'week') {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === 'month') {
      d.setDate(d.getDate() - 30);
      return d;
    }
    if (period === 'year') {
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    return null;
  }

  async recordPlay(dto: PlayEventDto) {
    const t = await this.trackRepo.findOne({
      where: { id: dto.trackId, deletedAt: IsNull() },
    });
    if (!t) throw new NotFoundException('Track not found');
    const ev = this.playRepo.create({
      trackId: dto.trackId,
      durationMs: dto.durationMs,
      completed: dto.completed,
      source: dto.source ?? 'library',
      section: t.section,
    });
    await this.playRepo.save(ev);
    return { id: ev.id };
  }

  async overview() {
    const totalTracks = await this.trackRepo.count({
      where: { deletedAt: IsNull() },
    });
    const agg = await this.dataSource.query<
      { c: string; ms: string }[]
    >(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(duration_ms),0)::bigint AS ms FROM play_events`,
    );
    const row = agg[0];
    const sectionRow = await this.dataSource.query<
      { section: string; c: string }[]
    >(
      `SELECT section, COUNT(*)::int AS c FROM play_events GROUP BY section ORDER BY c DESC LIMIT 1`,
    );
    const streaks = await this.computeStreaks();
    return {
      totalTracks,
      totalListenedMs: Number(row?.ms ?? 0),
      totalPlayEvents: Number(row?.c ?? 0),
      mostPlayedSection: sectionRow[0]?.section ?? 'music',
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    };
  }

  private async computeStreaks(): Promise<{
    current: number;
    longest: number;
  }> {
    const days = await this.dataSource.query<{ d: string }[]>(
      `SELECT DISTINCT DATE(played_at) AS d FROM play_events`,
    );
    const set = new Set(days.map((x) => x.d));
    const sorted = [...set].sort();
    let longest = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of sorted) {
      if (!prev) run = 1;
      else {
        const a = new Date(prev + 'T12:00:00Z').getTime();
        const b = new Date(d + 'T12:00:00Z').getTime();
        run = b - a === 86400000 ? run + 1 : 1;
      }
      longest = Math.max(longest, run);
      prev = d;
    }
    let current = 0;
    for (let i = 0; i < 400; i++) {
      const x = new Date();
      x.setUTCDate(x.getUTCDate() - i);
      const key = x.toISOString().slice(0, 10);
      if (set.has(key)) current++;
      else if (i > 0) break;
    }
    return { current, longest };
  }

  async topTracks(query: TopQueryDto) {
    const since = this.since(query.period ?? 'month');
    const lim = Math.min(50, query.limit ?? 10);
    let sql = `
      SELECT pe.track_id AS "trackId",
             COUNT(*)::int AS "playCount",
             SUM(pe.duration_ms)::bigint AS "totalListenedMs"
      FROM play_events pe
    `;
    const params: unknown[] = [];
    let n = 1;
    const parts: string[] = [];
    if (since) {
      parts.push(`pe.played_at >= $${n++}`);
      params.push(since);
    }
    if (query.section) {
      parts.push(`pe.section = $${n++}`);
      params.push(query.section);
    }
    if (parts.length) sql += ` WHERE ${parts.join(' AND ')}`;
    sql += ` GROUP BY pe.track_id ORDER BY COUNT(*) DESC LIMIT ${lim}`;
    const raw = await this.dataSource.query<
      {
        trackId: string;
        playCount: string;
        totalListenedMs: string;
      }[]
    >(sql, params);
    const ids = raw.map((r) => r.trackId);
    const tracks =
      ids.length === 0
        ? []
        : await this.trackRepo.find({
            where: { id: In(ids), deletedAt: IsNull() },
            relations: ['artist', 'album'],
          });
    const tmap = new Map(tracks.map((t) => [t.id, t]));
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);
    const data = raw
      .map((r) => {
        const t = tmap.get(r.trackId);
        if (!t) return null;
        return {
          track: {
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
            isLiked: liked.has(t.id),
            playCount: playMap.get(t.id)?.play_count ?? 0,
            lastPlayedAt:
              playMap.get(t.id)?.last_played_at?.toISOString() ?? null,
            coverUrl: this.tracksService.coverUrlForTrack(t),
          },
          playCount: Number(r.playCount),
          totalListenedMs: Number(r.totalListenedMs),
        };
      })
      .filter(Boolean);
    return { data };
  }

  async topArtists(query: TopQueryDto) {
    const since = this.since(query.period ?? 'month');
    let sql = `
      SELECT t.artist_id AS id, ar.name, COUNT(*)::int AS play_count
      FROM play_events pe
      JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
      JOIN artists ar ON ar.id = t.artist_id
    `;
    const params: unknown[] = [];
    if (since) {
      sql += ` WHERE pe.played_at >= $1`;
      params.push(since);
    }
    sql += ` GROUP BY t.artist_id, ar.name ORDER BY play_count DESC LIMIT ${query.limit ?? 10}`;
    const rows = await this.dataSource.query<
      { id: string; name: string; play_count: string }[]
    >(sql, params);
    return {
      data: rows.map((r) => ({
        artist: { id: r.id, name: r.name },
        playCount: Number(r.play_count),
      })),
    };
  }

  async topAlbums(query: TopQueryDto) {
    const since = this.since(query.period ?? 'month');
    let sql = `
      SELECT t.album_id AS id, al.title, COUNT(*)::int AS play_count
      FROM play_events pe
      JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL AND t.album_id IS NOT NULL
      JOIN albums al ON al.id = t.album_id
    `;
    const params: unknown[] = [];
    if (since) {
      sql += ` WHERE pe.played_at >= $1`;
      params.push(since);
    }
    sql += ` GROUP BY t.album_id, al.title ORDER BY play_count DESC LIMIT ${query.limit ?? 10}`;
    const rows = await this.dataSource.query<
      { id: string; title: string; play_count: string }[]
    >(sql, params);
    return {
      data: rows.map((r) => ({
        album: { id: r.id, title: r.title },
        playCount: Number(r.play_count),
      })),
    };
  }

  async daily(query: DailyQueryDto) {
    let sql = `
      SELECT DATE(pe.played_at) AS day,
             SUM(pe.duration_ms)::bigint AS total_ms,
             COUNT(*)::int AS play_count,
             pe.section
      FROM play_events pe
      WHERE DATE(pe.played_at) BETWEEN $1::date AND $2::date
    `;
    const params: unknown[] = [query.from, query.to];
    if (query.section) {
      sql += ` AND pe.section = $3`;
      params.push(query.section);
    }
    sql += ` GROUP BY DATE(pe.played_at), pe.section ORDER BY day`;
    const rows = await this.dataSource.query<
      {
        day: string;
        total_ms: string;
        play_count: string;
        section: string;
      }[]
    >(sql, params);
    const byDay = new Map<
      string,
      {
        day: string;
        totalMs: number;
        playCount: number;
        bySection: Record<string, { totalMs: number; playCount: number }>;
      }
    >();
    for (const r of rows) {
      let b = byDay.get(r.day);
      if (!b) {
        b = {
          day: r.day,
          totalMs: 0,
          playCount: 0,
          bySection: {},
        };
        byDay.set(r.day, b);
      }
      const ms = Number(r.total_ms);
      const pc = Number(r.play_count);
      b.totalMs += ms;
      b.playCount += pc;
      b.bySection[r.section] = { totalMs: ms, playCount: pc };
    }
    return { data: [...byDay.values()] };
  }

  async heatmap() {
    const from = new Date();
    from.setMonth(from.getMonth() - 12);
    const rows = await this.dataSource.query<
      { d: string; total_ms: string }[]
    >(
      `SELECT DATE(played_at) AS d, SUM(duration_ms)::bigint AS total_ms
       FROM play_events WHERE played_at >= $1
       GROUP BY DATE(played_at)`,
      [from],
    );
    const max = Math.max(...rows.map((r) => Number(r.total_ms)), 1);
    return {
      data: rows.map((r) => {
        const totalMs = Number(r.total_ms);
        const intensity = Math.min(
          4,
          Math.round((totalMs / max) * 4),
        );
        return {
          date: r.d,
          totalMs,
          intensity,
        };
      }),
    };
  }
}

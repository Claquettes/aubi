import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { PlayEvent } from '../../database/entities/play-event.entity';
import { AlbumPlay } from '../../database/entities/album-play.entity';
import { Album } from '../../database/entities/album.entity';
import { Track } from '../../database/entities/track.entity';
import { PlayEventDto } from './dto/play-event.dto';
import { AlbumPlayDto } from './dto/album-play.dto';
import {
  DailyQueryDto,
  MonthlyQueryDto,
  RangeQueryDto,
  RecentQueryDto,
  TopQueryDto,
} from './dto/stats-query.dto';
import { TracksService } from '../tracks/tracks.service';

/**
 * Filtre commun à toutes les requêtes d'écoute. Les trois paramètres sont
 * toujours passés dans le même ordre ($1 début de période, $2 catégorie,
 * $3 fuseau) pour que les SQL restent lisibles et composables.
 */
const RANGE_WHERE = `($1::timestamptz IS NULL OR pe.played_at >= $1)
      AND ($2::text IS NULL OR pe.section = $2)`;

const num = (v: unknown) => Number(v ?? 0);

/**
 * `file_format` vient du conteneur lu par le scanner : « isom/iso2/mp41 »,
 * « mpeg », « wave »… On regroupe ces marques sous le nom que l'utilisateur
 * connaît, sinon la répartition par format est illisible.
 */
function formatLabel(raw: string | null): string {
  const f = (raw ?? '').toLowerCase();
  if (!f) return 'Inconnu';
  if (/flac/.test(f)) return 'FLAC';
  if (/wave|wav/.test(f)) return 'WAV';
  if (/aiff|aifc/.test(f)) return 'AIFF';
  if (/opus/.test(f)) return 'Opus';
  if (/ogg|vorbis/.test(f)) return 'OGG';
  if (/mp4|m4a|isom|iso2|mp41|mp42|aac|dash/.test(f)) return 'AAC / M4A';
  if (/mpeg|mp3|id3/.test(f)) return 'MP3';
  return raw ?? 'Inconnu';
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(PlayEvent)
    private readonly playRepo: Repository<PlayEvent>,
    @InjectRepository(AlbumPlay)
    private readonly albumPlayRepo: Repository<AlbumPlay>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
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

  /**
   * [since, section, tz] — l'ordre attendu par RANGE_WHERE. Postgres refuse un
   * paramètre non référencé : les requêtes qui n'ont pas besoin du fuseau
   * passent `params.slice(0, 2)`.
   */
  private rangeParams(q: {
    period?: string;
    section?: string;
    tz?: string;
  }): [Date | null, string | null, string] {
    return [this.since(q.period ?? 'month'), q.section ?? null, q.tz || 'UTC'];
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

  async recordAlbumPlay(dto: AlbumPlayDto) {
    const a = await this.albumRepo.findOne({ where: { id: dto.albumId } });
    if (!a) throw new NotFoundException('Album not found');
    const ev = this.albumPlayRepo.create({
      albumId: dto.albumId,
      source: dto.source ?? 'album',
    });
    await this.albumPlayRepo.save(ev);
    const [row] = await this.dataSource.query<{ c: string }[]>(
      `SELECT COUNT(*)::int AS c FROM album_plays WHERE album_id = $1`,
      [dto.albumId],
    );
    return { id: ev.id, albumPlayCount: num(row?.c) };
  }

  // ───────────────────────────────── Vue d'ensemble ─────────────────────────

  async overview(query: RangeQueryDto) {
    const params = this.rangeParams(query);

    const [library] = await this.dataSource.query<
      {
        tracks: string;
        ms: string;
        bytes: string;
        albums: string;
        artists: string;
      }[]
    >(
      `SELECT COUNT(*)::int AS tracks,
              COALESCE(SUM(t.duration_ms), 0)::bigint AS ms,
              COALESCE(SUM(t.file_size), 0)::bigint AS bytes,
              (SELECT COUNT(DISTINCT t2.album_id)::int FROM tracks t2
                 WHERE t2.deleted_at IS NULL AND t2.album_id IS NOT NULL) AS albums,
              (SELECT COUNT(DISTINCT ta.artist_id)::int FROM track_artists ta
                 JOIN tracks t3 ON t3.id = ta.track_id AND t3.deleted_at IS NULL) AS artists
       FROM tracks t WHERE t.deleted_at IS NULL`,
    );

    // Pas de jointure track_artists ici : elle dupliquerait les événements des
    // titres à plusieurs artistes et gonflerait durées et compteurs.
    const [plays] = await this.dataSource.query<
      {
        events: string;
        ms: string;
        completed: string;
        tracks: string;
        albums: string;
        days: string;
        first_at: Date | null;
        last_at: Date | null;
      }[]
    >(
      `SELECT COUNT(*)::int AS events,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS ms,
              COUNT(*) FILTER (WHERE pe.completed)::int AS completed,
              COUNT(DISTINCT pe.track_id)::int AS tracks,
              COUNT(DISTINCT t.album_id)::int AS albums,
              COUNT(DISTINCT (pe.played_at AT TIME ZONE $3)::date)::int AS days,
              MIN(pe.played_at) AS first_at,
              MAX(pe.played_at) AS last_at
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE ${RANGE_WHERE}`,
      params,
    );

    const [playedArtists] = await this.dataSource.query<{ c: string }[]>(
      `SELECT COUNT(DISTINCT ta.artist_id)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       JOIN track_artists ta ON ta.track_id = t.id
       WHERE ${RANGE_WHERE}`,
      params.slice(0, 2),
    );

    const [likes] = await this.dataSource.query<
      { tracks: string; albums: string; artists: string }[]
    >(
      `SELECT (SELECT COUNT(*)::int FROM likes l
                 JOIN tracks t ON t.id = l.track_id AND t.deleted_at IS NULL) AS tracks,
              (SELECT COUNT(*)::int FROM album_likes) AS albums,
              (SELECT COUNT(*)::int FROM artist_likes) AS artists`,
    );

    const [albumPlays] = await this.dataSource.query<{ c: string }[]>(
      `SELECT COUNT(*)::int AS c FROM album_plays ap
       WHERE ($1::timestamptz IS NULL OR ap.played_at >= $1)`,
      [params[0]],
    );

    const sections = await this.dataSource.query<
      { section: string; c: string; ms: string }[]
    >(
      // Même périmètre que le total ci-dessus : les titres supprimés sont exclus,
      // sinon la somme du camembert dépasse le total affiché.
      `SELECT pe.section, COUNT(*)::int AS c, COALESCE(SUM(pe.duration_ms), 0)::bigint AS ms
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE ${RANGE_WHERE}
       GROUP BY pe.section ORDER BY c DESC`,
      params.slice(0, 2),
    );

    const streaks = await this.computeStreaks(params[2]);
    const totalEvents = num(plays?.events);
    const listenedMs = num(plays?.ms);
    const activeDays = num(plays?.days);
    const totalTracks = num(library?.tracks);
    const playedTracks = num(plays?.tracks);

    return {
      // Bibliothèque
      totalTracks,
      totalAlbums: num(library?.albums),
      totalArtists: num(library?.artists),
      libraryDurationMs: num(library?.ms),
      librarySizeBytes: num(library?.bytes),
      // Écoute sur la période
      totalListenedMs: listenedMs,
      totalPlayEvents: totalEvents,
      totalAlbumPlays: num(albumPlays?.c),
      completedRate: totalEvents ? num(plays?.completed) / totalEvents : 0,
      distinctTracksPlayed: playedTracks,
      distinctAlbumsPlayed: num(plays?.albums),
      distinctArtistsPlayed: num(playedArtists?.c),
      libraryCoverage: totalTracks ? playedTracks / totalTracks : 0,
      activeDays,
      avgDailyMs: activeDays ? Math.round(listenedMs / activeDays) : 0,
      firstPlayAt: plays?.first_at?.toISOString() ?? null,
      lastPlayAt: plays?.last_at?.toISOString() ?? null,
      // Favoris
      likedTracks: num(likes?.tracks),
      likedAlbums: num(likes?.albums),
      likedArtists: num(likes?.artists),
      // Répartition + séries
      mostPlayedSection: sections[0]?.section ?? 'music',
      bySection: sections.map((s) => ({
        section: s.section,
        playCount: num(s.c),
        totalMs: num(s.ms),
      })),
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
    };
  }

  private async computeStreaks(
    tz: string,
  ): Promise<{ current: number; longest: number }> {
    const days = await this.dataSource.query<{ d: string }[]>(
      `SELECT DISTINCT to_char(pe.played_at AT TIME ZONE $1, 'YYYY-MM-DD') AS d
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL`,
      [tz],
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
    // Le jour en cours ne casse pas la série s'il est encore vide.
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

  // ──────────────────────────────────── Tops ────────────────────────────────

  async topTracks(query: TopQueryDto) {
    const params = this.rangeParams(query);
    const lim = Math.min(50, query.limit ?? 10);
    const raw = await this.dataSource.query<
      {
        trackId: string;
        playCount: string;
        totalListenedMs: string;
        lastPlayedAt: Date | null;
      }[]
    >(
      `SELECT pe.track_id AS "trackId",
              COUNT(*)::int AS "playCount",
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS "totalListenedMs",
              MAX(pe.played_at) AS "lastPlayedAt"
       FROM play_events pe
       WHERE ${RANGE_WHERE}
       GROUP BY pe.track_id
       ORDER BY COUNT(*) DESC, MAX(pe.played_at) DESC
       LIMIT ${lim}`,
      params.slice(0, 2),
    );
    const ids = raw.map((r) => r.trackId);
    const tracks =
      ids.length === 0
        ? []
        : await this.trackRepo.find({
            where: { id: In(ids), deletedAt: IsNull() },
            relations: ['artist', 'album'],
          });
    const tmap = new Map(tracks.map((t) => [t.id, t]));
    const { playMap, liked } = await this.tracksService.getBatchTrackStats(ids);
    const data = raw
      .map((r) => {
        const t = tmap.get(r.trackId);
        if (!t) return null;
        return {
          track: {
            id: t.id,
            title: t.title,
            artist: t.artist ? { id: t.artist.id, name: t.artist.name } : null,
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
          },
          playCount: num(r.playCount),
          totalListenedMs: num(r.totalListenedMs),
          lastPlayedAt: r.lastPlayedAt?.toISOString() ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return { data };
  }

  async topArtists(query: TopQueryDto) {
    const params = this.rangeParams(query);
    const lim = Math.min(50, query.limit ?? 10);
    // Les écoutes passent par track_artists : un featuring compte pour les
    // deux artistes (même règle que la page Artistes).
    const rows = await this.dataSource.query<
      {
        id: string;
        name: string;
        play_count: string;
        total_ms: string;
        distinct_tracks: string;
        last_played_at: Date | null;
      }[]
    >(
      `SELECT ta.artist_id AS id,
              ar.name,
              COUNT(*)::int AS play_count,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS total_ms,
              COUNT(DISTINCT pe.track_id)::int AS distinct_tracks,
              MAX(pe.played_at) AS last_played_at
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       JOIN track_artists ta ON ta.track_id = t.id
       JOIN artists ar ON ar.id = ta.artist_id
       WHERE ${RANGE_WHERE}
       GROUP BY ta.artist_id, ar.name
       ORDER BY play_count DESC, total_ms DESC
       LIMIT ${lim}`,
      params.slice(0, 2),
    );
    const ids = rows.map((r) => r.id);
    const covers = await this.artistCovers(ids);
    const libraryCounts = await this.artistTrackCounts(ids);
    return {
      data: rows.map((r) => ({
        artist: {
          id: r.id,
          name: r.name,
          coverUrl: covers.get(r.id) ?? null,
        },
        playCount: num(r.play_count),
        totalListenedMs: num(r.total_ms),
        distinctTracks: num(r.distinct_tracks),
        libraryTracks: libraryCounts.get(r.id) ?? 0,
        lastPlayedAt: r.last_played_at?.toISOString() ?? null,
      })),
    };
  }

  private async artistCovers(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.dataSource.query<
      { artist_id: string; album_id: string }[]
    >(
      `SELECT DISTINCT ON (ta.artist_id) ta.artist_id, al.id AS album_id
       FROM track_artists ta
       JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
       JOIN albums al ON al.id = t.album_id AND al.cover_path IS NOT NULL
       WHERE ta.artist_id = ANY($1)
       ORDER BY ta.artist_id, al.created_at DESC`,
      [ids],
    );
    return new Map(
      rows.map((r) => [r.artist_id, `/api/v1/covers/${r.album_id}.jpg`]),
    );
  }

  private async artistTrackCounts(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.dataSource.query<
      { artist_id: string; c: string }[]
    >(
      `SELECT ta.artist_id, COUNT(DISTINCT t.id)::int AS c
       FROM track_artists ta
       JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
       WHERE ta.artist_id = ANY($1)
       GROUP BY ta.artist_id`,
      [ids],
    );
    return new Map(rows.map((r) => [r.artist_id, num(r.c)]));
  }

  async topAlbums(query: TopQueryDto) {
    const params = this.rangeParams(query);
    const lim = Math.min(50, query.limit ?? 10);
    const rows = await this.dataSource.query<
      {
        id: string;
        title: string;
        year: number | null;
        artist_id: string | null;
        artist_name: string | null;
        play_count: string;
        total_ms: string;
        distinct_tracks: string;
        track_count: string;
        album_plays: string;
        last_played_at: Date | null;
      }[]
    >(
      `SELECT al.id,
              al.title,
              al.year,
              ar.id AS artist_id,
              ar.name AS artist_name,
              COUNT(*)::int AS play_count,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS total_ms,
              COUNT(DISTINCT pe.track_id)::int AS distinct_tracks,
              (SELECT COUNT(*)::int FROM tracks t2
                 WHERE t2.album_id = al.id AND t2.deleted_at IS NULL) AS track_count,
              (SELECT COUNT(*)::int FROM album_plays ap
                 WHERE ap.album_id = al.id
                   AND ($1::timestamptz IS NULL OR ap.played_at >= $1)) AS album_plays,
              MAX(pe.played_at) AS last_played_at
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL AND t.album_id IS NOT NULL
       JOIN albums al ON al.id = t.album_id
       LEFT JOIN artists ar ON ar.id = al.artist_id
       WHERE ${RANGE_WHERE}
       GROUP BY al.id, al.title, al.year, ar.id, ar.name
       ORDER BY play_count DESC, total_ms DESC
       LIMIT ${lim}`,
      params.slice(0, 2),
    );
    return {
      data: rows.map((r) => {
        const trackCount = num(r.track_count);
        return {
          album: {
            id: r.id,
            title: r.title,
            year: r.year,
            artist:
              r.artist_id && r.artist_name
                ? { id: r.artist_id, name: r.artist_name }
                : null,
            coverUrl: `/api/v1/covers/${r.id}.jpg`,
            trackCount,
          },
          playCount: num(r.play_count),
          totalListenedMs: num(r.total_ms),
          distinctTracks: num(r.distinct_tracks),
          albumPlayCount: num(r.album_plays),
          coverage: trackCount ? num(r.distinct_tracks) / trackCount : 0,
          lastPlayedAt: r.last_played_at?.toISOString() ?? null,
        };
      }),
    };
  }

  // ───────────────────────────────── Séries temporelles ─────────────────────

  async daily(query: DailyQueryDto) {
    const tz = query.tz || 'UTC';
    const to = query.to ?? new Date().toISOString().slice(0, 10);
    const from =
      query.from ??
      new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    const rows = await this.dataSource.query<
      {
        day: string;
        total_ms: string;
        play_count: string;
        section: string;
      }[]
    >(
      `SELECT to_char(pe.played_at AT TIME ZONE $3, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS total_ms,
              COUNT(*)::int AS play_count,
              pe.section
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE (pe.played_at AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
         AND ($4::text IS NULL OR pe.section = $4)
       GROUP BY 1, pe.section
       ORDER BY day`,
      [from, to, tz, query.section ?? null],
    );
    type Day = {
      day: string;
      totalMs: number;
      playCount: number;
      bySection: Record<string, { totalMs: number; playCount: number }>;
    };
    const byDay = new Map<string, Day>();
    for (const r of rows) {
      let b = byDay.get(r.day);
      if (!b) {
        b = { day: r.day, totalMs: 0, playCount: 0, bySection: {} };
        byDay.set(r.day, b);
      }
      const ms = num(r.total_ms);
      const pc = num(r.play_count);
      b.totalMs += ms;
      b.playCount += pc;
      b.bySection[r.section] = { totalMs: ms, playCount: pc };
    }
    // Jours sans écoute inclus : une courbe qui saute les trous ment.
    const out: Day[] = [];
    const cursor = new Date(from + 'T12:00:00Z');
    const end = new Date(to + 'T12:00:00Z');
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      out.push(
        byDay.get(key) ?? {
          day: key,
          totalMs: 0,
          playCount: 0,
          bySection: {},
        },
      );
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { data: out };
  }

  async monthly(query: MonthlyQueryDto) {
    const months = Math.min(60, Math.max(3, query.months ?? 12));
    const tz = query.tz || 'UTC';
    const section = query.section ?? null;
    const rows = await this.dataSource.query<
      {
        m: string;
        play_count: string;
        total_ms: string;
        distinct_tracks: string;
      }[]
    >(
      `SELECT to_char(date_trunc('month', pe.played_at AT TIME ZONE $1), 'YYYY-MM') AS m,
              COUNT(*)::int AS play_count,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS total_ms,
              COUNT(DISTINCT pe.track_id)::int AS distinct_tracks
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE pe.played_at >= (now() - ($2 || ' months')::interval)
         AND ($3::text IS NULL OR pe.section = $3)
       GROUP BY 1`,
      [tz, String(months), section],
    );
    // Requête séparée : jointe à la précédente, track_artists dupliquerait
    // chaque écoute d'un titre à plusieurs artistes.
    const artistsPerMonth = await this.dataSource.query<
      { m: string; c: string }[]
    >(
      `SELECT to_char(date_trunc('month', pe.played_at AT TIME ZONE $1), 'YYYY-MM') AS m,
              COUNT(DISTINCT ta.artist_id)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       JOIN track_artists ta ON ta.track_id = t.id
       WHERE pe.played_at >= (now() - ($2 || ' months')::interval)
         AND ($3::text IS NULL OR pe.section = $3)
       GROUP BY 1`,
      [tz, String(months), section],
    );
    // Découvertes : titres et artistes entendus pour la première fois ce mois-là.
    const discovered = await this.dataSource.query<
      { m: string; tracks: string; artists: string }[]
    >(
      `WITH first_track AS (
         SELECT pe.track_id, MIN(pe.played_at) AS at
         FROM play_events pe
         JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
         WHERE ($3::text IS NULL OR pe.section = $3)
         GROUP BY pe.track_id
       ), first_artist AS (
         SELECT ta.artist_id, MIN(pe.played_at) AS at
         FROM play_events pe
         JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
         JOIN track_artists ta ON ta.track_id = t.id
         WHERE ($3::text IS NULL OR pe.section = $3)
         GROUP BY ta.artist_id
       ), m AS (
         SELECT to_char(date_trunc('month', at AT TIME ZONE $1), 'YYYY-MM') AS m,
                COUNT(*)::int AS tracks, 0 AS artists
         FROM first_track WHERE at >= (now() - ($2 || ' months')::interval) GROUP BY 1
         UNION ALL
         SELECT to_char(date_trunc('month', at AT TIME ZONE $1), 'YYYY-MM') AS m,
                0 AS tracks, COUNT(*)::int AS artists
         FROM first_artist WHERE at >= (now() - ($2 || ' months')::interval) GROUP BY 1
       )
       SELECT m, SUM(tracks)::int AS tracks, SUM(artists)::int AS artists
       FROM m GROUP BY m`,
      [tz, String(months), section],
    );
    // Enrichissement de la bibliothèque : titres ajoutés par le scanner.
    const added = await this.dataSource.query<{ m: string; c: string }[]>(
      `SELECT to_char(date_trunc('month', t.created_at AT TIME ZONE $1), 'YYYY-MM') AS m,
              COUNT(*)::int AS c
       FROM tracks t
       WHERE t.deleted_at IS NULL
         AND t.created_at >= (now() - ($2 || ' months')::interval)
         AND ($3::text IS NULL OR t.section = $3)
       GROUP BY 1`,
      [tz, String(months), section],
    );

    const byMonth = new Map(rows.map((r) => [r.m, r]));
    const artistsBy = new Map(artistsPerMonth.map((r) => [r.m, r.c]));
    const disc = new Map(discovered.map((r) => [r.m, r]));
    const add = new Map(added.map((r) => [r.m, r]));
    const out: {
      month: string;
      playCount: number;
      totalMs: number;
      distinctTracks: number;
      distinctArtists: number;
      newTracks: number;
      newArtists: number;
      addedTracks: number;
    }[] = [];
    const cursor = new Date();
    cursor.setUTCDate(1);
    cursor.setUTCMonth(cursor.getUTCMonth() - (months - 1));
    for (let i = 0; i < months; i++) {
      const key = cursor.toISOString().slice(0, 7);
      const r = byMonth.get(key);
      const d = disc.get(key);
      out.push({
        month: key,
        playCount: num(r?.play_count),
        totalMs: num(r?.total_ms),
        distinctTracks: num(r?.distinct_tracks),
        distinctArtists: num(artistsBy.get(key)),
        newTracks: num(d?.tracks),
        newArtists: num(d?.artists),
        addedTracks: num(add.get(key)?.c),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return { data: out };
  }

  async heatmap(tz = 'UTC') {
    const rows = await this.dataSource.query<
      { d: string; total_ms: string; c: string }[]
    >(
      `SELECT to_char(pe.played_at AT TIME ZONE $1, 'YYYY-MM-DD') AS d,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS total_ms,
              COUNT(*)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE pe.played_at >= now() - interval '12 months'
       GROUP BY 1`,
      [tz],
    );
    // Échelle par quartiles plutôt que linéaire : une journée exceptionnelle
    // ne doit pas écraser toutes les autres dans la même case pâle.
    const values = rows.map((r) => num(r.total_ms)).sort((a, b) => a - b);
    const q = (p: number) =>
      values.length ? values[Math.min(values.length - 1, Math.floor(values.length * p))] : 0;
    const cuts = [q(0.25), q(0.5), q(0.75), q(0.9)];
    return {
      data: rows.map((r) => {
        const totalMs = num(r.total_ms);
        let intensity = 1;
        for (const c of cuts) if (totalMs > c) intensity++;
        return {
          date: r.d,
          totalMs,
          playCount: num(r.c),
          intensity: Math.min(5, intensity),
        };
      }),
    };
  }

  // ───────────────────────────────── Habitudes d'écoute ─────────────────────

  async patterns(query: RangeQueryDto) {
    const params = this.rangeParams(query);
    const rows = await this.dataSource.query<
      { h: number; dow: number; c: string; ms: string }[]
    >(
      `SELECT EXTRACT(HOUR FROM pe.played_at AT TIME ZONE $3)::int AS h,
              EXTRACT(ISODOW FROM pe.played_at AT TIME ZONE $3)::int AS dow,
              COUNT(*)::int AS c,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS ms
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE ${RANGE_WHERE}
       GROUP BY 1, 2`,
      params,
    );
    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      playCount: 0,
      totalMs: 0,
    }));
    const byWeekday = Array.from({ length: 7 }, (_, i) => ({
      weekday: i + 1, // 1 = lundi (ISODOW)
      playCount: 0,
      totalMs: 0,
    }));
    const punchcard: { weekday: number; hour: number; playCount: number }[] = [];
    for (const r of rows) {
      const c = num(r.c);
      const ms = num(r.ms);
      byHour[r.h].playCount += c;
      byHour[r.h].totalMs += ms;
      byWeekday[r.dow - 1].playCount += c;
      byWeekday[r.dow - 1].totalMs += ms;
      punchcard.push({ weekday: r.dow, hour: r.h, playCount: c });
    }
    // Créneaux de la journée, pour la phrase de synthèse.
    const slots = [
      { key: 'night', label: 'Nuit', from: 0, to: 5 },
      { key: 'morning', label: 'Matin', from: 6, to: 11 },
      { key: 'afternoon', label: 'Après-midi', from: 12, to: 17 },
      { key: 'evening', label: 'Soir', from: 18, to: 23 },
    ].map((s) => ({
      key: s.key,
      label: s.label,
      playCount: byHour
        .slice(s.from, s.to + 1)
        .reduce((a, b) => a + b.playCount, 0),
      totalMs: byHour.slice(s.from, s.to + 1).reduce((a, b) => a + b.totalMs, 0),
    }));
    const peak = byHour.reduce((a, b) => (b.playCount > a.playCount ? b : a), byHour[0]);
    return {
      byHour,
      byWeekday,
      punchcard,
      slots,
      peakHour: peak.playCount ? peak.hour : null,
    };
  }

  // ─────────────────────────────────── Records ──────────────────────────────

  async records(query: RangeQueryDto) {
    const params = this.rangeParams(query);

    const [bestDay] = await this.dataSource.query<
      { d: string; ms: string; c: string }[]
    >(
      `SELECT to_char(pe.played_at AT TIME ZONE $3, 'YYYY-MM-DD') AS d,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS ms,
              COUNT(*)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE ${RANGE_WHERE}
       GROUP BY 1 ORDER BY ms DESC LIMIT 1`,
      params,
    );

    const [bestMonth] = await this.dataSource.query<
      { m: string; ms: string; c: string }[]
    >(
      `SELECT to_char(date_trunc('month', pe.played_at AT TIME ZONE $3), 'YYYY-MM') AS m,
              COALESCE(SUM(pe.duration_ms), 0)::bigint AS ms,
              COUNT(*)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       WHERE ${RANGE_WHERE}
       GROUP BY 1 ORDER BY ms DESC LIMIT 1`,
      params,
    );

    // Session = suite d'écoutes espacées de moins de 30 minutes.
    const [session] = await this.dataSource.query<
      { started_at: Date; ended_at: Date; c: string; ms: string }[]
    >(
      `WITH ev AS (
         SELECT pe.played_at, pe.duration_ms,
                LAG(pe.played_at) OVER (ORDER BY pe.played_at) AS prev
         FROM play_events pe
         JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
         WHERE ${RANGE_WHERE}
       ), marked AS (
         SELECT *, CASE WHEN prev IS NULL OR played_at - prev > interval '30 minutes'
                        THEN 1 ELSE 0 END AS is_start
         FROM ev
       ), grouped AS (
         SELECT *, SUM(is_start) OVER (ORDER BY played_at ROWS UNBOUNDED PRECEDING) AS g
         FROM marked
       )
       SELECT MIN(played_at) AS started_at, MAX(played_at) AS ended_at,
              COUNT(*)::int AS c, COALESCE(SUM(duration_ms), 0)::bigint AS ms
       FROM grouped GROUP BY g ORDER BY ms DESC LIMIT 1`,
      params.slice(0, 2),
    );

    // Le titre le plus rejoué dans une même journée.
    const [obsession] = await this.dataSource.query<
      { track_id: string; title: string; name: string | null; d: string; c: string }[]
    >(
      `SELECT pe.track_id, t.title, ar.name,
              to_char(pe.played_at AT TIME ZONE $3, 'YYYY-MM-DD') AS d,
              COUNT(*)::int AS c
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       LEFT JOIN artists ar ON ar.id = t.artist_id
       WHERE ${RANGE_WHERE}
       GROUP BY pe.track_id, t.title, ar.name, 4
       ORDER BY c DESC LIMIT 1`,
      params,
    );

    const [discovery] = await this.dataSource.query<
      { tracks: string; artists: string }[]
    >(
      `WITH ft AS (
         SELECT pe.track_id, MIN(pe.played_at) AS at FROM play_events pe
         JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
         WHERE ($2::text IS NULL OR pe.section = $2) GROUP BY pe.track_id
       ), fa AS (
         SELECT ta.artist_id, MIN(pe.played_at) AS at
         FROM play_events pe
         JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
         JOIN track_artists ta ON ta.track_id = pe.track_id
         WHERE ($2::text IS NULL OR pe.section = $2) GROUP BY ta.artist_id
       )
       SELECT (SELECT COUNT(*)::int FROM ft WHERE $1::timestamptz IS NULL OR at >= $1) AS tracks,
              (SELECT COUNT(*)::int FROM fa WHERE $1::timestamptz IS NULL OR at >= $1) AS artists`,
      [params[0], params[1]],
    );

    return {
      bestDay: bestDay
        ? { date: bestDay.d, totalMs: num(bestDay.ms), playCount: num(bestDay.c) }
        : null,
      bestMonth: bestMonth
        ? {
            month: bestMonth.m,
            totalMs: num(bestMonth.ms),
            playCount: num(bestMonth.c),
          }
        : null,
      longestSession: session
        ? {
            startedAt: session.started_at?.toISOString() ?? null,
            endedAt: session.ended_at?.toISOString() ?? null,
            playCount: num(session.c),
            totalMs: num(session.ms),
          }
        : null,
      obsession: obsession
        ? {
            trackId: obsession.track_id,
            title: obsession.title,
            artistName: obsession.name,
            date: obsession.d,
            playCount: num(obsession.c),
          }
        : null,
      discoveredTracks: num(discovery?.tracks),
      discoveredArtists: num(discovery?.artists),
    };
  }

  async recent(query: RecentQueryDto) {
    const lim = Math.min(50, query.limit ?? 12);
    const rows = await this.dataSource.query<
      { id: string; track_id: string; played_at: Date; completed: boolean }[]
    >(
      `SELECT pe.id, pe.track_id, pe.played_at, pe.completed
       FROM play_events pe
       JOIN tracks t ON t.id = pe.track_id AND t.deleted_at IS NULL
       ORDER BY pe.played_at DESC LIMIT ${lim}`,
    );
    const ids = [...new Set(rows.map((r) => r.track_id))];
    const tracks =
      ids.length === 0
        ? []
        : await this.trackRepo.find({
            where: { id: In(ids), deletedAt: IsNull() },
            relations: ['artist', 'album'],
          });
    const tmap = new Map(tracks.map((t) => [t.id, t]));
    const { playMap, liked } = await this.tracksService.getBatchTrackStats(ids);
    return {
      data: rows
        .map((r) => {
          const t = tmap.get(r.track_id);
          if (!t) return null;
          return {
            playedAt: r.played_at.toISOString(),
            completed: r.completed,
            track: {
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
            },
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    };
  }

  // ────────────────────────────── Bibliothèque ──────────────────────────────

  /** Composition du catalogue — indépendante de ce qui a été écouté. */
  async library() {
    const bySection = await this.dataSource.query<
      { section: string; c: string; ms: string; bytes: string }[]
    >(
      `SELECT section, COUNT(*)::int AS c,
              COALESCE(SUM(duration_ms), 0)::bigint AS ms,
              COALESCE(SUM(file_size), 0)::bigint AS bytes
       FROM tracks WHERE deleted_at IS NULL
       GROUP BY section ORDER BY c DESC`,
    );

    const byFormat = await this.dataSource.query<
      { format: string | null; c: string; ms: string; bytes: string }[]
    >(
      `SELECT file_format AS format,
              COUNT(*)::int AS c,
              COALESCE(SUM(duration_ms), 0)::bigint AS ms,
              COALESCE(SUM(file_size), 0)::bigint AS bytes
       FROM tracks WHERE deleted_at IS NULL
       GROUP BY 1 ORDER BY c DESC`,
    );

    const byGenre = await this.dataSource.query<
      { genre: string; c: string; ms: string }[]
    >(
      `SELECT COALESCE(NULLIF(btrim(genre), ''), 'Sans genre') AS genre,
              COUNT(*)::int AS c,
              COALESCE(SUM(duration_ms), 0)::bigint AS ms
       FROM tracks WHERE deleted_at IS NULL
       GROUP BY 1 ORDER BY c DESC LIMIT 14`,
    );

    const byDecade = await this.dataSource.query<
      { decade: number | null; albums: string; tracks: string }[]
    >(
      `SELECT (al.year / 10) * 10 AS decade,
              COUNT(DISTINCT al.id)::int AS albums,
              COUNT(t.id)::int AS tracks
       FROM albums al
       LEFT JOIN tracks t ON t.album_id = al.id AND t.deleted_at IS NULL
       WHERE al.year IS NOT NULL AND al.year > 1900
       GROUP BY 1 ORDER BY 1`,
    );

    // `bitrate` est stocké en kbps par le scanner.
    const byQuality = await this.dataSource.query<
      { bucket: string; ord: number; c: string }[]
    >(
      `SELECT CASE
                WHEN bitrate IS NULL THEN 'Inconnu'
                WHEN bitrate < 128 THEN '< 128 kbps'
                WHEN bitrate < 256 THEN '128–255 kbps'
                WHEN bitrate < 320 THEN '256–319 kbps'
                WHEN bitrate < 700 THEN '320+ kbps'
                ELSE 'Sans perte'
              END AS bucket,
              CASE
                WHEN bitrate IS NULL THEN 9
                WHEN bitrate < 128 THEN 0
                WHEN bitrate < 256 THEN 1
                WHEN bitrate < 320 THEN 2
                WHEN bitrate < 700 THEN 3
                ELSE 4
              END AS ord,
              COUNT(*)::int AS c
       FROM tracks WHERE deleted_at IS NULL
       GROUP BY 1, 2 ORDER BY 2`,
    );

    const [durations] = await this.dataSource.query<
      { avg_ms: string; median_ms: string; max_ms: string; min_ms: string }[]
    >(
      `SELECT COALESCE(AVG(duration_ms), 0)::bigint AS avg_ms,
              COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms), 0)::bigint AS median_ms,
              COALESCE(MAX(duration_ms), 0)::bigint AS max_ms,
              COALESCE(MIN(duration_ms), 0)::bigint AS min_ms
       FROM tracks WHERE deleted_at IS NULL AND duration_ms > 0`,
    );

    const topByTracks = await this.dataSource.query<
      { id: string; name: string; c: string; albums: string }[]
    >(
      `SELECT ar.id, ar.name,
              COUNT(DISTINCT t.id)::int AS c,
              COUNT(DISTINCT t.album_id)::int AS albums
       FROM track_artists ta
       JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
       JOIN artists ar ON ar.id = ta.artist_id
       GROUP BY ar.id, ar.name
       ORDER BY c DESC LIMIT 10`,
    );
    const covers = await this.artistCovers(topByTracks.map((r) => r.id));

    const [unplayed] = await this.dataSource.query<
      { c: string; albums: string }[]
    >(
      `SELECT (SELECT COUNT(*)::int FROM tracks t
                 WHERE t.deleted_at IS NULL
                   AND NOT EXISTS (SELECT 1 FROM play_events pe WHERE pe.track_id = t.id)) AS c,
              (SELECT COUNT(*)::int FROM albums al
                 WHERE EXISTS (SELECT 1 FROM tracks t2 WHERE t2.album_id = al.id AND t2.deleted_at IS NULL)
                   AND NOT EXISTS (
                     SELECT 1 FROM play_events pe
                     JOIN tracks t3 ON t3.id = pe.track_id
                     WHERE t3.album_id = al.id)) AS albums`,
    );

    const grouped = new Map<
      string,
      { format: string; trackCount: number; totalMs: number; sizeBytes: number }
    >();
    for (const r of byFormat) {
      const key = formatLabel(r.format);
      const cur = grouped.get(key) ?? {
        format: key,
        trackCount: 0,
        totalMs: 0,
        sizeBytes: 0,
      };
      cur.trackCount += num(r.c);
      cur.totalMs += num(r.ms);
      cur.sizeBytes += num(r.bytes);
      grouped.set(key, cur);
    }

    return {
      bySection: bySection.map((r) => ({
        section: r.section,
        trackCount: num(r.c),
        totalMs: num(r.ms),
        sizeBytes: num(r.bytes),
      })),
      byFormat: [...grouped.values()].sort((a, b) => b.trackCount - a.trackCount),
      byGenre: byGenre.map((r) => ({
        genre: r.genre,
        trackCount: num(r.c),
        totalMs: num(r.ms),
      })),
      byDecade: byDecade.map((r) => ({
        decade: Number(r.decade),
        albumCount: num(r.albums),
        trackCount: num(r.tracks),
      })),
      byQuality: byQuality.map((r) => ({
        bucket: r.bucket,
        trackCount: num(r.c),
      })),
      durations: {
        avgMs: num(durations?.avg_ms),
        medianMs: num(durations?.median_ms),
        maxMs: num(durations?.max_ms),
        minMs: num(durations?.min_ms),
      },
      topArtistsByTracks: topByTracks.map((r) => ({
        artist: { id: r.id, name: r.name, coverUrl: covers.get(r.id) ?? null },
        trackCount: num(r.c),
        albumCount: num(r.albums),
      })),
      neverPlayedTracks: num(unplayed?.c),
      neverPlayedAlbums: num(unplayed?.albums),
    };
  }
}

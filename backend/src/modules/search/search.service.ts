import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from '../../database/entities/track.entity';
import { Album } from '../../database/entities/album.entity';
import { Artist } from '../../database/entities/artist.entity';
import { Concert } from '../../database/entities/concert.entity';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>,
    @InjectRepository(Concert)
    private readonly concertRepo: Repository<Concert>,
    @InjectRepository(Audiobook)
    private readonly bookRepo: Repository<Audiobook>,
    private readonly tracksService: TracksService,
  ) {}

  async search(q: string, section?: string) {
    if (!q?.trim()) {
      return {
        tracks: [],
        albums: [],
        artists: [],
        concerts: [],
        audiobooks: [],
      };
    }
    const term = `%${q.trim()}%`;
    const lim = 5;
    const tq = this.trackRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.artist', 'artist')
      .leftJoinAndSelect('t.album', 'album')
      .where('t.deleted_at IS NULL')
      .andWhere('t.title ILIKE :term', { term })
      .take(lim);
    if (section) tq.andWhere('t.section = :sec', { sec: section });
    const trows = await tq.getMany();
    const ids = trows.map((t) => t.id);
    const { playMap, liked } =
      await this.tracksService.getBatchTrackStats(ids);

    // Les entités vidées (fichiers disparus, bibliothèque désactivée) restent
    // en base mais ne doivent pas remonter dans les résultats.
    const albums = await this.albumRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.artist', 'artist')
      .where('a.title ILIKE :term', { term })
      .andWhere(
        `EXISTS (SELECT 1 FROM tracks t WHERE t.album_id = a.id AND t.deleted_at IS NULL)`,
      )
      .take(lim)
      .getMany();

    const artists = await this.artistRepo
      .createQueryBuilder('ar')
      .where('ar.name ILIKE :term', { term })
      .take(lim)
      .getMany();

    const concerts = await this.concertRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.artist', 'artist')
      .where('c.title ILIKE :term OR c.venue ILIKE :term', { term })
      .andWhere(
        `EXISTS (SELECT 1 FROM tracks t WHERE t.concert_id = c.id AND t.deleted_at IS NULL)`,
      )
      .take(lim)
      .getMany();

    const audiobooks = await this.bookRepo
      .createQueryBuilder('b')
      .where('b.title ILIKE :term OR b.author ILIKE :term', { term })
      .andWhere(
        `EXISTS (SELECT 1 FROM audiobook_chapters ac
                   JOIN tracks t ON t.id = ac.track_id AND t.deleted_at IS NULL
                  WHERE ac.audiobook_id = b.id)`,
      )
      .take(lim)
      .getMany();

    return {
      tracks: trows.map((t) => ({
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
      albums: albums.map((a) => ({
        id: a.id,
        title: a.title,
        artist: a.artist
          ? { id: a.artist.id, name: a.artist.name }
          : null,
        year: a.year,
        trackCount: 0,
        durationMs: 0,
        coverUrl: `/api/v1/covers/${a.id}.jpg`,
        playCount: 0,
      })),
      artists: artists.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        albumCount: 0,
        trackCount: 0,
        coverUrl: null as string | null,
      })),
      concerts: concerts.map((c) => ({
        id: c.id,
        title: c.title,
        artist: c.artist
          ? { id: c.artist.id, name: c.artist.name }
          : null,
        venue: c.venue,
        concertDate: c.concertDate,
        trackCount: 0,
        durationMs: 0,
        coverUrl: `/api/v1/covers/${c.id}.jpg`,
        notes: c.notes,
      })),
      audiobooks: audiobooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        isBible: b.isBible,
        chapterCount: 0,
        durationMs: 0,
        coverUrl: `/api/v1/covers/${b.id}.jpg`,
        progressPercent: 0,
      })),
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { AudiobookChapter } from '../../database/entities/audiobook-chapter.entity';
import { AudiobookProgress } from '../../database/entities/audiobook-progress.entity';
import { Track } from '../../database/entities/track.entity';
import { buildMeta } from '../../common/dto/pagination.dto';
import { AudiobooksQueryDto } from './dto/audiobooks-query.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class AudiobooksService {
  constructor(
    @InjectRepository(Audiobook)
    private readonly bookRepo: Repository<Audiobook>,
    @InjectRepository(AudiobookChapter)
    private readonly chapterRepo: Repository<AudiobookChapter>,
    @InjectRepository(AudiobookProgress)
    private readonly progressRepo: Repository<AudiobookProgress>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: AudiobooksQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.bookRepo.createQueryBuilder('b');
    // Livre sans chapitre lisible (fichiers disparus, bibliothèque
    // désactivée) : la ligne reste en base, mais on ne l'affiche plus.
    qb.andWhere(
      `EXISTS (SELECT 1 FROM audiobook_chapters ac
                 JOIN tracks t ON t.id = ac.track_id AND t.deleted_at IS NULL
                WHERE ac.audiobook_id = b.id)`,
    );
    if (query.search?.trim()) {
      qb.andWhere(
        '(b.title ILIKE :q OR b.author ILIKE :q)',
        { q: `%${query.search.trim()}%` },
      );
    }
    if (query.isBible === true) {
      qb.andWhere('b.is_bible = true');
    } else if (query.isBible === false) {
      qb.andWhere('b.is_bible = false');
    }
    qb.orderBy('b.title', 'ASC');
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const ids = rows.map((r) => r.id);
    const meta = await this.bookMeta(ids);
    const data = rows.map((b) => {
      const m = meta.get(b.id);
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        isBible: b.isBible,
        chapterCount: m?.chapterCount ?? 0,
        durationMs: m?.durationMs ?? 0,
        coverUrl: `/api/v1/covers/${b.id}.jpg`,
        progressPercent: m?.progressPercent ?? 0,
      };
    });
    return { data, meta: buildMeta(total, page, limit) };
  }

  private async bookMeta(bookIds: string[]) {
    const map = new Map<
      string,
      {
        chapterCount: number;
        durationMs: number;
        progressPercent: number;
      }
    >();
    if (bookIds.length === 0) return map;
    const ch = await this.dataSource.query<
      { audiobook_id: string; c: string; d: string }[]
    >(
      `
      SELECT ac.audiobook_id, COUNT(*)::int AS c, COALESCE(SUM(t.duration_ms),0)::bigint AS d
      FROM audiobook_chapters ac
      JOIN tracks t ON t.id = ac.track_id AND t.deleted_at IS NULL
      WHERE ac.audiobook_id = ANY($1)
      GROUP BY ac.audiobook_id
    `,
      [bookIds],
    );
    const listened = await this.dataSource.query<
      { audiobook_id: string; listened: string; total: string }[]
    >(
      `
      SELECT ac.audiobook_id,
             COALESCE(SUM(LEAST(ap.position_ms, t.duration_ms)),0)::bigint AS listened,
             COALESCE(SUM(t.duration_ms),0)::bigint AS total
      FROM audiobook_chapters ac
      JOIN tracks t ON t.id = ac.track_id AND t.deleted_at IS NULL
      LEFT JOIN audiobook_progress ap ON ap.track_id = t.id
      WHERE ac.audiobook_id = ANY($1)
      GROUP BY ac.audiobook_id
    `,
      [bookIds],
    );
    const listenMap = new Map(
      listened.map((r) => [
        r.audiobook_id,
        {
          listened: Number(r.listened),
          total: Number(r.total),
        },
      ]),
    );
    for (const id of bookIds) {
      map.set(id, {
        chapterCount: 0,
        durationMs: 0,
        progressPercent: 0,
      });
    }
    for (const r of ch) {
      const cur = map.get(r.audiobook_id);
      if (cur) {
        cur.chapterCount = Number(r.c);
        cur.durationMs = Number(r.d);
      }
    }
    for (const [bid, v] of listenMap) {
      const cur = map.get(bid);
      if (cur && v.total > 0) {
        cur.progressPercent = Math.min(
          100,
          Math.round((v.listened / v.total) * 100),
        );
      }
    }
    return map;
  }

  async findOne(id: string) {
    const b = await this.bookRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Audiobook not found');
    const chapters = await this.chapterRepo.find({
      where: { audiobookId: id },
      order: { chapterNumber: 'ASC' },
      relations: ['track'],
    });
    const trackIds = chapters.map((c) => c.trackId);
    const progress =
      trackIds.length === 0
        ? []
        : await this.progressRepo.find({
            where: { trackId: In(trackIds) },
          });
    const progMap = new Map(progress.map((p) => [p.trackId, p]));
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      isBible: b.isBible,
      chapters: chapters.map((ch) => {
        const t = ch.track;
        const p = progMap.get(ch.trackId);
        const positionMs = p?.positionMs ?? 0;
        const completed =
          t != null && positionMs >= t.durationMs * 0.95;
        return {
          id: ch.id,
          title: ch.title,
          chapterNumber: ch.chapterNumber,
          parentSection: ch.parentSection,
          track: t
            ? { id: t.id, durationMs: t.durationMs }
            : { id: ch.trackId, durationMs: 0 },
          positionMs,
          completed,
        };
      }),
    };
  }

  async bibleBooks() {
    const books = await this.bookRepo.find({
      where: { isBible: true },
      order: { title: 'ASC' },
    });
    const at: typeof books = [];
    const nt: typeof books = [];
    for (const b of books) {
      const sample = await this.chapterRepo.findOne({
        where: { audiobookId: b.id },
        order: { chapterNumber: 'ASC' },
      });
      const sec = sample?.parentSection ?? '';
      if (sec.includes('Nouveau')) nt.push(b);
      else at.push(b);
    }
    return {
      oldTestament: at.map((b) => ({
        id: b.id,
        title: b.title,
        coverUrl: `/api/v1/covers/${b.id}.jpg`,
      })),
      newTestament: nt.map((b) => ({
        id: b.id,
        title: b.title,
        coverUrl: `/api/v1/covers/${b.id}.jpg`,
      })),
    };
  }

  async updateProgress(trackId: string, body: UpdateProgressDto) {
    const t = await this.trackRepo.findOne({ where: { id: trackId } });
    if (!t) throw new NotFoundException('Track not found');
    let row = await this.progressRepo.findOne({ where: { trackId } });
    if (!row) {
      row = this.progressRepo.create({
        trackId,
        positionMs: body.positionMs,
      });
    } else {
      row.positionMs = body.positionMs;
    }
    await this.progressRepo.save(row);
  }
}

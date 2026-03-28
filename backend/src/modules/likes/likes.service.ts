import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../database/entities/like.entity';
import { Track } from '../../database/entities/track.entity';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    private readonly tracksService: TracksService,
  ) {}

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const qb = this.trackRepo
      .createQueryBuilder('t')
      .innerJoin(Like, 'l', 'l.track_id = t.id')
      .leftJoinAndSelect('t.artist', 'artist')
      .leftJoinAndSelect('t.album', 'album')
      .where('t.deleted_at IS NULL')
      .orderBy('l.liked_at', 'DESC');
    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const ids = rows.map((r) => r.id);
    const { playMap } = await this.tracksService.getBatchTrackStats(ids);
    const mapped = rows.map((t) =>
      this.mapLikeTrack(t, {
        isLiked: true,
        playCount: playMap.get(t.id)?.play_count ?? 0,
        lastPlayedAt: playMap.get(t.id)?.last_played_at ?? null,
      }),
    );
    return { data: mapped, meta: buildMeta(total, page, limit) };
  }

  private mapLikeTrack(
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

  async like(trackId: string) {
    const t = await this.trackRepo.findOne({
      where: { id: trackId },
    });
    if (!t || t.deletedAt) throw new NotFoundException('Track not found');
    const existing = await this.likeRepo.findOne({
      where: { trackId },
    });
    if (existing) throw new ConflictException('Already liked');
    await this.likeRepo.save(this.likeRepo.create({ trackId }));
    return { trackId };
  }

  async unlike(trackId: string) {
    const r = await this.likeRepo.findOne({ where: { trackId } });
    if (!r) throw new NotFoundException('Not liked');
    await this.likeRepo.remove(r);
  }
}

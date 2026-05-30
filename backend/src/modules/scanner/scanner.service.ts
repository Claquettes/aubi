import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { readdir } from 'fs/promises';
import { join, relative, sep } from 'path';
import { access, constants } from 'fs/promises';
import chokidar from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import { Artist } from '../../database/entities/artist.entity';
import { Album } from '../../database/entities/album.entity';
import { Track, TrackSection } from '../../database/entities/track.entity';
import { Concert } from '../../database/entities/concert.entity';
import { Audiobook } from '../../database/entities/audiobook.entity';
import { AudiobookChapter } from '../../database/entities/audiobook-chapter.entity';
import { ScannerState } from '../../database/entities/scanner-state.entity';
import { TrackArtist } from '../../database/entities/track-artist.entity';
import { slugify } from '../../common/utils/slugify';
import { MetadataService } from './metadata.service';
import { CoverExtractorService } from './cover-extractor.service';

const AUDIO_EXT = new Set([
  '.mp3',
  '.flac',
  '.ogg',
  '.opus',
  '.m4a',
  '.wav',
  '.aac',
]);

async function* walkDir(dir: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) yield* walkDir(p);
      else yield p;
    }
  } catch {
    /* missing dir */
  }
}

@Injectable()
export class ScannerService implements OnModuleInit {
  private readonly logger = new Logger(ScannerService.name);
  private scanRunning = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Artist)
    private readonly artistRepo: Repository<Artist>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(Concert)
    private readonly concertRepo: Repository<Concert>,
    @InjectRepository(Audiobook)
    private readonly audiobookRepo: Repository<Audiobook>,
    @InjectRepository(AudiobookChapter)
    private readonly chapterRepo: Repository<AudiobookChapter>,
    @InjectRepository(ScannerState)
    private readonly scannerRepo: Repository<ScannerState>,
    @InjectRepository(TrackArtist)
    private readonly trackArtistRepo: Repository<TrackArtist>,
    private readonly metadataService: MetadataService,
    private readonly coverExtractor: CoverExtractorService,
  ) {}

  private get musicPath(): string {
    return this.config.get<string>('musicPath') ?? '/music';
  }

  async onModuleInit(): Promise<void> {
    try {
      await access(this.musicPath, constants.R_OK);
    } catch {
      this.logger.warn(`MUSIC_PATH not readable: ${this.musicPath}`);
      return;
    }
    chokidar
      .watch(this.musicPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
      })
      .on('all', () => this.scheduleDebouncedScan());

    const scanOnStart = this.config.get<boolean>('scanOnStart') ?? true;
    if (!scanOnStart) return;
    const state = await this.getOrCreateState();
    const last = state.lastScanAt?.getTime() ?? 0;
    const hour = 3600_000;
    if (!last || Date.now() - last > hour) {
      void this.startScan();
    }
  }

  private scheduleDebouncedScan(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.startScan();
    }, 5000);
  }

  private async getOrCreateState(): Promise<ScannerState> {
    let s = await this.scannerRepo.findOne({ where: { id: 1 } });
    if (!s) {
      s = this.scannerRepo.create({
        id: 1,
        status: 'idle',
        tracksFound: 0,
        scanProgress: 0,
      });
      await this.scannerRepo.save(s);
    }
    return s;
  }

  async getStatus() {
    const s = await this.getOrCreateState();
    return {
      status: s.status,
      lastScanAt: s.lastScanAt?.toISOString() ?? null,
      tracksFound: s.tracksFound,
      progress: s.scanProgress,
      errorMessage: s.errorMessage,
    };
  }

  async startScan(): Promise<{ status: string; scanId: string }> {
    if (this.scanRunning) {
      const s = await this.getOrCreateState();
      return { status: 'started', scanId: s.currentScanId ?? uuidv4() };
    }
    const scanId = uuidv4();
    void this.runScanJob(scanId);
    return { status: 'started', scanId };
  }

  private async runScanJob(scanId: string): Promise<void> {
    if (this.scanRunning) return;
    this.scanRunning = true;
    const state = await this.getOrCreateState();
    state.status = 'scanning';
    state.errorMessage = null;
    state.scanProgress = 0;
    state.currentScanId = scanId;
    await this.scannerRepo.save(state);

    const seen = new Set<string>();
    try {
      const files: string[] = [];
      for await (const p of walkDir(this.musicPath)) {
        const ext = p.slice(p.lastIndexOf('.')).toLowerCase();
        if (AUDIO_EXT.has(ext)) files.push(p);
      }
      let i = 0;
      for (const filePath of files) {
        await this.indexFile(filePath, seen);
        i++;
        state.scanProgress = files.length
          ? Math.min(99, Math.floor((i / files.length) * 100))
          : 100;
        if (i % 50 === 0) await this.scannerRepo.save(state);
      }
      await this.markMissingDeleted(seen);
      const count = await this.trackRepo.count({
        where: { deletedAt: IsNull() },
      });
      state.status = 'idle';
      state.lastScanAt = new Date();
      state.tracksFound = count;
      state.scanProgress = 100;
      state.currentScanId = null;
      await this.scannerRepo.save(state);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(msg);
      state.status = 'error';
      state.errorMessage = msg;
      state.currentScanId = null;
      await this.scannerRepo.save(state);
    } finally {
      this.scanRunning = false;
    }
  }

  private async markMissingDeleted(seen: Set<string>): Promise<void> {
    if (seen.size === 0) {
      await this.trackRepo
        .createQueryBuilder()
        .update(Track)
        .set({ deletedAt: () => 'now()' })
        .where('deleted_at IS NULL')
        .execute();
      return;
    }
    const paths = [...seen];
    await this.trackRepo
      .createQueryBuilder()
      .update(Track)
      .set({ deletedAt: () => 'now()' })
      .where('deleted_at IS NULL')
      .andWhere('file_path NOT IN (:...paths)', { paths })
      .execute();
  }

  private async indexFile(absPath: string, seen: Set<string>): Promise<void> {
    seen.add(absPath);
    const rel = relative(this.musicPath, absPath);
    const parts = rel.split(sep).filter(Boolean);
    const root = parts[0]?.toLowerCase() ?? '';
    let section: TrackSection = 'music';
    if (root === 'concerts') section = 'concert';
    else if (root === 'audiobooks' || root === 'audiobook')
      section = 'audiobook';

    const pathLower = absPath.toLowerCase();
    const isCoverPath =
      parts.some((p) => p.toLowerCase() === 'covers') ||
      pathLower.includes(`${sep}covers${sep}`);

    let meta;
    try {
      meta = await this.metadataService.parseFilePath(absPath);
    } catch (e) {
      this.logger.warn(`Skip ${absPath}: ${e}`);
      return;
    }
    const isCover = isCoverPath || meta.isCoverHint;

    let artistName = meta.artist;
    let albumTitle = meta.album;
    if (section === 'music' && parts.length >= 3) {
      artistName = parts[1] ?? artistName;
      albumTitle = parts[2] ?? albumTitle;
    }

    const artists = await this.ensureArtists(artistName);
    const artist = artists[0];
    let concert: Concert | null = null;
    let album: Album | null = null;

    if (section === 'concert' && parts.length >= 2) {
      const folderTitle = parts[1];
      concert = await this.ensureConcert(folderTitle, artist);
    } else {
      album = await this.ensureAlbum(albumTitle, artist, isCover);
    }

    let track = await this.trackRepo.findOne({ where: { filePath: absPath } });
    if (!track) {
      track = this.trackRepo.create({ filePath: absPath });
    }
    track.title = meta.title;
    track.artistId = artist.id;
    track.albumId = album?.id ?? null;
    track.concertId = concert?.id ?? null;
    track.trackNumber = meta.trackNumber;
    track.discNumber = meta.discNumber;
    track.durationMs = meta.durationMs;
    track.fileFormat = meta.fileFormat;
    track.fileSize = meta.fileSize?.toString() ?? null;
    track.bitrate = meta.bitrate;
    track.sampleRate = meta.sampleRate;
    track.section = section;
    track.isCover = isCover;
    track.deletedAt = null;
    await this.trackRepo.save(track);
    await this.syncTrackArtists(track.id, artists);

    if (album && meta.embeddedPicture) {
      try {
        const coverPath = await this.coverExtractor.saveAlbumCover(
          album.id,
          meta.embeddedPicture,
        );
        album.coverPath = coverPath;
        await this.albumRepo.save(album);
      } catch {
        /* ignore cover errors */
      }
    } else if (album && !album.coverPath) {
      const dir = absPath.slice(0, absPath.lastIndexOf(sep));
      const saved = await this.coverExtractor.saveFromFolderImage(album.id, dir);
      if (saved) {
        album.coverPath = saved;
        await this.albumRepo.save(album);
      }
    }

    if (section === 'audiobook' && parts.length >= 2) {
      const bookFolder = parts[1];
      await this.ensureAudiobookChapter(bookFolder, track, parts);
    }
  }

  private async ensureArtist(name: string): Promise<Artist> {
    const slug = slugify(name);
    let a = await this.artistRepo.findOne({ where: { slug } });
    if (!a) {
      a = this.artistRepo.create({ name, slug });
      await this.artistRepo.save(a);
    }
    return a;
  }

  /**
   * « A, B & C feat. D » → [A, B, C, D]. Sépare sur les marqueurs de
   * collaboration sûrs (virgule+espace, &, feat/ft/featuring).
   */
  private splitArtistNames(name: string): string[] {
    const parts = name
      .split(/,\s+|\s+&\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+featuring\s+/i)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts : [name.trim() || 'Inconnu'];
  }

  async ensureArtists(name: string): Promise<Artist[]> {
    const out: Artist[] = [];
    const seen = new Set<string>();
    for (const n of this.splitArtistNames(name)) {
      const a = await this.ensureArtist(n);
      if (!seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
    return out;
  }

  async syncTrackArtists(
    trackId: string,
    artists: Artist[],
  ): Promise<void> {
    await this.trackArtistRepo.delete({ trackId });
    const rows = artists.map((a, i) =>
      this.trackArtistRepo.create({ trackId, artistId: a.id, position: i }),
    );
    if (rows.length) await this.trackArtistRepo.save(rows);
  }

  private async ensureAlbum(
    title: string,
    artist: Artist,
    isCoverAlbum: boolean,
  ): Promise<Album> {
    const slug = slugify(title + (isCoverAlbum ? '-cover' : ''));
    let album = await this.albumRepo.findOne({
      where: { artistId: artist.id, slug },
    });
    if (!album) {
      album = this.albumRepo.create({
        title,
        slug,
        artistId: artist.id,
      });
      await this.albumRepo.save(album);
    }
    return album;
  }

  private async ensureConcert(folderTitle: string, artist: Artist): Promise<Concert> {
    let c = await this.concertRepo.findOne({
      where: { title: folderTitle },
    });
    if (!c) {
      c = this.concertRepo.create({
        title: folderTitle,
        artistId: artist.id,
        venue: null,
        concertDate: null,
        notes: null,
      });
      await this.concertRepo.save(c);
    }
    return c;
  }

  private async ensureAudiobookChapter(
    bookFolder: string,
    track: Track,
    parts: string[],
  ): Promise<void> {
    const isBible = parts.some((p) => p.toLowerCase() === 'bible');
    let book = await this.audiobookRepo.findOne({
      where: { title: bookFolder },
    });
    if (!book) {
      book = this.audiobookRepo.create({
        title: bookFolder,
        author: null,
        isBible,
      });
      await this.audiobookRepo.save(book);
    }
    const existing = await this.chapterRepo.count({ where: { trackId: track.id } });
    if (existing > 0) return;
    const chapterNumber =
      track.trackNumber ??
      (await this.chapterRepo.count({ where: { audiobookId: book.id } })) +
        1;
    let parentSection: string | null = null;
    if (isBible && parts.length >= 3) {
      parentSection = parts.includes('Ancien Testament')
        ? 'Ancien Testament'
        : parts.includes('Nouveau Testament')
          ? 'Nouveau Testament'
          : parts[2] ?? null;
    }
    const ch = this.chapterRepo.create({
      audiobookId: book.id,
      title: track.title,
      chapterNumber,
      parentSection,
      trackId: track.id,
    });
    await this.chapterRepo.save(ch);
  }
}

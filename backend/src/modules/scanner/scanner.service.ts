import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { readdir } from 'fs/promises';
import { dirname, join, relative, sep } from 'path';
import { access, constants } from 'fs/promises';
import chokidar, { type FSWatcher } from 'chokidar';
import { v4 as uuidv4 } from 'uuid';
import { Library } from '../../database/entities/library.entity';
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
import { CoverResolverService } from '../covers/cover-resolver.service';

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

/**
 * Compatibilité avec l'ancienne convention « un seul dossier racine découpé en
 * music/ concerts/ audiobooks/ » : dans une bibliothèque musicale, ces trois
 * dossiers de tête gardent leur sens et le segment est retiré du chemin.
 */
const LEGACY_ROOTS: Record<string, TrackSection> = {
  music: 'music',
  concerts: 'concert',
  concert: 'concert',
  audiobooks: 'audiobook',
  audiobook: 'audiobook',
};

@Injectable()
export class ScannerService implements OnModuleInit {
  private readonly logger = new Logger(ScannerService.name);
  private scanRunning = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private watchers: FSWatcher[] = [];

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Library)
    private readonly libraryRepo: Repository<Library>,
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
    private readonly coverResolver: CoverResolverService,
  ) {}

  private enabledLibraries(): Promise<Library[]> {
    return this.libraryRepo.find({
      where: { enabled: true },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.refreshWatchers();

    // Un scan interrompu (redémarrage, crash) laisse l'état à « scanning » :
    // sans ce rattrapage, l'application afficherait une barre de progression
    // figée et refuserait tout nouveau scan.
    const previous = await this.getOrCreateState();
    if (previous.status === 'scanning') {
      previous.status = 'idle';
      previous.currentScanId = null;
      previous.scanProgress = 0;
      await this.scannerRepo.save(previous);
    }

    const scanOnStart = this.config.get<boolean>('scanOnStart') ?? true;
    if (!scanOnStart) return;
    const libraries = await this.enabledLibraries();
    if (libraries.length === 0) return; // première installation : rien à scanner
    const state = await this.getOrCreateState();
    const last = state.lastScanAt?.getTime() ?? 0;
    const hour = 3600_000;
    if (!last || Date.now() - last > hour) {
      void this.startScan();
    }
  }

  /**
   * (Re)pose un observateur par bibliothèque active. Appelé au démarrage et à
   * chaque changement de bibliothèque (ajout, chemin modifié, activation…).
   */
  async refreshWatchers(): Promise<void> {
    await Promise.all(this.watchers.map((w) => w.close()));
    this.watchers = [];
    for (const library of await this.enabledLibraries()) {
      try {
        await access(library.path, constants.R_OK);
      } catch {
        this.logger.warn(
          `Bibliothèque « ${library.name} » illisible : ${library.path}`,
        );
        continue;
      }
      this.watchers.push(
        chokidar
          .watch(library.path, {
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
          })
          .on('all', () => this.scheduleDebouncedScan()),
      );
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

  /** `libraryId` limite le scan à une seule bibliothèque (bouton par carte). */
  async startScan(libraryId?: string): Promise<{ status: string; scanId: string }> {
    if (this.scanRunning) {
      const s = await this.getOrCreateState();
      return { status: 'started', scanId: s.currentScanId ?? uuidv4() };
    }
    const scanId = uuidv4();
    void this.runScanJob(scanId, libraryId);
    return { status: 'started', scanId };
  }

  private async runScanJob(scanId: string, libraryId?: string): Promise<void> {
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
      const all = await this.enabledLibraries();
      const wanted = libraryId ? all.filter((l) => l.id === libraryId) : all;
      // Un disque débranché ou un chemin faux ne doit pas vider la
      // bibliothèque : sans lecture possible, le scan n'a rien constaté et
      // n'a donc pas autorité pour marquer ses pistes disparues.
      const libraries: Library[] = [];
      for (const library of wanted) {
        try {
          await access(library.path, constants.R_OK);
          libraries.push(library);
        } catch {
          this.logger.warn(
            `Bibliothèque « ${library.name} » ignorée (dossier illisible) : ${library.path}`,
          );
        }
      }
      // Un fichier peut appartenir à une seule bibliothèque : les chemins
      // imbriqués sont refusés à la création, l'ordre suffit donc à trancher.
      const files: { path: string; library: Library }[] = [];
      for (const library of libraries) {
        for await (const p of walkDir(library.path)) {
          const ext = p.slice(p.lastIndexOf('.')).toLowerCase();
          if (AUDIO_EXT.has(ext)) files.push({ path: p, library });
        }
      }
      let i = 0;
      for (const file of files) {
        await this.indexFile(file.path, file.library, seen);
        i++;
        state.scanProgress = files.length
          ? Math.min(99, Math.floor((i / files.length) * 100))
          : 100;
        if (i % 50 === 0) await this.scannerRepo.save(state);
      }
      await this.markMissingDeleted(seen, libraries, !libraryId);
      const scannedAt = new Date();
      for (const library of libraries) {
        await this.libraryRepo.update(library.id, { lastScanAt: scannedAt });
      }
      await this.reconcileAlbums();
      // Les pochettes de repli (concert → artiste) ont pu changer.
      this.coverResolver.invalidate();
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

  /**
   * Recale les albums après un scan :
   *  1. artiste de l'album = artiste le plus fréquent de ses pistes (respecte
   *     les éditions manuelles, ex. « soeur ») ;
   *  2. `is_compilation` = dossier à ≥ 8 artistes distincts (→ collection),
   *     sauf si l'album a été classé à la main (`is_compilation_locked`) ;
   *  3. purge des albums orphelins (issus de l'ancienne clé titre×artiste).
   */
  private async reconcileAlbums(): Promise<void> {
    await this.albumRepo.query(`
      UPDATE albums a SET artist_id = s.aid
      FROM (
        SELECT t.album_id, mode() WITHIN GROUP (ORDER BY t.artist_id) AS aid
        FROM tracks t
        WHERE t.deleted_at IS NULL AND t.album_id IS NOT NULL
          AND t.artist_id IS NOT NULL
        GROUP BY t.album_id
      ) s
      WHERE a.id = s.album_id AND a.artist_id IS DISTINCT FROM s.aid
    `);
    await this.albumRepo.query(`
      UPDATE albums a SET is_compilation = (s.cnt >= 8)
      FROM (
        SELECT t.album_id, COUNT(DISTINCT ta.artist_id) AS cnt
        FROM tracks t JOIN track_artists ta ON ta.track_id = t.id
        WHERE t.deleted_at IS NULL AND t.album_id IS NOT NULL
        GROUP BY t.album_id
      ) s
      WHERE a.id = s.album_id AND a.is_compilation IS DISTINCT FROM (s.cnt >= 8)
        AND a.is_compilation_locked = false
    `);
    // Retire les likes pointant un album devenu orphelin, puis purge les albums
    // sans aucune piste vivante (anciens doublons titre×artiste).
    //
    // Une piste d'une bibliothèque désactivée est marquée supprimée sans avoir
    // disparu du disque : elle compte donc comme vivante ici, sinon désactiver
    // une bibliothèque effacerait ses albums (likes, pochettes, éditions) et
    // les réactiver ne les rendrait pas.
    const ALIVE = `(t.deleted_at IS NULL OR EXISTS (
        SELECT 1 FROM libraries l
        WHERE l.id = t.library_id AND l.enabled = false
          AND t.deleted_at = l.hidden_at
      ))`;
    await this.albumRepo.query(`
      DELETE FROM album_likes al WHERE NOT EXISTS (
        SELECT 1 FROM tracks t WHERE t.album_id = al.album_id AND ${ALIVE}
      )
    `);
    await this.albumRepo.query(`
      DELETE FROM albums a WHERE NOT EXISTS (
        SELECT 1 FROM tracks t WHERE t.album_id = a.id AND ${ALIVE}
      )
    `);
  }

  /**
   * Marque supprimées les pistes absentes du disque. Le scan ne fait autorité
   * que sur les bibliothèques qu'il vient de parcourir : celles des autres
   * (désactivées, ou non scannées quand on relance une seule carte) sont
   * laissées telles quelles. Les pistes orphelines (`library_id IS NULL`,
   * bibliothèque supprimée) suivent le scan complet.
   */
  private async markMissingDeleted(
    seen: Set<string>,
    libraries: Library[],
    full = true,
  ): Promise<void> {
    const ids = libraries.map((l) => l.id);
    if (!full && !ids.length) return;
    // Comparaison à un tableau (`= ANY`) plutôt qu'un `NOT IN (...)` : un seul
    // paramètre, quel que soit le nombre de fichiers — Postgres plafonne à
    // 65 535 paramètres par requête.
    const scope = full
      ? 'AND (library_id = ANY($2::uuid[]) OR library_id IS NULL)'
      : 'AND library_id = ANY($2::uuid[])';
    await this.trackRepo.query(
      `UPDATE tracks SET deleted_at = now()
        WHERE deleted_at IS NULL ${scope} AND NOT (file_path = ANY($1::text[]))`,
      [[...seen], ids],
    );
  }

  private async indexFile(
    absPath: string,
    library: Library,
    seen: Set<string>,
  ): Promise<void> {
    seen.add(absPath);
    const rel = relative(library.path, absPath);
    let parts = rel.split(sep).filter(Boolean);
    // La section vient du type de la bibliothèque ; une bibliothèque musicale
    // respecte encore le découpage historique music/ concerts/ audiobooks/.
    let section: TrackSection = library.type;
    const root = parts[0]?.toLowerCase() ?? '';
    if (library.type === 'music' && parts.length > 1 && LEGACY_ROOTS[root]) {
      section = LEGACY_ROOTS[root];
      parts = parts.slice(1);
    }

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

    // Arborescence attendue dans une bibliothèque musicale : Artiste/Album/piste.
    let artistName = meta.artist;
    let albumTitle = meta.album;
    if (section === 'music' && parts.length >= 3) {
      artistName = parts[0] ?? artistName;
      albumTitle = parts[1] ?? albumTitle;
    }

    // Dossier de l'album = répertoire contenant la piste, en absolu : identité
    // stable pour regrouper les pistes d'un dossier, sans collision possible
    // entre deux bibliothèques au même sous-chemin.
    const albumFolder = parts.length > 1 ? dirname(absPath) : null;

    const artists = await this.ensureArtists(artistName);
    const artist = artists[0];
    let concert: Concert | null = null;
    let album: Album | null = null;

    if (section === 'concert' && parts.length >= 2) {
      const folderTitle = parts[0];
      concert = await this.ensureConcert(folderTitle, artist);
    } else {
      album = await this.ensureAlbum(albumTitle, artist, isCover, albumFolder);
    }

    let track = await this.trackRepo.findOne({ where: { filePath: absPath } });
    if (!track) {
      track = this.trackRepo.create({ filePath: absPath });
    }
    // Une édition manuelle (metadataLocked) prime : on ne réécrit pas
    // titre / artiste / album depuis le fichier. Les infos techniques
    // (durée, format, taille…) restent toujours resynchronisées.
    if (!track.metadataLocked) {
      track.title = meta.title;
      track.artistId = artist.id;
      track.concertId = concert?.id ?? null;
    }
    // Le regroupement par album/dossier n'est pas une métadonnée éditée par
    // l'utilisateur : on le resynchronise toujours (même si le titre est verrouillé).
    track.albumId = album?.id ?? null;
    track.trackNumber = meta.trackNumber;
    track.discNumber = meta.discNumber;
    track.durationMs = meta.durationMs;
    track.fileFormat = meta.fileFormat;
    track.fileSize = meta.fileSize?.toString() ?? null;
    track.bitrate = meta.bitrate;
    track.sampleRate = meta.sampleRate;
    track.section = section;
    track.libraryId = library.id;
    track.isCover = isCover;
    track.deletedAt = null;
    await this.trackRepo.save(track);
    if (!track.metadataLocked) {
      await this.syncTrackArtists(track.id, artists);
    }

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
      const bookFolder = parts[0];
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
   * collaboration sûrs : virgule+espace, virgule pleine largeur « ， » ou
   * idéographique « 、 » (exports CJK), &, ＆, feat/ft/featuring.
   */
  private splitArtistNames(name: string): string[] {
    const parts = name
      .split(
        /,\s+|\s*[，、]\s*|\s+&\s+|\s*＆\s*|\s+feat\.?\s+|\s+ft\.?\s+|\s+featuring\s+/i,
      )
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

  async ensureAlbum(
    title: string,
    artist: Artist,
    isCoverAlbum: boolean,
    folderPath: string | null = null,
  ): Promise<Album> {
    const slug = slugify(title + (isCoverAlbum ? '-cover' : ''));
    // Un dossier = un album. Clé stable par dossier : une compilation
    // multi-artistes ne produit plus qu'un seul album. Repli sur (artiste, slug)
    // pour les pistes sans dossier ou les albums créés manuellement.
    // Pistes sans dossier (singles à la racine de /music) : regroupées par
    // titre, indépendamment de l'artiste — tous les « Unknown Album » n'en
    // forment qu'un seul (compilation) au lieu d'un album par artiste.
    let album = folderPath
      ? await this.albumRepo.findOne({ where: { folderPath } })
      : await this.albumRepo.findOne({ where: { slug, folderPath: IsNull() } });
    if (!album) {
      album = this.albumRepo.create({
        title,
        slug,
        artistId: artist.id,
        folderPath,
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
          : parts[1] ?? null;
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

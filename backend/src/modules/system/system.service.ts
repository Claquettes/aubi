import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { DataSource, Repository } from 'typeorm';
import { AppSetting } from '../../database/entities/app-setting.entity';
import { Library } from '../../database/entities/library.entity';
import {
  diskUsage,
  inspectPath,
  isInside,
  normalizePath,
} from '../../common/utils/paths';

const SETUP_KEY = 'setup.completedAt';

const AUDIO_EXT = new Set([
  '.mp3',
  '.flac',
  '.ogg',
  '.opus',
  '.m4a',
  '.wav',
  '.aac',
]);

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly settings: Repository<AppSetting>,
    @InjectRepository(Library)
    private readonly libraries: Repository<Library>,
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly config: ConfigService,
  ) {}

  private mediaRoot(): string {
    return normalizePath(this.config.get<string>('mediaRoot') ?? '/');
  }

  /** État de l'installation : sert de garde au premier lancement. */
  async setupState() {
    const done = await this.settings.findOne({ where: { key: SETUP_KEY } });
    const count = await this.libraries.count();
    const root = this.mediaRoot();
    return {
      completed: done != null && count > 0,
      completedAt: done?.value ?? null,
      libraryCount: count,
      mediaRoot: root,
      mediaRootWritable: (await inspectPath(root)).writable,
    };
  }

  async completeSetup() {
    const count = await this.libraries.count();
    if (count === 0) throw new BadRequestException('setup.noLibrary');
    await this.settings.save(
      this.settings.create({ key: SETUP_KEY, value: new Date().toISOString() }),
    );
    return this.setupState();
  }

  /**
   * Navigateur de dossiers de l'assistant. Cantonné à la racine média et aux
   * bibliothèques déjà déclarées : l'interface ne sert pas à explorer le
   * serveur entier.
   */
  async browse(rawPath?: string) {
    const roots = await this.browseRoots();
    const path = rawPath ? normalizePath(rawPath) : roots[0];
    if (!roots.some((r) => isInside(path, r))) {
      throw new BadRequestException('browse.outsideRoot');
    }
    const state = await inspectPath(path);
    if (!state.exists || !state.isDirectory) {
      throw new BadRequestException('browse.notFound');
    }
    if (!state.readable) throw new BadRequestException('browse.unreadable');

    let entries: { name: string; path: string }[] = [];
    let audioFileCount = 0;
    try {
      for (const e of await readdir(path, { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue;
        if (e.isDirectory()) entries.push({ name: e.name, path: join(path, e.name) });
        else if (AUDIO_EXT.has(e.name.slice(e.name.lastIndexOf('.')).toLowerCase()))
          audioFileCount++;
      }
    } catch {
      throw new BadRequestException('browse.unreadable');
    }
    entries = entries.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );

    const parent = dirname(path);
    return {
      path,
      // Pas de remontée au-dessus des racines autorisées.
      parent:
        parent !== path && roots.some((r) => isInside(parent, r)) ? parent : null,
      roots,
      writable: state.writable,
      audioFileCount,
      entries,
    };
  }

  private async browseRoots(): Promise<string[]> {
    const roots = [this.mediaRoot()];
    for (const l of await this.libraries.find()) {
      if (!roots.some((r) => isInside(l.path, r))) roots.push(l.path);
    }
    return roots;
  }

  /** Place occupée et volume de la bibliothèque, pour la page Paramètres. */
  async storage() {
    const [totals] = await this.ds.query<
      { tracks: number; bytes: string; ms: string; albums: number; artists: number }[]
    >(`
      SELECT COUNT(*)::int AS tracks,
             COALESCE(SUM(t.file_size), 0)::bigint AS bytes,
             COALESCE(SUM(t.duration_ms), 0)::bigint AS ms,
             (SELECT COUNT(DISTINCT t2.album_id)::int FROM tracks t2
               WHERE t2.deleted_at IS NULL AND t2.album_id IS NOT NULL) AS albums,
             (SELECT COUNT(DISTINCT ta.artist_id)::int FROM track_artists ta
               JOIN tracks t3 ON t3.id = ta.track_id AND t3.deleted_at IS NULL) AS artists
      FROM tracks t WHERE t.deleted_at IS NULL
    `);
    const bySection = await this.ds.query<
      { section: string; tracks: number; bytes: string; ms: string }[]
    >(`
      SELECT t.section,
             COUNT(*)::int AS tracks,
             COALESCE(SUM(t.file_size), 0)::bigint AS bytes,
             COALESCE(SUM(t.duration_ms), 0)::bigint AS ms
      FROM tracks t WHERE t.deleted_at IS NULL
      GROUP BY t.section ORDER BY tracks DESC
    `);
    // Masquées = cachées par la désactivation d'une bibliothèque (marque
    // `hidden_at`), pas les pistes dont le fichier a disparu.
    const [hidden] = await this.ds.query<{ tracks: number; bytes: string }[]>(`
      SELECT COUNT(*)::int AS tracks, COALESCE(SUM(t.file_size), 0)::bigint AS bytes
      FROM tracks t JOIN libraries l ON l.id = t.library_id
      WHERE l.enabled = false AND t.deleted_at = l.hidden_at
    `);
    const root = this.mediaRoot();
    return {
      trackCount: Number(totals?.tracks ?? 0),
      sizeBytes: Number(totals?.bytes ?? 0),
      durationMs: Number(totals?.ms ?? 0),
      albumCount: Number(totals?.albums ?? 0),
      artistCount: Number(totals?.artists ?? 0),
      hiddenTrackCount: Number(hidden?.tracks ?? 0),
      hiddenSizeBytes: Number(hidden?.bytes ?? 0),
      bySection: bySection.map((s) => ({
        section: s.section,
        trackCount: Number(s.tracks),
        sizeBytes: Number(s.bytes),
        durationMs: Number(s.ms),
      })),
      mediaRoot: root,
      disk: await diskUsage(root),
    };
  }
}

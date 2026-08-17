import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Library } from '../../database/entities/library.entity';
import {
  diskUsage,
  inspectPath,
  normalizePath,
  overlaps,
} from '../../common/utils/paths';
import { ScannerService } from '../scanner/scanner.service';
import { CreateLibraryDto, UpdateLibraryDto } from './dto/library.dto';

export interface LibraryView {
  id: string;
  name: string;
  type: string;
  path: string;
  enabled: boolean;
  position: number;
  lastScanAt: string | null;
  trackCount: number;
  sizeBytes: number;
  durationMs: number;
  /** État du dossier au moment de la réponse (disque débranché, chemin faux…). */
  available: boolean;
  writable: boolean;
  diskTotalBytes: number | null;
  diskFreeBytes: number | null;
}

interface StatsRow {
  library_id: string;
  tracks: number;
  bytes: string;
  ms: string;
}

@Injectable()
export class LibrariesService {
  private readonly logger = new Logger(LibrariesService.name);

  constructor(
    @InjectRepository(Library)
    private readonly repo: Repository<Library>,
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly scanner: ScannerService,
  ) {}

  async findAll(): Promise<LibraryView[]> {
    const libraries = await this.repo.find({
      order: { position: 'ASC', createdAt: 'ASC' },
    });
    // Les pistes d'une bibliothèque désactivée sont marquées supprimées : on
    // compte celles qui portent la marque de la désactivation, c'est-à-dire ce
    // qui réapparaîtra si on la réactive.
    const rows = await this.ds.query<StatsRow[]>(`
      SELECT l.id AS library_id,
             COUNT(t.id)::int AS tracks,
             COALESCE(SUM(t.file_size), 0)::bigint AS bytes,
             COALESCE(SUM(t.duration_ms), 0)::bigint AS ms
      FROM libraries l
      LEFT JOIN tracks t
        ON t.library_id = l.id
       AND (t.deleted_at IS NULL OR t.deleted_at = l.hidden_at)
      GROUP BY l.id
    `);
    const stats = new Map(rows.map((r) => [r.library_id, r]));
    return Promise.all(
      libraries.map(async (l) => {
        const s = stats.get(l.id);
        const state = await inspectPath(l.path);
        const disk = state.exists ? await diskUsage(l.path) : null;
        return {
          id: l.id,
          name: l.name,
          type: l.type,
          path: l.path,
          enabled: l.enabled,
          position: l.position,
          lastScanAt: l.lastScanAt?.toISOString() ?? null,
          trackCount: Number(s?.tracks ?? 0),
          sizeBytes: Number(s?.bytes ?? 0),
          durationMs: Number(s?.ms ?? 0),
          available: state.exists && state.isDirectory && state.readable,
          writable: state.writable,
          diskTotalBytes: disk?.totalBytes ?? null,
          diskFreeBytes: disk?.freeBytes ?? null,
        };
      }),
    );
  }

  /**
   * Rubriques à afficher dans la navigation. Déduites du contenu réellement
   * indexé, pas du seul type des bibliothèques : une bibliothèque musicale
   * peut suivre le découpage historique (sous-dossiers `concerts/`,
   * `audiobooks/`) et alimenter trois rubriques à elle seule. Les types des
   * bibliothèques actives s'y ajoutent, pour qu'une bibliothèque tout juste
   * déclarée ne reste pas invisible le temps du premier scan.
   */
  async sections(): Promise<string[]> {
    const rows = await this.ds.query<{ section: string }[]>(
      `SELECT DISTINCT section FROM tracks WHERE deleted_at IS NULL`,
    );
    const out = new Set(rows.map((r) => r.section));
    for (const l of await this.repo.find({ where: { enabled: true } })) {
      out.add(l.type);
    }
    return [...out];
  }

  async create(dto: CreateLibraryDto): Promise<LibraryView> {
    const path = await this.validatePath(dto.path);
    const [{ max }] = await this.ds.query<{ max: number | null }[]>(
      `SELECT MAX(position) AS max FROM libraries`,
    );
    const library = this.repo.create({
      name: dto.name.trim(),
      type: dto.type,
      path,
      enabled: dto.enabled ?? true,
      position: (max ?? -1) + 1,
    });
    await this.repo.save(library);
    await this.scanner.refreshWatchers();
    if (library.enabled) void this.scanner.startScan(library.id);
    return this.viewOf(library.id);
  }

  async update(id: string, dto: UpdateLibraryDto): Promise<LibraryView> {
    const library = await this.get(id);
    let rescan = false;

    if (dto.name != null) library.name = dto.name.trim();
    if (dto.type != null && dto.type !== library.type) {
      library.type = dto.type;
      rescan = true;
    }
    if (dto.path != null) {
      const path = await this.validatePath(dto.path, id);
      if (path !== library.path) {
        await this.movePath(library, path);
        library.path = path;
        rescan = true;
      }
    }
    if (dto.enabled != null && dto.enabled !== library.enabled) {
      library.enabled = dto.enabled;
      if (dto.enabled) await this.revealTracks(library);
      else await this.hideTracks(library);
      rescan = dto.enabled;
    }

    await this.repo.save(library);
    await this.scanner.refreshWatchers();
    if (rescan && library.enabled) void this.scanner.startScan(library.id);
    return this.viewOf(library.id);
  }

  async remove(id: string): Promise<void> {
    const library = await this.get(id);
    // Les pistes gardent leur historique d'écoute : on les masque, la clé
    // étrangère les détachera (library_id → NULL).
    await this.hideTracks(library);
    await this.repo.delete(library.id);
    await this.scanner.refreshWatchers();
  }

  async scan(id: string) {
    const library = await this.get(id);
    if (!library.enabled) {
      throw new BadRequestException('library.disabled');
    }
    return this.scanner.startScan(library.id);
  }

  // ─────────────────────────────────────────────────────────────────────────

  private async get(id: string): Promise<Library> {
    const library = await this.repo.findOne({ where: { id } });
    if (!library) throw new NotFoundException('library.notFound');
    return library;
  }

  private async viewOf(id: string): Promise<LibraryView> {
    const all = await this.findAll();
    const found = all.find((l) => l.id === id);
    if (!found) throw new NotFoundException('library.notFound');
    return found;
  }

  /**
   * Le chemin doit exister, être un dossier lisible, et ne chevaucher aucune
   * autre bibliothèque : deux dossiers imbriqués indexeraient deux fois les
   * mêmes fichiers.
   */
  private async validatePath(raw: string, ignoreId?: string): Promise<string> {
    const path = normalizePath(raw);
    if (!path.startsWith('/')) throw new BadRequestException('library.path.absolute');
    const state = await inspectPath(path);
    if (!state.exists) throw new BadRequestException('library.path.notFound');
    if (!state.isDirectory) {
      throw new BadRequestException('library.path.notDirectory');
    }
    if (!state.readable) throw new BadRequestException('library.path.unreadable');

    const others = await this.repo.find();
    for (const other of others) {
      if (other.id === ignoreId) continue;
      if (overlaps(path, other.path)) {
        throw new ConflictException('library.path.conflict');
      }
    }
    return path;
  }

  /**
   * Déplacement du dossier d'une bibliothèque (disque réorganisé, passage de
   * `/music` à un vrai chemin hôte…) : on recolle les chemins déjà en base au
   * lieu de tout réindexer, ce qui conserve likes, statistiques et éditions.
   */
  private async movePath(library: Library, newPath: string): Promise<void> {
    const old = library.path;
    await this.ds.query(
      `UPDATE tracks SET file_path = $1 || substring(file_path from length($2) + 1)
        WHERE library_id = $3 AND left(file_path, length($2)) = $2`,
      [newPath, old, library.id],
    );
    await this.ds.query(
      `UPDATE albums SET folder_path = $1 || substring(folder_path from length($2) + 1)
        WHERE folder_path IS NOT NULL AND left(folder_path, length($2)) = $2`,
      [newPath, old],
    );
    this.logger.log(`Bibliothèque « ${library.name} » : ${old} → ${newPath}`);
  }

  /**
   * Masquer = marquer les pistes supprimées. Toutes les requêtes de l'app
   * filtrent déjà `deleted_at IS NULL` : la bibliothèque disparaît partout
   * (listes, recherche, graphe, statistiques) sans perdre une seule ligne.
   *
   * L'horodatage est retenu sur la bibliothèque : il sert de marque pour ne
   * réafficher, à la réactivation, que les pistes masquées ici — et pas celles
   * dont le fichier avait réellement disparu avant.
   */
  private async hideTracks(library: Library): Promise<void> {
    const at = new Date();
    await this.ds.query(
      `UPDATE tracks SET deleted_at = $2
        WHERE library_id = $1 AND deleted_at IS NULL`,
      [library.id, at],
    );
    library.hiddenAt = at;
  }

  private async revealTracks(library: Library): Promise<void> {
    if (library.hiddenAt) {
      await this.ds.query(
        `UPDATE tracks SET deleted_at = NULL
          WHERE library_id = $1 AND deleted_at = $2`,
        [library.id, library.hiddenAt],
      );
    }
    library.hiddenAt = null;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Pochette de repli quand aucun fichier `covers/<id>.jpg` n'existe.
 *
 * Un concert n'a presque jamais de pochette propre (fichier vidéo ripé, pas de
 * jaquette) : on retombe alors sur l'image de l'artiste, c'est-à-dire — comme
 * sur la page Artistes — la pochette de son album le plus récent.
 */
@Injectable()
export class CoverResolverService {
  /** Repli mémoire : une pochette manquante est demandée par toute la grille. */
  private readonly cache = new Map<string, string | null>();

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** Chemin disque de la pochette de repli, ou `null` s'il n'y en a pas. */
  async resolve(id: string): Promise<string | null> {
    const hit = this.cache.get(id);
    if (hit !== undefined) return hit;
    const path = await this.artistCoverForConcert(id);
    this.cache.set(id, path);
    return path;
  }

  /** À appeler quand une vraie pochette apparaît (scan, édition). */
  invalidate(): void {
    this.cache.clear();
  }

  private async artistCoverForConcert(
    concertId: string,
  ): Promise<string | null> {
    // Artistes du concert : celui rattaché au concert, plus ceux de ses pistes
    // (le premier peut être nul si le tag ARTIST manquait au scan).
    const rows = await this.dataSource.query<{ cover_path: string }[]>(
      `
      WITH concert_artists AS (
        SELECT c.artist_id AS artist_id
        FROM concerts c
        WHERE c.id = $1 AND c.artist_id IS NOT NULL
        UNION
        SELECT ta.artist_id
        FROM tracks t
        JOIN track_artists ta ON ta.track_id = t.id
        WHERE t.concert_id = $1 AND t.deleted_at IS NULL
      )
      SELECT al.cover_path
      FROM concert_artists ca
      JOIN track_artists ta ON ta.artist_id = ca.artist_id
      JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
      JOIN albums al ON al.id = t.album_id AND al.cover_path IS NOT NULL
      ORDER BY al.created_at DESC
      LIMIT 1
    `,
      [concertId],
    );
    return rows[0]?.cover_path ?? null;
  }
}

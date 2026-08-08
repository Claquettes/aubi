import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Verrou de classement album ↔ playlist. Sans lui, `reconcileAlbums` recalcule
 * `is_compilation` à chaque scan (règle « dossier à ≥ 8 artistes ») et écrase
 * le choix fait à la main depuis l'application.
 */
export class AlbumTypeLock1760000600000 implements MigrationInterface {
  name = 'AlbumTypeLock1760000600000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_compilation_locked boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE albums DROP COLUMN IF EXISTS is_compilation_locked`,
    );
  }
}

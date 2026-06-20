import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlbumFolderCompilation1760000400000 implements MigrationInterface {
  name = 'AlbumFolderCompilation1760000400000';

  public async up(q: QueryRunner): Promise<void> {
    // Identité d'un album = son dossier disque (fini les doublons titre×artiste).
    await q.query(`ALTER TABLE albums ADD COLUMN IF NOT EXISTS folder_path text`);
    // Compilation = dossier à beaucoup d'artistes (traité comme "collection").
    await q.query(
      `ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_compilation boolean NOT NULL DEFAULT false`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS idx_albums_folder_path ON albums(folder_path)`,
    );
    // La contrainte unique (artist_id, slug) empêche un dossier unique d'avoir
    // un seul album quand deux dossiers partagent (artiste, titre). On la retire.
    await q.query(`DO $$
      DECLARE r record;
      BEGIN
        FOR r IN
          SELECT conname FROM pg_constraint
          WHERE conrelid = 'albums'::regclass AND contype = 'u'
        LOOP
          EXECUTE 'ALTER TABLE albums DROP CONSTRAINT ' || quote_ident(r.conname);
        END LOOP;
      END $$;`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX IF EXISTS idx_albums_folder_path`);
    await q.query(`ALTER TABLE albums DROP COLUMN IF EXISTS is_compilation`);
    await q.query(`ALTER TABLE albums DROP COLUMN IF EXISTS folder_path`);
  }
}

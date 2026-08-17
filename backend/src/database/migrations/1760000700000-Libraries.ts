import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bibliothèques configurables (façon Jellyfin) : le dossier scanné n'est plus
 * la variable d'environnement MUSIC_PATH mais une liste de dossiers déclarés
 * depuis l'application, activables un à un.
 *
 * Reprise d'une installation existante :
 *  - une bibliothèque « Musique » est créée sur MUSIC_PATH et l'assistant de
 *    première configuration est marqué comme déjà passé ;
 *  - les pistes déjà indexées y sont rattachées ;
 *  - `albums.folder_path` passe de relatif (« music/Artiste/Album ») à absolu,
 *    seule identité stable quand plusieurs bibliothèques coexistent.
 */
export class Libraries1760000700000 implements MigrationInterface {
  name = 'Libraries1760000700000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS libraries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        type varchar(32) NOT NULL,
        path text NOT NULL UNIQUE,
        enabled boolean NOT NULL DEFAULT true,
        hidden_at timestamptz,
        position int NOT NULL DEFAULT 0,
        last_scan_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key text PRIMARY KEY,
        value text,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(
      `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS library_id uuid`,
    );
    await q.query(`
      DO $$ BEGIN
        ALTER TABLE tracks ADD CONSTRAINT fk_tracks_library
          FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await q.query(
      `CREATE INDEX IF NOT EXISTS idx_tracks_library ON tracks(library_id)`,
    );

    // Installation existante : des pistes sont déjà indexées sous MUSIC_PATH.
    const counted = (await q.query(
      `SELECT COUNT(*)::int AS c FROM tracks`,
    )) as { c: string }[];
    if (Number(counted[0]?.c ?? 0) === 0) return;

    const musicPath = (process.env.MUSIC_PATH ?? '/music').replace(/\/+$/, '');
    const inserted = (await q.query(
      `INSERT INTO libraries (name, type, path, position)
       VALUES ($1, 'music', $2, 0)
       ON CONFLICT (path) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Musique', musicPath],
    )) as { id: string }[];
    const lib = inserted[0];
    await q.query(`UPDATE tracks SET library_id = $1 WHERE library_id IS NULL`, [
      lib.id,
    ]);
    await q.query(
      `UPDATE albums SET folder_path = $1 || '/' || folder_path
        WHERE folder_path IS NOT NULL AND folder_path NOT LIKE '/%'`,
      [musicPath],
    );
    await q.query(
      `INSERT INTO app_settings (key, value) VALUES ('setup.completedAt', now()::text)
       ON CONFLICT (key) DO NOTHING`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE tracks DROP COLUMN IF EXISTS library_id`);
    await q.query(`DROP TABLE IF EXISTS libraries`);
    await q.query(`DROP TABLE IF EXISTS app_settings`);
  }
}

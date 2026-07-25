import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlbumPlays1760000500000 implements MigrationInterface {
  name = 'AlbumPlays1760000500000';

  public async up(q: QueryRunner): Promise<void> {
    // « Lancements » d'un album : un appui sur le bouton lecture de la page
    // album. Distinct de play_events, qui compte les titres réellement écoutés.
    await q.query(`
      CREATE TABLE IF NOT EXISTS album_plays (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
        played_at TIMESTAMPTZ DEFAULT now(),
        source TEXT
      );
    `);
    await q.query(
      `CREATE INDEX IF NOT EXISTS idx_album_plays_album ON album_plays(album_id);`,
    );
    await q.query(
      `CREATE INDEX IF NOT EXISTS idx_album_plays_played_at ON album_plays(played_at);`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS album_plays;`);
  }
}

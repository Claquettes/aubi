import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrackArtists1760000100000 implements MigrationInterface {
  name = 'TrackArtists1760000100000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS track_artists (
        track_id uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        artist_id uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
        position int NOT NULL DEFAULT 0,
        PRIMARY KEY (track_id, artist_id)
      )
    `);
    await q.query(
      `CREATE INDEX IF NOT EXISTS idx_track_artists_artist ON track_artists(artist_id)`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS track_artists`);
  }
}

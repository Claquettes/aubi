import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlbumArtistLikes1760000000000 implements MigrationInterface {
  name = 'AlbumArtistLikes1760000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE IF NOT EXISTS album_likes (
        album_id uuid PRIMARY KEY REFERENCES albums(id) ON DELETE CASCADE,
        liked_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`
      CREATE TABLE IF NOT EXISTS artist_likes (
        artist_id uuid PRIMARY KEY REFERENCES artists(id) ON DELETE CASCADE,
        liked_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS artist_likes`);
    await q.query(`DROP TABLE IF EXISTS album_likes`);
  }
}

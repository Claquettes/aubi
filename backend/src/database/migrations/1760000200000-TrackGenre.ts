import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrackGenre1760000200000 implements MigrationInterface {
  name = 'TrackGenre1760000200000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS genre text`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE tracks DROP COLUMN IF EXISTS genre`);
  }
}

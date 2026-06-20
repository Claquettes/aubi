import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrackMetadataLocked1760000300000 implements MigrationInterface {
  name = 'TrackMetadataLocked1760000300000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE tracks ADD COLUMN IF NOT EXISTS metadata_locked boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE tracks DROP COLUMN IF EXISTS metadata_locked`);
  }
}

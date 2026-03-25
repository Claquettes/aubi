import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1738761600000 implements MigrationInterface {
  name = 'InitialSchema1738761600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE artists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE albums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
        year SMALLINT,
        cover_path TEXT,
        total_tracks SMALLINT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(artist_id, slug)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE concerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
        venue TEXT,
        concert_date DATE,
        cover_path TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE tracks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_path TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
        album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
        concert_id UUID REFERENCES concerts(id) ON DELETE SET NULL,
        track_number SMALLINT,
        disc_number SMALLINT DEFAULT 1,
        duration_ms INTEGER NOT NULL,
        file_format TEXT,
        file_size BIGINT,
        bitrate INTEGER,
        sample_rate INTEGER,
        section TEXT NOT NULL CHECK (section IN ('music', 'concert', 'audiobook')),
        is_cover BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_tracks_album ON tracks(album_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tracks_artist ON tracks(artist_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tracks_section ON tracks(section);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_tracks_concert ON tracks(concert_id);`,
    );
    await queryRunner.query(`
      CREATE TABLE audiobooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        author TEXT,
        cover_path TEXT,
        is_bible BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE audiobook_chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        audiobook_id UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        chapter_number SMALLINT NOT NULL,
        parent_section TEXT,
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        UNIQUE(audiobook_id, chapter_number)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        cover_path TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE playlist_tracks (
        playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        position SMALLINT NOT NULL,
        added_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (playlist_id, track_id)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);`,
    );
    await queryRunner.query(`
      CREATE TABLE likes (
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        liked_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (track_id)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE play_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        played_at TIMESTAMPTZ DEFAULT now(),
        duration_ms INTEGER NOT NULL,
        completed BOOLEAN DEFAULT false,
        source TEXT,
        section TEXT NOT NULL
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_play_events_track ON play_events(track_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_play_events_played_at ON play_events(played_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_play_events_section ON play_events(section);`,
    );
    await queryRunner.query(`
      CREATE TABLE audiobook_progress (
        track_id UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
        position_ms INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE TABLE scanner_state (
        id SMALLINT PRIMARY KEY DEFAULT 1,
        last_scan_at TIMESTAMPTZ,
        status TEXT DEFAULT 'idle',
        tracks_found INTEGER DEFAULT 0,
        error_message TEXT,
        scan_progress INTEGER DEFAULT 0,
        current_scan_id UUID
      );
    `);
    await queryRunner.query(
      `INSERT INTO scanner_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`,
    );
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_track_play_counts AS
      SELECT
        track_id,
        COUNT(*) FILTER (WHERE completed = true) AS play_count,
        SUM(duration_ms) AS total_listened_ms,
        MAX(played_at) AS last_played_at
      FROM play_events
      GROUP BY track_id;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE VIEW v_daily_listening AS
      SELECT
        DATE(played_at) AS day,
        section,
        SUM(duration_ms) AS total_ms,
        COUNT(*) AS play_count
      FROM play_events
      GROUP BY DATE(played_at), section;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS v_daily_listening;`);
    await queryRunner.query(`DROP VIEW IF EXISTS v_track_play_counts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS scanner_state;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audiobook_progress;`);
    await queryRunner.query(`DROP TABLE IF EXISTS play_events;`);
    await queryRunner.query(`DROP TABLE IF EXISTS likes;`);
    await queryRunner.query(`DROP TABLE IF EXISTS playlist_tracks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS playlists;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audiobook_chapters;`);
    await queryRunner.query(`DROP TABLE IF EXISTS audiobooks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tracks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS concerts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS albums;`);
    await queryRunner.query(`DROP TABLE IF EXISTS artists;`);
  }
}

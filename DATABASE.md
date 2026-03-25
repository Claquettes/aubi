# DATABASE — aubi

## ORM et migrations

- **TypeORM** avec PostgreSQL
- Migrations versionnées dans `backend/src/database/migrations/`
- `synchronize: false` en production — toujours passer par migrations
- Entités dans `backend/src/database/entities/`

---

## Schéma

### `artists`

```sql
CREATE TABLE artists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,          -- kebab-case du nom
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### `albums`

```sql
CREATE TABLE albums (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  artist_id   UUID REFERENCES artists(id) ON DELETE SET NULL,
  year        SMALLINT,
  cover_path  TEXT,                          -- chemin vers l'image extraite
  total_tracks SMALLINT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, slug)
);
```

### `tracks`

```sql
CREATE TABLE tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path    TEXT NOT NULL UNIQUE,         -- chemin absolu sur le FS
  title        TEXT NOT NULL,
  artist_id    UUID REFERENCES artists(id) ON DELETE SET NULL,
  album_id     UUID REFERENCES albums(id) ON DELETE SET NULL,
  track_number SMALLINT,
  disc_number  SMALLINT DEFAULT 1,
  duration_ms  INTEGER NOT NULL,
  file_format  TEXT,                         -- 'flac', 'mp3', 'ogg', etc.
  file_size    BIGINT,
  bitrate      INTEGER,                      -- en kbps
  sample_rate  INTEGER,
  section      TEXT NOT NULL CHECK (section IN ('music', 'concert', 'audiobook')),
  is_cover     BOOLEAN DEFAULT false,        -- cover d'un autre artiste
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_tracks_artist ON tracks(artist_id);
CREATE INDEX idx_tracks_section ON tracks(section);
```

### `concerts`

Entité spécifique pour les concerts, en complément des tracks.

```sql
CREATE TABLE concerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,               -- ex: "Radiohead – Glastonbury 2017"
  artist_id    UUID REFERENCES artists(id) ON DELETE SET NULL,
  venue        TEXT,                        -- lieu
  concert_date DATE,
  cover_path   TEXT,
  notes        TEXT,                        -- setlist ou infos libres
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Les tracks d'un concert référencent concert_id
ALTER TABLE tracks ADD COLUMN concert_id UUID REFERENCES concerts(id) ON DELETE SET NULL;
CREATE INDEX idx_tracks_concert ON tracks(concert_id);
```

### `audiobooks`

```sql
CREATE TABLE audiobooks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  author       TEXT,
  cover_path   TEXT,
  is_bible     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audiobook_chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audiobook_id  UUID NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  chapter_number SMALLINT NOT NULL,
  parent_section TEXT,                      -- ex: "Ancien Testament", "Nouveau Testament"
  track_id      UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  UNIQUE(audiobook_id, chapter_number)
);
```

### `playlists`

```sql
CREATE TABLE playlists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  cover_path   TEXT,                        -- image custom optionnelle
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE playlist_tracks (
  playlist_id  UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id     UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position     SMALLINT NOT NULL,
  added_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
```

### `likes`

```sql
CREATE TABLE likes (
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  liked_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (track_id)
);
```

### `play_events` — source de vérité des statistiques

Chaque événement de lecture est immuable. Les agrégats se calculent depuis cette table.

```sql
CREATE TABLE play_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id      UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  played_at     TIMESTAMPTZ DEFAULT now(),
  duration_ms   INTEGER NOT NULL,           -- durée réellement écoutée
  completed     BOOLEAN DEFAULT false,      -- true si >80% du titre écouté
  source        TEXT,                       -- 'library', 'playlist:uuid', 'album:uuid', 'search'
  section       TEXT NOT NULL              -- 'music', 'concert', 'audiobook'
);

CREATE INDEX idx_play_events_track ON play_events(track_id);
CREATE INDEX idx_play_events_played_at ON play_events(played_at);
CREATE INDEX idx_play_events_section ON play_events(section);
```

### `audiobook_progress` — mémorisation de position

```sql
CREATE TABLE audiobook_progress (
  track_id      UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
  position_ms   INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### `scanner_state`

```sql
CREATE TABLE scanner_state (
  id            SMALLINT PRIMARY KEY DEFAULT 1,  -- singleton
  last_scan_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'idle',             -- 'idle', 'scanning', 'error'
  tracks_found  INTEGER DEFAULT 0,
  error_message TEXT
);
```

---

## Vues utiles (optionnelles, à créer comme views SQL)

### `v_track_play_counts`
```sql
CREATE VIEW v_track_play_counts AS
SELECT
  track_id,
  COUNT(*) FILTER (WHERE completed = true) AS play_count,
  SUM(duration_ms) AS total_listened_ms,
  MAX(played_at) AS last_played_at
FROM play_events
GROUP BY track_id;
```

### `v_daily_listening`
```sql
CREATE VIEW v_daily_listening AS
SELECT
  DATE(played_at) AS day,
  section,
  SUM(duration_ms) AS total_ms,
  COUNT(*) AS play_count
FROM play_events
GROUP BY DATE(played_at), section;
```

---

## Notes sur la stratégie de scan

Le `ScannerService` suit ces règles pour peupler la base :

1. **Upsert sur `file_path`** : si le fichier existe déjà, on met à jour les métadonnées, on ne duplique pas.
2. **Soft-delete implicite** : si un fichier n'est plus présent sur le FS lors d'un rescan complet, on marque la track `deleted_at = now()` (ajouter colonne nullable). Les play_events sont conservés.
3. **Détection de section** : via le premier segment du chemin relatif (`/music/...` → `music`, `/concerts/...` → `concert`, `/audiobooks/...` → `audiobook`).
4. **Détection is_cover** : si le chemin contient un segment `covers/` ou si le tag ID3 "content_group" contient "cover".
5. **Extraction pochette** : priorité 1 = tag ID3 embedded cover, priorité 2 = fichier `cover.jpg` / `folder.jpg` dans le même dossier. Stockée sous `backend/static/covers/{album_id}.jpg`.

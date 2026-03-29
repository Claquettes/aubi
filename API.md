# API — aubi

## Conventions

- Base URL : `/api/v1`
- Format : JSON
- Pagination : query params `?page=1&limit=50` (default limit 50, max 200)
- Tri : `?sort=title&order=asc`
- Tous les IDs sont des UUID v4
- Timestamps en ISO 8601
- HTTP status standards : 200, 201, 204, 400, 404, 409, 500

### Format de réponse liste

```json
{
  "data": [...],
  "meta": {
    "total": 1234,
    "page": 1,
    "limit": 50,
    "pages": 25
  }
}
```

### Format d'erreur

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Track not found"
}
```

---

## Scanner

### `POST /api/v1/scanner/scan`
Lance un scan (ou rescan) de la bibliothèque. Réponse immédiate, scan en arrière-plan.
```json
Response 202: { "status": "started", "scanId": "uuid" }
```

### `GET /api/v1/scanner/status`
```json
{
  "status": "scanning" | "idle" | "error",
  "lastScanAt": "2024-01-15T10:30:00Z",
  "tracksFound": 3241,
  "progress": 67,        // % si scan en cours
  "errorMessage": null
}
```

---

## Tracks

### `GET /api/v1/tracks`
Query params : `section`, `artistId`, `albumId`, `concertId`, `search`, `isLiked`, `isCover`, `sort`, `order`, `page`, `limit`

```json
{
  "data": [{
    "id": "uuid",
    "title": "Titre",
    "artist": { "id": "uuid", "name": "Artiste" },
    "album": { "id": "uuid", "title": "Album", "year": 2023 },
    "trackNumber": 3,
    "durationMs": 243000,
    "fileFormat": "flac",
    "section": "music",
    "isCover": false,
    "isLiked": true,
    "playCount": 42,
    "lastPlayedAt": "2024-01-10T20:00:00Z",
    "coverUrl": "/api/v1/covers/uuid.jpg"
  }],
  "meta": { ... }
}
```

### `GET /api/v1/tracks/:id`
Détail complet d'un titre.

### `GET /api/v1/tracks/:id/similar`
Titres du même album ou du même artiste (hors le titre courant). Max 10.

---

## Stream

### `GET /api/v1/stream/:trackId`
Streaming audio avec support HTTP Range Requests.

Headers importants :
- `Accept-Ranges: bytes`
- `Content-Type: audio/flac | audio/mpeg | audio/ogg`
- `Content-Length`
- `206 Partial Content` avec `Content-Range: bytes start-end/total`

Pas de body JSON — retourne directement le flux audio binaire.

---

## Albums

### `GET /api/v1/albums`
Query : `artistId`, `search`, `sort`, `order`, `page`, `limit`

```json
{
  "data": [{
    "id": "uuid",
    "title": "Album Title",
    "artist": { "id": "uuid", "name": "Artiste" },
    "year": 2023,
    "trackCount": 12,
    "durationMs": 2940000,
    "coverUrl": "/api/v1/covers/uuid.jpg",
    "playCount": 87
  }]
}
```

### `GET /api/v1/albums/:id`
Détail + liste des tracks de l'album.

### `GET /api/v1/albums/:id/tracks`
Tracks d'un album, triées par `disc_number, track_number`.

---

## Artists

### `GET /api/v1/artists`
Query : `section`, `search`, `sort`, `order`, `page`, `limit`

```json
{
  "data": [{
    "id": "uuid",
    "name": "Artiste",
    "slug": "artiste",
    "albumCount": 5,
    "trackCount": 62,
    "coverUrl": "/api/v1/covers/artist-uuid.jpg"  // premiere pochette trouvée
  }]
}
```

### `GET /api/v1/artists/:id`
Détail + liste des albums.

### `GET /api/v1/artists/:id/albums`
Albums d'un artiste.

### `GET /api/v1/artists/:id/tracks`
Tous les titres d'un artiste (avec pagination).

---

## Concerts

### `GET /api/v1/concerts`
Query : `artistId`, `search`, `sort`, `order`, `page`, `limit`

```json
{
  "data": [{
    "id": "uuid",
    "title": "Radiohead – Glastonbury 2017",
    "artist": { "id": "uuid", "name": "Radiohead" },
    "venue": "Glastonbury Festival, UK",
    "concertDate": "2017-06-23",
    "trackCount": 22,
    "durationMs": 5400000,
    "coverUrl": "/api/v1/covers/uuid.jpg",
    "notes": "Setlist: ..."
  }]
}
```

### `GET /api/v1/concerts/:id`
Détail + tracks du concert dans l'ordre.

---

## Audiobooks

### `GET /api/v1/audiobooks`
Query : `search`, `isBible`, `page`, `limit`

```json
{
  "data": [{
    "id": "uuid",
    "title": "Titre du Livre",
    "author": "Auteur",
    "isBible": false,
    "chapterCount": 24,
    "durationMs": 36000000,
    "coverUrl": "/api/v1/covers/uuid.jpg",
    "progressPercent": 34   // progression de lecture globale
  }]
}
```

### `GET /api/v1/audiobooks/:id`
Détail + liste des chapitres avec leur progression.

```json
{
  "id": "uuid",
  "title": "...",
  "chapters": [{
    "id": "uuid",
    "title": "Chapitre 1",
    "chapterNumber": 1,
    "parentSection": "Ancien Testament",  // pour la Bible
    "track": { "id": "uuid", "durationMs": 900000 },
    "positionMs": 450000,   // position mémorisée
    "completed": false
  }]
}
```

### `GET /api/v1/audiobooks/bible/books`
Structure spécifique Bible : liste des livres avec sections AT/NT.

### `PATCH /api/v1/audiobooks/progress/:trackId`
Sauvegarde la position de lecture.
```json
Body: { "positionMs": 450000 }
Response 204
```

---

## Playlists

### `GET /api/v1/playlists`
```json
{
  "data": [{
    "id": "uuid",
    "name": "Ma Playlist",
    "description": "...",
    "trackCount": 24,
    "durationMs": 5760000,
    "coverUrl": "/api/v1/covers/playlist-uuid.jpg"
  }]
}
```

### `POST /api/v1/playlists`
```json
Body: { "name": "Nouvelle Playlist", "description": "optionnel" }
Response 201: playlist créée
```

### `GET /api/v1/playlists/:id`
Détail + tracks dans l'ordre de position.

### `PATCH /api/v1/playlists/:id`
Mise à jour nom/description.
```json
Body: { "name": "Nouveau Nom" }
```

### `DELETE /api/v1/playlists/:id`
```
Response 204
```

### `POST /api/v1/playlists/:id/tracks`
Ajoute un ou plusieurs tracks à la fin.
```json
Body: { "trackIds": ["uuid1", "uuid2"] }
Response 201: { "added": 2 }
```

### `DELETE /api/v1/playlists/:id/tracks/:trackId`
Retire un track d'une playlist.

### `PATCH /api/v1/playlists/:id/tracks/reorder`
Réordonne les tracks.
```json
Body: { "trackIds": ["uuid3", "uuid1", "uuid2"] }  // ordre souhaité
Response 200
```

---

## Likes

### `GET /api/v1/likes`
Retourne les tracks likés, triés par date de like desc.  
Mêmes données que `GET /api/v1/tracks` mais filtrés.

### `POST /api/v1/likes/:trackId`
Like un titre.
```
Response 201 si ajouté, 409 si déjà liké
```

### `DELETE /api/v1/likes/:trackId`
Unlike.
```
Response 204
```

---

## Stats

### `GET /api/v1/stats/overview`
Vue globale des statistiques.
```json
{
  "totalTracks": 3241,
  "totalListenedMs": 4320000000,
  "totalPlayEvents": 12847,
  "mostPlayedSection": "music",
  "currentStreak": 7,          // jours consécutifs avec écoute
  "longestStreak": 42
}
```

### `GET /api/v1/stats/top-tracks`
Query : `section`, `period` (`week`, `month`, `year`, `all`), `limit` (default 10)
```json
{
  "data": [{
    "track": { "id": "uuid", "title": "...", ... },
    "playCount": 87,
    "totalListenedMs": 21114000
  }]
}
```

### `GET /api/v1/stats/top-artists`
Query : `period`, `limit`

### `GET /api/v1/stats/top-albums`
Query : `period`, `limit`

### `GET /api/v1/stats/daily`
Query : `from` (date ISO), `to` (date ISO), `section`
```json
{
  "data": [{
    "day": "2024-01-15",
    "totalMs": 7200000,
    "playCount": 18,
    "bySection": {
      "music": { "totalMs": 5400000, "playCount": 14 },
      "audiobook": { "totalMs": 1800000, "playCount": 4 }
    }
  }]
}
```

### `GET /api/v1/stats/heatmap`
Données pour la heatmap calendrier type GitHub (12 derniers mois).
```json
{
  "data": [{
    "date": "2024-01-15",
    "totalMs": 7200000,
    "intensity": 3    // 0-4, calculé relativement au max de la période
  }]
}
```

### `POST /api/v1/stats/play`
Enregistre un événement de lecture. Appelé par le frontend.
```json
Body: {
  "trackId": "uuid",
  "durationMs": 180000,     // durée écoutée
  "completed": true,
  "source": "playlist:uuid" | "album:uuid" | "library" | "search"
}
Response 201
```

---

## Covers (assets statiques)

### `GET /api/v1/covers/:filename`
Sert les fichiers image de pochette (jpg/png).  
Servis avec cache long (`Cache-Control: public, max-age=31536000, immutable`).  
404 si non trouvé → le frontend affiche le fallback CoverArt.

---

## Search

### `GET /api/v1/search`
Query : `q` (terme de recherche), `section` (optionnel)
```json
{
  "tracks": [{ ...track }],
  "albums": [{ ...album }],
  "artists": [{ ...artist }],
  "concerts": [{ ...concert }],
  "audiobooks": [{ ...audiobook }]
}
```
Recherche `ILIKE %q%` sur les champs pertinents. Max 5 résultats par catégorie.

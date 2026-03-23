# PROJECT STRUCTURE — aubi

Structure complète du projet, fichier par fichier, avec le rôle de chaque élément.

---

## Racine du projet

```
aubi/
├── frontend/
├── backend/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .gitignore
├── VISION.md
├── ARCHITECTURE.md
├── DESIGN_SYSTEM.md
├── FEATURES.md
├── DATABASE.md
├── API.md
├── DOCKER.md
└── PROJECT_STRUCTURE.md        # ce fichier
```

---

## Frontend (`/frontend`)

```
frontend/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable-512.png
│   └── favicon.ico
│
├── src/
│   │
│   ├── main.tsx                # Entrée React, mount App
│   ├── App.tsx                 # Router principal, layout global
│   │
│   ├── styles/
│   │   ├── tokens.css          # CSS custom properties (design tokens)
│   │   ├── global.css          # Reset, styles globaux, scrollbar
│   │   └── fonts.css           # @font-face declarations
│   │
│   ├── app/
│   │   ├── router.tsx          # Définition des routes React Router v6
│   │   └── layout/
│   │       ├── RootLayout.tsx  # Shell : navigation + player + outlet
│   │       ├── BottomNav.tsx   # Navigation mobile (4 onglets)
│   │       └── Sidebar.tsx     # Navigation desktop
│   │
│   ├── pages/
│   │   ├── music/
│   │   │   ├── MusicHome.tsx   # Accueil section musique (récents, top)
│   │   │   ├── ArtistList.tsx  # Grille de tous les artistes
│   │   │   ├── ArtistPage.tsx  # Page d'un artiste
│   │   │   ├── AlbumList.tsx   # Grille de tous les albums
│   │   │   └── AlbumPage.tsx   # Page d'un album + liste tracks
│   │   ├── concerts/
│   │   │   ├── ConcertList.tsx # Liste des concerts
│   │   │   └── ConcertPage.tsx # Page d'un concert
│   │   ├── audiobooks/
│   │   │   ├── AudiobookList.tsx
│   │   │   ├── AudiobookPage.tsx   # Chapitres avec progression
│   │   │   ├── BibleHome.tsx       # Page d'accueil Bible
│   │   │   └── BibleBookPage.tsx   # Chapitres d'un livre biblique
│   │   ├── playlists/
│   │   │   ├── PlaylistList.tsx
│   │   │   └── PlaylistPage.tsx
│   │   ├── likes/
│   │   │   └── LikesPage.tsx
│   │   ├── stats/
│   │   │   └── StatsPage.tsx   # Dashboard statistiques
│   │   ├── search/
│   │   │   └── SearchPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   │
│   ├── features/
│   │   │
│   │   ├── player/
│   │   │   ├── usePlayerStore.ts       # Zustand store (state + actions)
│   │   │   ├── useAudioEngine.ts       # Hook wrappant Howler.js
│   │   │   ├── MiniPlayer.tsx          # Barre de lecture minimale
│   │   │   ├── FullPlayer.tsx          # Vue plein écran du player
│   │   │   ├── PlayerProgress.tsx      # Barre de progression interactive
│   │   │   ├── PlayerControls.tsx      # Boutons play/pause/next/prev/shuffle/repeat
│   │   │   ├── QueueDrawer.tsx         # File d'attente latérale
│   │   │   └── PlayingIndicator.tsx    # Animation barres sonores (piste active)
│   │   │
│   │   ├── library/
│   │   │   ├── TrackRow.tsx            # Ligne de liste (numéro, titre, durée, like)
│   │   │   ├── AlbumCard.tsx           # Carte album pour les grilles
│   │   │   ├── ArtistCard.tsx          # Carte artiste
│   │   │   ├── ConcertCard.tsx         # Carte concert
│   │   │   ├── BookCard.tsx            # Carte livre audio
│   │   │   ├── SectionHeader.tsx       # En-tête de section avec pochette (page album/concert)
│   │   │   └── TrackContextMenu.tsx    # Menu contextuel (like, add to playlist, etc.)
│   │   │
│   │   ├── playlists/
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── CreatePlaylistModal.tsx
│   │   │   ├── AddToPlaylistModal.tsx
│   │   │   └── PlaylistTrackList.tsx   # Liste réordonnable (drag-and-drop)
│   │   │
│   │   ├── likes/
│   │   │   ├── LikeButton.tsx          # Bouton cœur animé
│   │   │   └── useLikes.ts             # Hook gestion des likes (optimistic update)
│   │   │
│   │   └── stats/
│   │       ├── HeatmapCalendar.tsx     # Heatmap 12 mois
│   │       ├── TopTracksList.tsx       # Top titres avec barres
│   │       ├── ListeningChart.tsx      # Évolution semaine/mois
│   │       ├── SectionDonut.tsx        # Répartition par section
│   │       └── StatsOverview.tsx       # Cartes chiffres clés
│   │
│   ├── components/
│   │   │
│   │   ├── primitives/
│   │   │   ├── Text.tsx                # Composant typographique universel
│   │   │   ├── Icon.tsx                # Wrapper Lucide avec taille/couleur
│   │   │   ├── Button.tsx              # Variants: primary, ghost, icon
│   │   │   ├── Badge.tsx               # Tag inline (Cover, Live, etc.)
│   │   │   ├── Separator.tsx           # Ligne horizontale
│   │   │   └── Spinner.tsx             # Indicateur de chargement minimal
│   │   │
│   │   ├── layout/
│   │   │   ├── Stack.tsx               # Flexbox avec gap typé
│   │   │   ├── Grid.tsx                # CSS Grid responsive
│   │   │   ├── ScrollArea.tsx          # Scroll avec touch natif
│   │   │   └── PageHeader.tsx          # En-tête de page (titre + actions)
│   │   │
│   │   └── media/
│   │       ├── CoverArt.tsx            # Pochette avec fallback initiales
│   │       └── DurationText.tsx        # Formatage durée (mm:ss ou h:mm:ss)
│   │
│   ├── hooks/
│   │   ├── useMediaSession.ts          # Media Session API (notification OS)
│   │   ├── useKeyboardShortcuts.ts     # Raccourcis clavier (espace = play/pause, etc.)
│   │   ├── useScrollDirection.ts       # Détection direction scroll (show/hide nav)
│   │   ├── useInfiniteScroll.ts        # Scroll infini générique
│   │   └── useDebounce.ts             # Debounce pour la recherche
│   │
│   ├── api/
│   │   ├── client.ts                   # fetch wrapper (base URL, error handling)
│   │   ├── tracks.ts                   # Queries TanStack Query pour les tracks
│   │   ├── albums.ts
│   │   ├── artists.ts
│   │   ├── concerts.ts
│   │   ├── audiobooks.ts
│   │   ├── playlists.ts
│   │   ├── likes.ts
│   │   ├── stats.ts
│   │   ├── scanner.ts
│   │   └── search.ts
│   │
│   ├── types/
│   │   └── api.ts                      # Types TypeScript miroirs des réponses API
│   │
│   └── sw/
│       ├── sw.ts                       # Service worker (Workbox)
│       └── registerSW.ts              # Enregistrement du SW
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── nginx.conf
├── Dockerfile
└── package.json
```

---

## Backend (`/backend`)

```
backend/
├── src/
│   │
│   ├── main.ts                         # Bootstrap NestJS, CORS, validation pipe, prefix /api/v1
│   ├── app.module.ts                   # Module racine, imports de tous les modules
│   │
│   ├── config/
│   │   └── configuration.ts            # Variables d'env typées (ConfigService)
│   │
│   ├── database/
│   │   ├── database.module.ts          # TypeORM configuration
│   │   ├── entities/
│   │   │   ├── artist.entity.ts
│   │   │   ├── album.entity.ts
│   │   │   ├── track.entity.ts
│   │   │   ├── concert.entity.ts
│   │   │   ├── audiobook.entity.ts
│   │   │   ├── audiobook-chapter.entity.ts
│   │   │   ├── playlist.entity.ts
│   │   │   ├── playlist-track.entity.ts
│   │   │   ├── like.entity.ts
│   │   │   ├── play-event.entity.ts
│   │   │   ├── audiobook-progress.entity.ts
│   │   │   └── scanner-state.entity.ts
│   │   └── migrations/
│   │       └── YYYYMMDDHHMMSS-InitialSchema.ts
│   │
│   ├── common/
│   │   ├── dto/
│   │   │   └── pagination.dto.ts       # PaginationDto générique
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts # Wrap réponses en { data, meta }
│   │   └── pipes/
│   │       └── parse-uuid.pipe.ts
│   │
│   └── modules/
│       │
│       ├── health/
│       │   └── health.controller.ts    # GET /api/v1/health → { status: 'ok' }
│       │
│       ├── scanner/
│       │   ├── scanner.module.ts
│       │   ├── scanner.controller.ts   # POST /scan, GET /status
│       │   ├── scanner.service.ts      # Logique de scan principale
│       │   ├── metadata.service.ts     # Extraction tags via music-metadata
│       │   ├── cover-extractor.service.ts # Extraction/redimensionnement pochettes
│       │   └── dto/
│       │       └── scanner-status.dto.ts
│       │
│       ├── tracks/
│       │   ├── tracks.module.ts
│       │   ├── tracks.controller.ts
│       │   ├── tracks.service.ts
│       │   └── dto/
│       │       └── track-response.dto.ts
│       │
│       ├── albums/
│       │   ├── albums.module.ts
│       │   ├── albums.controller.ts
│       │   └── albums.service.ts
│       │
│       ├── artists/
│       │   ├── artists.module.ts
│       │   ├── artists.controller.ts
│       │   └── artists.service.ts
│       │
│       ├── concerts/
│       │   ├── concerts.module.ts
│       │   ├── concerts.controller.ts
│       │   └── concerts.service.ts
│       │
│       ├── audiobooks/
│       │   ├── audiobooks.module.ts
│       │   ├── audiobooks.controller.ts
│       │   └── audiobooks.service.ts
│       │
│       ├── playlists/
│       │   ├── playlists.module.ts
│       │   ├── playlists.controller.ts
│       │   ├── playlists.service.ts
│       │   └── dto/
│       │       ├── create-playlist.dto.ts
│       │       ├── update-playlist.dto.ts
│       │       └── add-tracks.dto.ts
│       │
│       ├── likes/
│       │   ├── likes.module.ts
│       │   ├── likes.controller.ts
│       │   └── likes.service.ts
│       │
│       ├── stats/
│       │   ├── stats.module.ts
│       │   ├── stats.controller.ts
│       │   ├── stats.service.ts        # Agrégations SQL
│       │   └── dto/
│       │       ├── play-event.dto.ts
│       │       └── stats-query.dto.ts
│       │
│       ├── stream/
│       │   ├── stream.module.ts
│       │   └── stream.controller.ts    # GET /stream/:id → HTTP range streaming
│       │
│       ├── covers/
│       │   ├── covers.module.ts
│       │   └── covers.controller.ts    # GET /covers/:filename → static file
│       │
│       └── search/
│           ├── search.module.ts
│           ├── search.controller.ts
│           └── search.service.ts       # ILIKE queries sur toutes les entités
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
└── package.json
```

---

## Dépendances clés

### Frontend `package.json`

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@tanstack/react-query": "^5",
    "zustand": "^4",
    "howler": "^2",
    "lucide-react": "latest",
    "recharts": "^2",
    "workbox-window": "^7"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "latest",
    "vite-plugin-pwa": "latest",
    "typescript": "^5"
  }
}
```

### Backend `package.json`

```json
{
  "dependencies": {
    "@nestjs/core": "^10",
    "@nestjs/common": "^10",
    "@nestjs/platform-express": "^10",
    "@nestjs/typeorm": "^10",
    "@nestjs/config": "^3",
    "typeorm": "^0.3",
    "pg": "^8",
    "music-metadata": "^10",
    "chokidar": "^3",
    "sharp": "^0.33",
    "class-validator": "latest",
    "class-transformer": "latest"
  }
}
```

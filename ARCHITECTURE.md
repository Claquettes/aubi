# ARCHITECTURE — aubi

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        HOMELAB                              │
│                                                             │
│  ┌──────────┐    ┌──────────────────────────────────────┐   │
│  │ Traefik  │───▶│              aubi                    │   │
│  │ +Authelia│    │                                      │   │
│  └──────────┘    │  ┌────────────┐  ┌────────────────┐  │   │
│                  │  │  Frontend  │  │    Backend     │  │   │
│                  │  │  React/TS  │  │    NestJS/TS   │  │   │
│                  │  │  PWA       │  │    REST API    │  │   │
│                  │  └────────────┘  └───────┬────────┘  │   │
│                  │                          │            │   │
│                  │  ┌────────────┐  ┌───────▼────────┐  │   │
│                  │  │ PostgreSQL │  │  Audio Files   │  │   │
│                  │  │  (stats,   │  │  (volume monté │  │   │
│                  │  │  meta,     │  │   depuis VPS)  │  │   │
│                  │  │  playlists)│  └────────────────┘  │   │
│                  │  └────────────┘                       │   │
│                  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Conteneurs Docker

| Conteneur       | Image              | Rôle                          | Port interne |
|-----------------|--------------------|-------------------------------|--------------|
| `aubi-frontend` | node:22-alpine (build) → nginx:alpine | Servir le bundle React + service worker | 80 |
| `aubi-backend`  | node:22-alpine     | API NestJS, scan audio, streaming | 3000 |
| `aubi-db`       | postgres:16-alpine | Persistance (meta, stats, playlists) | 5432 |

Réseau : `homelab_proxy` (externe, partagé avec Traefik)  
Volume audio : monté en **lecture seule** dans `aubi-backend`

---

## Structure du monorepo

```
aubi/
├── frontend/                   # Application React
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── icons/              # Icônes PWA (512, 192, etc.)
│   ├── src/
│   │   ├── app/                # Routes, layout principal
│   │   ├── pages/              # Vues par section
│   │   │   ├── music/
│   │   │   ├── concerts/
│   │   │   └── audiobooks/
│   │   ├── features/           # Logique métier par domaine
│   │   │   ├── player/         # Lecteur audio global
│   │   │   ├── library/        # Parcours de la bibliothèque
│   │   │   ├── playlists/
│   │   │   ├── likes/
│   │   │   └── stats/
│   │   ├── components/         # Composants UI réutilisables (design system)
│   │   │   ├── primitives/     # Button, Text, Icon, etc.
│   │   │   ├── layout/         # Grid, Stack, Divider
│   │   │   └── media/          # TrackRow, AlbumCard, CoverArt
│   │   ├── hooks/              # Hooks React custom
│   │   ├── store/              # État global (Zustand)
│   │   ├── api/                # Clients API (fetch wrappers)
│   │   ├── styles/             # Design tokens, CSS globals
│   │   └── sw/                 # Service worker
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── modules/
│   │   │   ├── scanner/        # Scan filesystem, extraction métadonnées
│   │   │   ├── tracks/         # CRUD tracks
│   │   │   ├── albums/
│   │   │   ├── artists/
│   │   │   ├── concerts/
│   │   │   ├── audiobooks/
│   │   │   ├── playlists/
│   │   │   ├── likes/
│   │   │   ├── stats/          # Enregistrement et agrégation lectures
│   │   │   └── stream/         # Streaming audio (HTTP range)
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   └── migrations/
│   │   └── common/             # Guards, interceptors, pipes
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── docker-compose.yml          # Composition aubi (à intégrer au homelab)
├── docker-compose.override.yml # Dev local
├── .env.example
└── docs/                       # Ce dossier de documentation
```

---

## Frontend — Choix techniques

| Outil              | Rôle                                        |
|--------------------|---------------------------------------------|
| **Vite**           | Build tool, HMR                             |
| **React 18**       | UI, Suspense pour le chargement             |
| **TypeScript**     | Typage strict (`strict: true`)              |
| **Zustand**        | État global (player, queue, user prefs)     |
| **TanStack Query** | Fetching/cache des données API              |
| **React Router v6**| Navigation SPA                             |
| **CSS Modules**    | Styles scopés par composant                 |
| **CSS custom properties** | Design tokens (pas de framework CSS) |
| **Workbox**        | Service worker, stratégies de cache         |
| **Howler.js**      | Abstraction audio cross-browser             |

**Pas de** : Bootstrap, Material UI, Tailwind (sauf pour reset éventuel), Ant Design.

---

## Backend — Choix techniques

| Outil              | Rôle                                              |
|--------------------|---------------------------------------------------|
| **NestJS**         | Framework, injection de dépendances, modules      |
| **TypeORM**        | ORM, migrations, entités                          |
| **PostgreSQL**     | Base principale                                   |
| **music-metadata** | Extraction tags ID3/FLAC/OGG depuis les fichiers  |
| **chokidar**       | Surveillance des changements dans le dossier audio|
| **Bull**           | Queue pour les scans longs (optionnel v2)         |
| **class-validator**| Validation des DTOs                               |

---

## Flux de données principaux

### 1. Scan initial
```
Backend démarre
  → ScannerService parcourt /music (volume monté)
  → Pour chaque fichier audio : extrait les tags (titre, artiste, album, durée, pochette)
  → Insère/met à jour en base (upsert sur path)
  → Catégorise selon la structure de dossiers (voir DATABASE.md)
```

### 2. Lecture d'un titre
```
Client demande GET /stream/:trackId
  → Backend vérifie que le fichier existe
  → Lit les headers Range de la requête
  → Retourne un stream HTTP partiel (206 Partial Content)
  → Frontend (Howler) gère la lecture
  → À chaque lecture complète (>80%) : POST /stats/play
```

### 3. Synchronisation PWA
```
Service Worker intercepte les requêtes
  → Cache statique : shell de l'application (cache-first)
  → Cache API : pochettes d'albums (stale-while-revalidate)
  → Pas de cache audio (trop volumineux)
```

---

## Organisation des fichiers audio sur le VPS

La structure de dossiers est la **source de vérité** pour la catégorisation :

```
/music/
├── music/                      # Section Musique
│   ├── Artiste/
│   │   ├── Album (2024)/
│   │   │   ├── 01 - Titre.flac
│   │   │   └── cover.jpg
│   │   └── covers/             # Sous-dossier "covers" → marqué comme cover
│   │       └── Album Cover (2023)/
│   │           └── 01 - Titre.flac
├── concerts/                   # Section Concerts
│   ├── Artiste - Lieu - Date/
│   │   ├── 01 - Titre.flac
│   │   └── info.txt            # Optionnel : setlist, notes
└── audiobooks/                 # Section Livres Audio
    ├── Bible/
    │   ├── Ancien Testament/
    │   │   ├── 01 - Genèse/
    │   │   │   ├── 01 - Chapitre 1.mp3
    │   │   │   └── ...
    └── Auteur - Titre du Livre/
        ├── 01 - Chapitre 1.mp3
        └── ...
```

---

## Sécurité

- L'accès à l'application est entièrement délégué à **Authelia** (middleware Traefik)
- Le backend n'a pas de système d'authentification propre (single-user, accès réseau contrôlé)
- Le volume audio est monté en **read-only** dans le backend
- Variables sensibles via fichier `.env` non commité
- Headers de sécurité gérés par le middleware `security-headers@file` de Traefik

---

## Performance

- Pagination côté backend sur toutes les listes (cursor-based)
- Thumbnails/pochettes : redimensionnées et mises en cache lors du scan (stockées en DB en base64 ou comme fichiers statiques servis par le backend)
- Lazy loading des routes React
- Virtualisation des longues listes (react-virtual)

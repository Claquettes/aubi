# aubi

Application de streaming audio personnelle, auto-hébergée, mobile-first.

PWA — React 18 + TypeScript / NestJS + TypeScript / PostgreSQL / Docker

---

## Documentation

Lire dans cet ordre pour avoir une vision complète du projet :

| Fichier | Contenu |
|---------|---------|
| [VISION.md](./VISION.md) | Concept, principes directeurs, ce que l'app est et n'est pas |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack technique, structure du monorepo, flux de données, organisation des fichiers audio |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens CSS, typographie, composants UI, player, animations |
| [FEATURES.md](./FEATURES.md) | Spécifications fonctionnelles détaillées par section |
| [DATABASE.md](./DATABASE.md) | Schéma PostgreSQL complet, entités, stratégie de scan |
| [API.md](./API.md) | Tous les endpoints REST documentés avec exemples |
| [DOCKER.md](./DOCKER.md) | Dockerfiles, docker-compose, intégration homelab |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Arborescence complète frontend + backend avec rôle de chaque fichier |

---

## Sections de l'application

- **Musique** — bibliothèque musicale, artistes, albums, originaux et covers, titres likés, playlists
- **Concerts** — enregistrements de concerts intégraux
- **Livres audio** — livres audio et Bible

---

## Démarrage rapide

```bash
cp .env.example .env
# Éditer .env : DOMAIN, AUBI_DB_PASSWORD, MUSIC_PATH

docker compose up -d
```

L'application sera accessible sur `https://aubi.${DOMAIN}` via Traefik.

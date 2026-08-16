# DOCKER — aubi

## Fichiers à créer

```
aubi/
├── docker-compose.yml          # Composition autonome (développement + prod)
├── docker-compose.override.yml # Overrides développement local
├── .env.example                # Variables d'environnement documentées
├── frontend/
│   └── Dockerfile
└── backend/
    └── Dockerfile
```

---

## `docker-compose.yml` (prod)

```yaml
name: aubi

networks:
  homelab_proxy:
    external: true
  aubi_internal:
    internal: true

services:
  aubi-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: aubi_frontend
    restart: unless-stopped
    networks:
      - homelab_proxy
    depends_on:
      aubi-backend:
        condition: service_healthy
    labels:
      - traefik.enable=true
      - traefik.http.routers.aubi.rule=Host(`aubi.${DOMAIN}`)
      - traefik.http.routers.aubi.entrypoints=websecure
      - traefik.http.routers.aubi.tls.certresolver=letsencrypt
      - traefik.http.services.aubi.loadbalancer.server.port=80
      - traefik.http.routers.aubi.middlewares=authelia@docker,security-headers@file
      - homepage.group=Media
      - homepage.name=aubi
      - homepage.icon=headphones.png
      - homepage.href=https://aubi.${DOMAIN}
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3

  aubi-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: aubi_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://aubi:${AUBI_DB_PASSWORD}@aubi-db:5432/aubi
      MUSIC_PATH: /music
      PORT: "3000"
      COVERS_PATH: /app/covers
    volumes:
      - ${MUSIC_PATH}:/music:ro                  # Bibliothèque audio en lecture seule
      - aubi_covers:/app/covers                  # Pochettes extraites
    networks:
      - homelab_proxy
      - aubi_internal
    depends_on:
      aubi-db:
        condition: service_healthy
    labels:
      - traefik.enable=true
      - traefik.http.routers.aubi-api.rule=Host(`aubi.${DOMAIN}`) && PathPrefix(`/api`)
      - traefik.http.routers.aubi-api.entrypoints=websecure
      - traefik.http.routers.aubi-api.tls.certresolver=letsencrypt
      - traefik.http.services.aubi-api.loadbalancer.server.port=3000
      - traefik.http.routers.aubi-api.middlewares=authelia@docker,security-headers@file
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1:3000/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  aubi-db:
    image: postgres:16-alpine
    container_name: aubi_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: aubi
      POSTGRES_PASSWORD: ${AUBI_DB_PASSWORD}
      POSTGRES_DB: aubi
    volumes:
      - aubi_db:/var/lib/postgresql/data
    networks:
      - aubi_internal
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aubi -d aubi"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  aubi_db:
    name: aubi_db
  aubi_covers:
    name: aubi_covers
```

---

## `docker-compose.override.yml` (dev)

```yaml
services:
  aubi-frontend:
    build:
      target: dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    command: npm run dev -- --host

  aubi-backend:
    build:
      target: dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
    command: npm run start:dev

  aubi-db:
    ports:
      - "5432:5432"    # Exposé localement pour debug
```

---

## `frontend/Dockerfile`

```dockerfile
# ── Stage dev ──────────────────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173

# ── Stage build ────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage prod ─────────────────────────────────────────────
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `frontend/nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Cache assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker : pas de cache
    location /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## `backend/Dockerfile`

```dockerfile
# ── Stage dev ──────────────────────────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000

# ── Stage build ────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage prod ─────────────────────────────────────────────
FROM node:22-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## `.env.example`

```bash
# Domaine (partagé avec le homelab)
DOMAIN=example.com

# Base de données aubi
AUBI_DB_PASSWORD=changeme_strong_password

# Chemin vers la bibliothèque audio sur le VPS (volume host)
# Ce chemin doit exister sur la machine hôte
MUSIC_PATH=/srv/media/music
```

---

## Intégration dans le homelab existant

Pour intégrer aubi dans le `docker-compose.yml` principal du homelab, deux options :

### Option A (recommandée) — Fichier séparé
Garder le `docker-compose.yml` d'aubi dans son propre dossier et le lancer indépendamment :
```bash
cd /home/claq/code/aubi
docker compose up -d
```
Le réseau `homelab_proxy` est `external: true`, donc Traefik le détecte automatiquement.

### Option B — Fusion dans le homelab
Copier les services `aubi-frontend`, `aubi-backend`, `aubi-db` dans le `docker-compose.yml` principal du homelab, et les volumes/réseaux associés.

**Option A est préférable** pour la maintenabilité et les déploiements indépendants.

---

## Variables d'environnement backend (complètes)

| Variable        | Requis | Description                              | Défaut        |
|-----------------|--------|------------------------------------------|---------------|
| `DATABASE_URL`  | Oui    | URL de connexion PostgreSQL              | —             |
| `MUSIC_PATH`    | Oui    | Chemin du volume audio dans le container | `/music`      |
| `COVERS_PATH`   | Non    | Chemin de stockage des pochettes         | `/app/covers` |
| `PORT`          | Non    | Port d'écoute NestJS                     | `3000`        |
| `NODE_ENV`      | Non    | Environnement                            | `production`  |
| `SCAN_ON_START` | Non    | Scan auto au démarrage                   | `true`        |
| `LOG_LEVEL`     | Non    | Niveau de logs                           | `warn`        |

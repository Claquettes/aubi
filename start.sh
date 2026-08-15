#!/usr/bin/env bash
# Démarre aubi en local (mode dev : hot-reload back + front).
#
#   ./start.sh              démarrage simple
#   ./start.sh --build      reconstruit les images (après un changement de Dockerfile)
#   ./start.sh --install    npm install dans les conteneurs (après un ajout de dépendance)
#   ./start.sh --migrate    joue les migrations TypeORM en attente
#   ./start.sh --scan       lance un scan de la bibliothèque après le démarrage
#
# Le dossier musique se règle avec MUSIC_PATH (défaut : ~/Music) :
#   MUSIC_PATH=/autre/chemin ./start.sh

set -euo pipefail
cd "$(dirname "$0")"

MUSIC_PATH="${MUSIC_PATH:-$HOME/Music}"
NETWORK=homelab_proxy
BUILD=false
INSTALL=false
MIGRATE=false
SCAN=false

for arg in "$@"; do
  case "$arg" in
    --build) BUILD=true ;;
    --install) INSTALL=true ;;
    --migrate) MIGRATE=true ;;
    --scan) SCAN=true ;;
    -h | --help)
      awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "$0"
      exit 0
      ;;
    *)
      echo "Option inconnue : $arg (voir ./start.sh --help)" >&2
      exit 2
      ;;
  esac
done

# Les trois fichiers compose : base + dev + surcharge locale (port 5273, non commitée).
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.override.yml)
[[ -f docker-compose.local.yml ]] && COMPOSE+=(-f docker-compose.local.yml)

compose() { MUSIC_PATH="$MUSIC_PATH" "${COMPOSE[@]}" "$@"; }

# ── Vérifications ───────────────────────────────────────────────────────────
if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker ne répond pas. Démarre le démon puis relance." >&2
  exit 1
fi

if [[ ! -d "$MUSIC_PATH" ]]; then
  echo "✗ Dossier musique introuvable : $MUSIC_PATH" >&2
  echo "  Relance avec MUSIC_PATH=/le/bon/chemin ./start.sh" >&2
  exit 1
fi

# Réseau du homelab : externe dans le compose, donc absent sur une machine neuve.
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
  echo "→ Création du réseau $NETWORK"
  docker network create "$NETWORK" >/dev/null
fi

# ── Démarrage ───────────────────────────────────────────────────────────────
echo "→ Musique : $MUSIC_PATH"
UP_ARGS=(up -d --remove-orphans)
$BUILD && UP_ARGS+=(--build)

# Le frontend attend un backend « healthy » : si le back ne compile pas, compose
# s'arrête là. On continue quand même pour afficher un diagnostic utile.
compose "${UP_ARGS[@]}" || true

# npm install dans les conteneurs : le dossier node_modules est un volume Docker,
# il ne suit pas les ajouts de dépendances faits sur l'hôte.
if $INSTALL; then
  for service in aubi_backend aubi_frontend; do
    if docker ps --format '{{.Names}}' | grep -qx "$service"; then
      echo "→ npm install ($service)"
      docker exec "$service" npm install >/dev/null
      docker restart "$service" >/dev/null
    fi
  done
fi

# ── Attente du backend ──────────────────────────────────────────────────────
printf '→ Attente du backend'
API=http://localhost:3000/api/v1
for _ in $(seq 1 60); do
  if curl -sf "$API/health" >/dev/null 2>&1; then
    ready=true
    break
  fi
  printf '.'
  sleep 2
done
echo

if [[ "${ready:-false}" != true ]]; then
  echo "✗ Le backend n'a pas démarré. Dernières lignes :" >&2
  docker logs aubi_backend --tail 20 2>&1 | sed 's/^/  /' >&2
  echo >&2
  echo "  Erreur « Cannot find module » → ./start.sh --install" >&2
  exit 1
fi

# Le frontend n'a pas démarré si le backend était KO au premier essai.
compose up -d >/dev/null 2>&1 || true

if $MIGRATE; then
  echo "→ Migrations"
  docker exec aubi_backend npm run migration:run
fi

if $SCAN; then
  echo "→ Scan de la bibliothèque (en tâche de fond côté serveur)"
  curl -sf -X POST "$API/scanner/scan" >/dev/null && echo "  scan lancé"
fi

# ── C'est prêt ──────────────────────────────────────────────────────────────
FRONT_PORT=$(compose port aubi-frontend 5173 2>/dev/null | sed 's/.*://')
echo
echo "✓ aubi tourne"
echo "  Frontend : http://localhost:${FRONT_PORT:-5273}"
echo "  API      : $API"
echo "  Logs     : docker compose -f docker-compose.yml -f docker-compose.override.yml logs -f"
echo "  Arrêt    : ./stop.sh"

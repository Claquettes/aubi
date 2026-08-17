#!/usr/bin/env bash
# Arrête aubi.
#
#   ./stop.sh             arrête et supprime les conteneurs (données conservées)
#   ./stop.sh --keep      met simplement en pause (redémarrage plus rapide)
#   ./stop.sh --purge     supprime AUSSI la base et les pochettes (irréversible)

set -euo pipefail
cd "$(dirname "$0")"

MODE=down

for arg in "$@"; do
  case "$arg" in
    --keep) MODE=stop ;;
    --purge) MODE=purge ;;
    -h | --help)
      awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "$0"
      exit 0
      ;;
    *)
      echo "Option inconnue : $arg (voir ./stop.sh --help)" >&2
      exit 2
      ;;
  esac
done

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.override.yml)
[[ -f docker-compose.local.yml ]] && COMPOSE+=(-f docker-compose.local.yml)

# AUBI_MEDIA_ROOT n'a aucun effet à l'arrêt, mais compose râle si elle manque.
compose() { AUBI_MEDIA_ROOT="${AUBI_MEDIA_ROOT:-$HOME}" "${COMPOSE[@]}" "$@"; }

case "$MODE" in
  stop)
    compose stop
    echo "✓ aubi en pause (./start.sh pour reprendre)"
    ;;
  down)
    compose down
    echo "✓ aubi arrêté — base et pochettes conservées"
    ;;
  purge)
    echo "⚠ Cela supprime la base (bibliothèque scannée, playlists, favoris,"
    echo "  statistiques) et les pochettes extraites. Irréversible."
    if [[ ! -t 0 ]]; then
      echo "✗ --purge demande une confirmation : lance-le dans un terminal." >&2
      exit 1
    fi
    read -r -p "Tape « supprimer » pour confirmer : " answer
    if [[ "$answer" != "supprimer" ]]; then
      echo "Annulé."
      exit 0
    fi
    compose down --volumes
    echo "✓ aubi arrêté et données supprimées"
    echo "  Au prochain démarrage : ./start.sh --migrate --scan"
    ;;
esac

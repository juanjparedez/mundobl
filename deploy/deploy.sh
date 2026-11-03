#!/usr/bin/env bash
# Deploy en el servidor propio: trae main, reconstruye y reinicia.
# Uso (en el servidor): cd ~/mundobl && ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Falta .env en $(pwd) (ver deploy/README.md)"; exit 1; }

git pull --ff-only origin main
export MUNDOBL_BUILD_SHA="$(git rev-parse HEAD)"
export MUNDOBL_BUILD_COMMIT_DATE="$(git log -1 --format=%cI)"

docker compose -f deploy/compose.yml up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose -f deploy/compose.yml ps

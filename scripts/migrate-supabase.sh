#!/bin/bash
# Aplica el schema de Prisma a la DB de Supabase (producción)
# Usa las variables de .env (no .env.local que apunta a local)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: No se encontró $ENV_FILE"
  exit 1
fi

# Leer DIRECT_URL desde .env (ignorando .env.local)
SUPABASE_URL=$(grep '^DIRECT_URL=' "$ENV_FILE" | cut -d'"' -f2)

if [ -z "$SUPABASE_URL" ]; then
  echo "Error: No se encontró DIRECT_URL en .env"
  exit 1
fi

echo "Aplicando schema a Supabase..."
DIRECT_URL="$SUPABASE_URL" npx prisma db push

echo "Supabase actualizada."

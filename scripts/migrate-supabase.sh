#!/bin/bash
# Compatibilidad con invocaciones anteriores. Solo migraciones versionadas.
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$SCRIPT_DIR/migrate-supabase.mjs"

#!/bin/bash
# Levanta la DB local y corre migraciones

set -e

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker no está corriendo. Inicialo primero."
  exit 1
fi

# Levantar contenedor si no está corriendo
if ! docker ps --format '{{.Names}}' | grep -q mundobl-db; then
  echo "Levantando PostgreSQL local..."
  docker compose up -d
  echo "Esperando que PostgreSQL esté listo..."
  sleep 3
else
  echo "PostgreSQL local ya está corriendo."
fi

# Correr migraciones con la DB local
echo "Aplicando migraciones..."
DIRECT_URL="postgresql://mundobl:mundobl@localhost:5433/mundobl" npx prisma migrate dev

echo "DB local lista."

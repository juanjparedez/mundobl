# Backup y recuperación

La base de producción es la D1 `mundobl` (Cloudflare). Tiene dos capas de respaldo.

## 1. Time Travel de D1 (automático, 30 días)

D1 guarda el historial de cambios de los últimos 30 días y permite volver a un
minuto exacto. No hay que activarlo. Restaurar reemplaza la base entera:

```powershell
npx wrangler d1 time-travel info mundobl
npx wrangler d1 time-travel restore mundobl --timestamp=2026-12-01T10:00:00Z
```

Usarlo solo después de anotar el bookmark actual que imprime `info`, así se
puede deshacer la restauración.

## 2. Copia semanal en R2 (workflow `Backup de la base`)

Domingos 07:00 UTC (04:00 Argentina). Pasos:

1. `wrangler d1 export mundobl --remote` genera un volcado SQL (schema + datos).
2. Ensayo de restauración: el volcado se carga en una SQLite vacía con
   `scripts/db/restore-local.mjs`, que corre `foreign_key_check` y cuenta filas.
   Un volcado que no carga no se sube.
3. Se comprime y se sube al bucket privado `mundobl-backups`; se borran las copias
   de más de 14 días.

Nunca se guarda como artifact de Actions: el repo es público y el volcado tiene
mails y sesiones.

Secrets en GitHub → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` (con permiso "D1: Edit") y `CLOUDFLARE_ACCOUNT_ID`.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: credencial R2
  limitada al bucket de backups.
- `R2_BACKUP_BUCKET`: `mundobl-backups`.

El trabajo corre solo si la **variable** `BACKUPS_ENABLED` vale `true`. No inferir
que está activo por este documento: verificar en Actions la última corrida y el
objeto en el bucket.

## Ensayo de restauración a mano

```powershell
# Descomprimir el .sql.gz descargado de R2 en una carpeta privada, despues:
node scripts/db/restore-local.mjs .\mundobl_2026-12-01_0700.sql .\restore.db
$env:DATABASE_URL = "file:./restore.db"; npm run dev
```

`restore-local.mjs` solo escribe en un archivo local; nunca toca la D1 remota.
Para devolver datos a producción preferir Time Travel. Si hiciera falta cargar un
volcado en la D1, hacerlo con un procedimiento revisado para ese caso.

`scripts/test-backup-restore.mjs` (parte de `npm run test:all`) prueba el ciclo
volcado → restauración con datos sintéticos y verifica que el trigger de historial
no duplique eventos.

Las imágenes de R2, credenciales y configuración externa no están en el volcado.

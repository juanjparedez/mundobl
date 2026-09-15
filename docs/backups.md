# Backup y recuperación

El workflow `Backup de la base` exporta los 62 modelos a JSON comprimido en R2 y conserva 14 días. El exportador lee una única instantánea consistente (`RepeatableRead`), falla si falta un modelo o una consulta y nunca publica un backup parcial. `--check-models` comprueba la cobertura sin consultar la base.

## Activación pendiente

Bucket creado: `mundobl-backups`. Verificado el 15/09/2026: dominio r2.dev desactivado y sin dominios personalizados. No usar `mundobl-images`, que sirve contenido público.

En GitHub → Settings → Secrets and variables → Actions, cargar:

- `DATABASE_URL`: conexión PostgreSQL de MundoBL.
- `R2_ACCOUNT_ID`: ID de la cuenta Cloudflare.
- `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`: credencial R2 con lectura/escritura limitada al bucket de backups.
- `R2_BACKUP_BUCKET`: `mundobl-backups`.

Después, crear la **variable** `BACKUPS_ENABLED` con valor `true` y ejecutar manualmente el workflow. Comprobar la carga del archivo en R2 antes de confiar en la programación diaria de las 07:00 UTC. Hasta entonces el trabajo queda omitido: no hay backups automáticos activos.

## Ensayo de restauración

1. Crear una base PostgreSQL local vacía con el mismo esquema mediante `prisma migrate deploy`.
2. Descargar y descomprimir el JSON desde R2 en un directorio privado.
3. Con `DATABASE_URL` apuntando a esa base local, ejecutar `npx tsx scripts/restore-backup-local.ts <archivo.json>`.

El restaurador exige localhost y todas las tablas vacías. Conserva las restricciones, ordena las tablas por sus dependencias y recupera las secuencias de IDs. No permite restaurar directamente sobre producción. La recuperación real requiere verificar primero los datos en esa base local y preparar un procedimiento específico para el destino.

`Verify backup restoration` prueba con datos sintéticos: comparación de las 62 tablas, JSON y Unicode, las cuatro tablas antes omitidas, secuencias y rechazo de un destino ocupado. No utiliza secretos ni datos de producción.

El JSON cubre los datos de la aplicación. El esquema se reconstruye con las migraciones versionadas. Los archivos de imágenes de R2/Supabase, credenciales de servicios y configuración externa no están incluidos.

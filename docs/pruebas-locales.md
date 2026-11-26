# Pruebas locales

```bash
npm run test:all     # suite completa, igual que el workflow remoto
npm run test:fast    # solo tipos, lint y formato
```

La base de pruebas es un archivo SQLite descartable en
`test-results/test-all/replay.db`, con las mismas migraciones (`migrations/`) que
la D1 de producción. No hace falta Docker ni PostgreSQL: solo Node 22 y
`npm install` (que instala `better-sqlite3` y activa el hook pre-push).

`test:all` admite `-- --list` y `-- --from=<paso>` para retomar desde un paso.
Si un paso falla imprime el comando para retomar.

## Aislamiento

- Los scripts de prueba exigen `DATABASE_URL=file:` dentro de `test-results/` o
  del directorio temporal (`scripts/assert-local-test-database.ts`). No pueden
  apuntar a la D1 remota.
- No usan secretos ni datos de producción. Las pruebas de UI corren en Chromium
  (Playwright) contra la misma base local.

## Qué verifica

1. Prisma, TypeScript, ESLint y formato.
2. Que `migrations/` aplicado desde cero coincide con `prisma/schema.prisma`
   (`npm run db:check`) y el schema SQLite (triggers, índices).
3. Regresiones de datos y rutas con datos sintéticos.
4. Volcado y restauración en otra base descartable.
5. Diez locales y componentes reales en Chromium.
6. Build de producción y pruebas contra `next start`.

## Antes de publicar

- Push a `main`: el hook ejecuta `test:all` completo.
- Push a otra rama: `test:fast`.
- El hook no corre al usar el botón de merge de GitHub; `tracking.yml`
  (`workflow_dispatch`) corre la misma suite en Actions cuando se pide.
- `git push --no-verify` omite el hook: no usarlo para evitar una prueba fallida.

## Desarrollo con una base local

```bash
npm run local:dev    # migra ./local.db y levanta next dev contra ella
```

Para probar con datos reales, restaurar un backup en un archivo local (ver
[backups.md](backups.md)) y usar `DATABASE_URL=file:./restore.db`.

# Correr todas las pruebas local (`npm run test:all`)

Un solo comando corre lo mismo que CI: `.github/workflows/tracking.yml` llama a
`scripts/test-all.mjs`, así que la lista de pruebas es una sola y no se puede
desincronizar.

## Qué corre

1. `prisma generate`, `tsc --noEmit`, `eslint src/`, `prettier --check` sobre `src/`.
2. Postgres 16 descartable en Docker (`127.0.0.1:55433/mundobl_replay`, en memoria).
3. `prisma migrate deploy` + `db:check` (el historial de migraciones coincide con el schema).
4. Regresiones `scripts/test-*.ts` y de rutas `.mjs`, auditoría de locales.
5. Backup/restore contra una segunda base `mundobl_restore`.
6. Pruebas de UI con Playwright (Chromium).
7. `next build` y las pruebas contra `next start` en `127.0.0.1:3223`.

Tarda más o menos lo mismo que CI (10 a 15 minutos). `npm run test:fast` corre solo
el paso 1 (alrededor de un minuto).

Nunca usa `.env`: las claves de `.env*` se vacían para los procesos de prueba, así el
build y el servidor de prueba no tocan producción.

## Preparar la máquina (Windows, una vez)

1. Node 22 y Git for Windows.
2. Docker Desktop, abierto antes de correr las pruebas.
3. En el repo: `npm install`. Además de instalar dependencias, activa el hook de git
   (`git config core.hooksPath .githooks`).
4. `npm run test:all`. La primera vez baja la imagen `postgres:16-alpine` y Chromium.

Si falla un paso, el mensaje dice cómo retomar sin repetir todo:
`npm run test:all -- --from=<paso>`. `npm run test:all -- --list` muestra los pasos.

Sin Docker: levantar cualquier Postgres en `127.0.0.1:55433` con la base
`mundobl_replay` vacía y correr con `MUNDOBL_TEST_DB=external` y `DATABASE_URL`
apuntando ahí (ver [seguimiento-pruebas-locales.md](seguimiento-pruebas-locales.md)).

## Hook pre-push

- Push a `main`: corre `test:all` completo sobre exactamente lo que se publica. Si hay
  cambios sin commitear o HEAD no es el commit que se empuja, corta antes de probar.
- Push a otra rama: corre `test:fast`. El PR igual pasa por CI.
- `git push --no-verify` lo saltea. Es una salida de emergencia, no un atajo: un push
  así a `main` puede romper `main` como pasó con #130.

## Mergear local a main

Es válido para un proyecto de una persona si el hook es la puerta real. Lo que se pierde:

- El registro en GitHub de que la versión publicada pasó CI (el check verde del PR).
- La corrida en una máquina limpia: un archivo sin trackear o un `node_modules` viejo
  puede hacer pasar local algo que en limpio falla. El hook exige árbol limpio para
  archivos trackeados, pero no detecta archivos nuevos sin `git add`.
- Las ramas de Claude en la nube no tienen el hook (instalan con `--ignore-scripts`);
  lo que llega por PR sigue necesitando CI verde antes de mergear.

## Costos

- Vercel: `vercel.json` tiene `git.deploymentEnabled: false`, así que ningún push
  (ni a `main` ni a ramas) despliega. No hay previews. Lo que consume cuota es el
  tráfico en producción (CPU de funciones, escrituras ISR) y cada deploy manual. Mergear
  local no cambia eso; agrupar deploys sí.
- GitHub Actions: el repo es público, los minutos son gratis. `tracking.yml` ahora
  saltea cambios solo de docs/markdown y cancela corridas viejas del mismo PR.
  `migrations.yml` y `backup-restore-test.yml` se eliminaron porque `test:all` ya
  cubre `db:check` y el backup/restore.

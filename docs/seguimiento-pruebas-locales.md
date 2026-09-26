# Pruebas SQL del seguimiento

Se puede validar la persistencia sin credenciales compartidas usando PGlite y su servidor TCP, incluidos entre las dependencias instaladas de Prisma. Es una base PostgreSQL embebida de un solo backend: ejecuta SQL real, pero no reemplaza las pruebas de concurrencia de un servidor PostgreSQL nativo.

## Ejecución en PowerShell

En una terminal:

```powershell
node scripts/local-prisma-db.mjs
```

La instancia es exclusivamente en memoria y escucha en `127.0.0.1:55433`; la instancia de sombra usa `55434`. Si un puerto está ocupado, falla. El script no carga `.env` ni reutiliza datos existentes. Detenerlo elimina sus datos.

En otra terminal, dentro del repositorio:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55433/template1?sslmode=disable'
$env:DIRECT_URL=$env:DATABASE_URL
$env:MUNDOBL_TEST_RUNTIME='prisma-dev'
npx prisma migrate deploy
node --import ./scripts/prisma-test-runtime.mjs --import tsx scripts/test-progress.ts
node --import ./scripts/prisma-test-runtime.mjs --import tsx scripts/test-tracking-database.ts
npm run db:check
```

Los valores anteriores son solo del entorno temporal. El módulo de prueba verifica host, puerto, nombre y modo explícito antes de crear un cliente con una sola conexión. No modifica el pool de la aplicación. No ejecutar dos procesos de prueba simultáneamente contra esta instancia.

`MUNDOBL_TEST_RUNTIME=prisma-dev` identifica este entorno de prueba aunque el script use directamente PGlite Socket. El servidor completo de `@prisma/dev` incorpora tareas auxiliares que pueden interferir con las consultas sobre su único backend; por eso no se usa aquí.

## Evidencia obtenida el 2026-09-26

- Las 47 migraciones versionadas se aplicaron sobre una instancia vacía; `db:check` no encontró diferencias con el schema.
- Progreso: marcar rangos y partes, completar, desmarcar, crear la suscripción inicial y validar referencias; los reintentos conservan fechas históricas o desconocidas y respetan una pausa elegida por el usuario.
- Restauración: la vista previa no escribe; se preservan fechas de episodios y notas; los `userId` del archivo no transfieren propiedad; reintentar no duplica y los datos existentes tienen prioridad.
- Referencias editoriales: búsqueda SQL, coincidencias insensibles a mayúsculas, rechazo de nombres ambiguos y ausencia de creación de vocabulario durante la resolución.

## Límites

La prueba de fallo SQL deliberado para demostrar rollback está implementada en `test-tracking-database.ts`, pero se omite explícitamente en PGlite: la versión instalada de su transporte puede perder la sincronización del protocolo después de la excepción. Queda pendiente ejecutarla contra PostgreSQL nativo local en `127.0.0.1:55433/mundobl_replay`, sin el módulo `prisma-test-runtime` y sin `MUNDOBL_TEST_RUNTIME=prisma-dev`.

Tampoco se validan aquí concurrencia de múltiples conexiones, permisos de producción ni el recorrido HTTP autenticado completo. Las pruebas de handlers con dependencias simuladas y las de UI siguen siendo complementarias. Un marcado que conserva la fecha no equivale a un historial de múltiples visionados: ese modelo y su interfaz siguen pendientes.

## PostgreSQL nativo: validación del historial

El 2026-09-26 se usaron los binarios de `@embedded-postgres/windows-x64@18.4.0-beta.17`, PostgreSQL 18.4, instalados únicamente en `test-results/postgres-tools` (ignorado por Git). Cluster local en `test-results/postgres-history-data`, escuchando solo en `127.0.0.1:55433`; no se instaló un servicio de Windows. No compartir este cluster de pruebas, configurado con autenticación trust en loopback.

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55433/mundobl_replay'
$env:DIRECT_URL=$env:DATABASE_URL
$env:SHADOW_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55433/mundobl_shadow'
$env:MUNDOBL_TEST_RUNTIME=''
node --import tsx scripts/test-progress.ts
node --import tsx scripts/test-tracking-database.ts
node --import tsx scripts/test-tracking-history.ts
```

Las 48 migraciones se reconstruyeron, incluyendo la del historial generada/aplicada con migrate dev. Pasaron progreso y restauración, incluido el fallo SQL deliberado y rollback antes omitido en PGlite. La prueba nueva demuestra captura transaccional, reintentos concurrentes sobre marcas existentes sin duplicaciones, cambios de fecha, paginación, aislamiento por propietario, exportación/restauración sin eventos inventados y borrado que conserva progreso. Esto no demuestra todas las posibles carreras concurrentes ni permisos de producción.

Con una segunda base vacía `mundobl_restore`, reconstruida con migrate deploy, `test-backup-restore.ts` pasó la comparación de las 63 tablas, secuencias y rechazo de destino ocupado. Configurar BACKUP_TEST_SOURCE_URL y BACKUP_TEST_TARGET_URL con las URLs locales respectivas.

El recorrido `test-watching-ui.mjs` también cubre historial, paginación y cancelar/confirmar borrado, conservando las marcas y notas simuladas. Las pruebas de navegador interceptan las APIs: no equivalen a un recorrido HTTP autenticado con datos reales.

## Restauración con créditos de guion

El ensayo posterior sobre `mundobl_restore_writer_20260926` reconstruyó 49 migraciones y comparó las 65 tablas del origen local. `test-backup-restore.ts` incluye Writer/SeriesWriter con alias Unicode, atribución y fuentes, comprueba sus secuencias y rechaza restaurar sobre un destino ocupado. El origen conserva sus datos anteriores; las fixtures creadas por esta ejecución se eliminan al finalizar.

Para repetir, usar un destino **vacío** local con nombre `mundobl_restore` o prefijo `mundobl_restore_`, migrado al mismo schema; configurar `BACKUP_TEST_SOURCE_URL` a `mundobl_replay` y `BACKUP_TEST_TARGET_URL` al destino elegido. El destino anterior queda ocupado y no debe reutilizarse directamente. No ejecutar contra bases remotas.

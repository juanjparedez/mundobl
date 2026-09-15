# Gestión de Basado en

Acceso: `/admin/tags?tab=based-on`, con rol ADMIN.

- **Crear/asignar:** escribir un valor al editar una ficha. Los valores sin fichas no se almacenan como categorías independientes.
- **Consultar:** buscar un valor y ver su cantidad de fichas. Los valores exactos aparecen entre comillas para distinguir mayúsculas y espacios.
- **Renombrar:** aplicar una nueva escritura a todas las fichas de ese valor. Si el destino ya existe, usar Fusionar.
- **Fusionar:** elegir el valor de destino y revisar la lista de fichas afectadas. Por ejemplo, seleccionar `Manga` y fusionarlo en `manga`.
- **Quitar clasificación:** vaciar el campo en las fichas enumeradas. No elimina series.

El listado contempla todos los orígenes y visibilidades. Los enlaces de revisión abren la edición administrativa de cada ficha.

Los cambios requieren permisos ADMIN también en la API. Se ejecutan en una transacción Serializable y se rechazan si cambió la selección de fichas desde la vista previa. El formulario conserva los valores omitidos en actualizaciones parciales y reutiliza la escritura más frecuente de las variantes al guardar.

No hay migraciones ni reclasificación automática masiva. Manga vuelve a ser una sugerencia válida; GM mantiene la exclusión previa de sugerencias y está disponible en el directorio para corrección explícita.

## Verificación local

- PostgreSQL descartable `127.0.0.1:55433/mundobl_replay`, historial aplicado con `prisma migrate deploy`.
- `npx tsx scripts/test-based-on.ts`: fixtures y pruebas de canonización, renombrado, fusión, limpieza, conflictos y concurrencia. Requiere una base nueva para sus recuentos.
- App local en `localhost:3002`, con esa base y `AUTH_SECRET=based-on-local-test-only`; `node scripts/test-based-on-ui.mjs` prueba 401/403/400 y las operaciones reales en navegador. No usar ese secreto fuera del ensayo local.
- Las pruebas no modifican producción ni envían notificaciones.

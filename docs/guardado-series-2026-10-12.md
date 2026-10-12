# Guardado y recuperación de fichas

## Incidente verificado

En producción, `Only Friends` (585, año 2023) existe como `CURATED` +
`WATCHABLE_ONLY`. `Only friends 2` (748, también 2023) fue creada en `PERSONAL`.
El POST rechazaba el título original con 409 porque consulta todos los ámbitos
CURATED, mientras la búsqueda pública del catálogo solo muestra PERSONAL.
La tabla administrativa ya incluye ambos ámbitos; no era un registro invisible
para todos los administradores ni una restricción unique de PostgreSQL.

## Flujo nuevo

Al escribir un título en **Nueva serie**, se consulta la coincidencia exacta
(sin distinguir mayúsculas, recortando los espacios exteriores). La advertencia
indica si la ficha está en Ver completo y permite abrirla o comparar la carga.
El servidor sigue comprobando duplicados al guardar, incluso si falló la búsqueda.

**Comparar datos** muestra los valores existentes y los del formulario. Los
campos elegidos reciben el valor editorial del administrador. Los restantes
conservan el existente; los vacíos no se seleccionan automáticamente.
**Guardar en la ficha existente** conserva el ID y publica la ficha en PERSONAL.

- Temporadas: se emparejan por número, conservando sus IDs y las omitidas.
  Nunca se aceptan IDs de temporada enviados por este flujo de alta.
- Episodios, reproducciones, comentarios y seguimiento no se borran.
- Enlaces: se conservan los existentes y se agregan/actualizan por URL.
- Contenido audiovisual y bloques del formulario: se agregan dentro de la misma
  transacción; un fallo revierte también la actualización y su revisión.
- `editVersion` es la versión vista al comparar, no una versión actualizada en
  silencio al guardar. Si otra edición ganó la carrera, responde EDIT_CONFLICT.
- La foto anterior queda en SeriesRevision. No se cambia origin ni se promueven
  aportes USER_EMBED: esos mantienen su flujo administrativo de vinculación.

Esto resuelve nuevas cargas sobre una ficha existente. No fusiona automáticamente
dos fichas que ya fueron creadas: 585 y 748 se conservaron para no alterar sus
datos ni enlaces públicos sin una reconciliación específica.

## Borradores

El formulario guarda sus campos, contenidos pendientes y bloques en localStorage,
por cuenta y por ficha (un borrador para alta, otro por cada edición). Al volver
ofrece **Recuperar** o **Descartar borrador**. Un guardado fallido conserva el
borrador; solo el éxito lo limpia. Una edición recuperada mantiene su editVersion
original y no puede sobreescribir una edición posterior sin advertencia.

El respaldo es de este navegador, no una sincronización entre computadoras.
Borrar los datos del sitio también elimina los borradores. Los archivos todavía
no subidos y cambios dentro de un modal que aún no se agregaron al formulario no
forman parte del borrador. Usar una pestaña de edición por ficha: no se implementó
colaboración ni conciliación de dos borradores simultáneos en el mismo navegador.
Si el almacenamiento falla, la pantalla lo informa y permite guardar en el servidor.

## Feedback y ramas

Los pedidos 170 (Compartir) y 171 (Agrandar imagen) se marcaron COMPLETED tras la
validación de Flor comunicada por Juan. Ya estaban publicados por PR #113; el
merge no había cambiado sus estados. No se enviaron mensajes ni notificaciones.
El pedido 172 (No guarda) queda pendiente hasta publicar la corrección.

Se comprobó que la rama remota `codex/calidad-patrocinio` y 14 ramas locales ya
eran ancestros de main antes de eliminarlas. El commit documental eca8d2d,
todavía no publicado, se conserva en el PR de esta corrección.

## Verificación

- `npm run lint`: sin errores; ocho advertencias anteriores fuera de estos cambios.
- `npm run build`: correcto contra PostgreSQL local.
- `npx tsx scripts/test-series-curation.ts`: precedencia por selección, conservación
  de temporadas/episodios/enlaces, rechazo de IDs ajenos, rollback e historial.
- `npx tsx scripts/test-series-save.ts`: suite existente de guardado y concurrencia.
- `node scripts/test-series-curation-ui.mjs`: recorrido autenticado con Chromium
  contra servidor Next y PostgreSQL reales. Incluido en Tracking integration.
  Requiere DATABASE_URL local en 127.0.0.1:55433/mundobl_replay; servidor en
  localhost:3002 con AUTH_SECRET=curation-local-test-only, o las variables
  SERIES_FORM_TEST_BASE_URL y AUTH_SECRET equivalentes para otro servidor local.
  La validación final contra el build está pendiente al escribir este registro.

No hay migraciones ni servicios nuevos. Mergear no despliega: se publica con el
workflow manual Deploy producción después de verificar el PR.

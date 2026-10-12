# Clasificación editorial y piloto GagaOOLala

Fecha: 12/10/2026. Rama: `codex/piloto-editorial`.

## Operación editorial

Flor conserva la decisión editorial. El formulario separado en
`/admin/series/{id}/clasificacion` admite únicamente ADMIN no bloqueado, comprobado
de nuevo en la transacción. Se accede desde la edición de la ficha. Moderadores,
colaboradores, usuarios, bots e importadores no pueden escribir esos campos por
las rutas de edición/importación. No se asigna edad por BL/GL, género, orientación
sexual, identidad ni etiquetas de personajes. La clasificación requiere revisión
humana del contenido o una fuente concreta.

- `UNREVIEWED`: sin revisar; **no significa apto**. Es el valor inicial de las
  fichas existentes y de nuevas importaciones.
- `GENERAL`: no se identificó una restricción +18; no certifica idoneidad para
  todas las edades ni sustituye los avisos de contenido.
- `ADULT18`: requiere autodeclaración antes de abrir el detalle o sus medios.
- Avisos independientes: contenido sexual, desnudez, violencia, abuso y
  autolesiones. No se generan automáticamente a partir de la orientación sexual.

Cada guardado exige `editVersion`, incrementa esa versión y conserva la foto
anterior en `SeriesRevision`. Una pestaña antigua recibe 409. El motivo/fuente y
la identidad de revisión son internos; el público recibe clasificación y avisos.
No se modifican estados de visionado, fechas, notas ni eventos de seguimiento.
No se clasificaron obras reales durante el desarrollo.

## Alcance de la preferencia +18

Cookie `mundobl-content-consent`: HMAC con `AUTH_SECRET`, HttpOnly, SameSite=Lax,
Secure en HTTPS, 30 días, sin identificador personal. Se puede revocar desde
`/preferencias-contenido`, enlazada desde los avisos y `/privacidad`. Cambiar el
secreto invalida las preferencias anteriores. No hay verificación de identidad
ni de edad: **no es control parental**.

| Superficie | Tratamiento |
| --- | --- |
| `/series/[id]`, `/catalogo/[id]`, dashboard de ficha y `/ver/[id]` | Antes de construir la vista de detalle se exige consentimiento para ADULT18; los demás estados también muestran su clasificación. |
| Metadata social de esas fichas | Título y descripción genéricos, sin imagen específica de la obra y noindex, incluso en un navegador que aceptó. |
| API de ficha, episodio, lista de episodios, temporada y bloques informativos | Restricción +18 para lectores públicos, respuesta privada/no-store; edición autorizada conserva acceso. Los bloques vacíos conservan su respuesta vacía. |
| `/contenido` | Sigue siendo el directorio de videos. Excluye medios asociados a fichas ocultas/+18 de la página compartida. |
| `/api/contenido` | Filtra por visibilidad y consentimiento; acceso editorial autenticado. |
| Vista rápida de `/catalogo` y `/ver` | Omite sinopsis +18 en los datos públicos, incluso con consentimiento; se abre la ficha para leerla. |
| Listados, búsquedas, portadas y títulos | Continúan visibles. No existe una promesa de ocultar toda referencia a una obra. |
| Seguimiento y respaldo privados | Independientes de la preferencia. Revocarla no elimina la biblioteca ni modifica progreso. |

No están cubiertos como un filtro universal los comentarios comunitarios,
reseñas, textos de noticias, páginas de personas, medios sin ficha asociada,
copias ya descargadas ni sitios/plataformas externos. Las imágenes públicas
conocidas por URL continúan accesibles. La clasificación de series no clasifica
automáticamente cada publicación de la comunidad o archivo externo.

Las cookies se leen fuera de caches de datos. Guardar clasificación invalida las
fichas/listados y el layout raíz para regenerar previews; es una operación
editorial infrecuente. Hay que verificar HTTP real (HTML, RSC, navegación del
cliente y caché del proveedor) antes del despliegue. El build por sí solo no
demuestra aislamiento de caché.

## Piloto de clics

`POST /api/pilot-clicks` incrementa `PilotClickDaily(day UTC, placement, clicks)`.
Solo se admite `series` o `platforms`. Para fichas, valida que el WatchLink sea
oficial, HTTPS, de GagaOOLala y de una serie visible. No hay redirección abierta,
ni tracking en GET/prefetch. Los enlaces navegan directamente aunque falle la
medición. Se excluyen cuentas del equipo autenticadas y cuentas bloqueadas.

El navegador guarda durante la pestaña solo una marca de tiempo por sección para
evitar repeticiones en 30 segundos; no guarda un mapa de títulos visitados. El ID
de enlace se usa para validarlo, no se almacena en el agregado. No se persisten
cuentas, IP, agentes de navegador, referencias, identificadores de visitantes ni
historial individual en este piloto. No usa servicios nuevos ni pagos. Esto no
cambia el funcionamiento de los logs técnicos del hosting o servicios existentes.

`/admin/piloto`, visible en la navegación ADMIN, muestra los últimos 60 días UTC.
La tabla está protegida con RLS sin política pública y forma parte del respaldo
completo del servidor. Las filas históricas no se purgan automáticamente al día
60; 60 días es la ventana del informe, no una promesa de retención.

Son **clics registrados**, no personas únicas, reproducciones, suscripciones ni
conversiones. Puede haber subregistro por bloqueadores/almacenamiento restringido
y sobrerregistro por repeticiones entre pestañas, bots o POST falsificados: la
validación de Origin no autentica a un cliente no navegador. No se intenta deduplicar
personas mediante IP o huellas. Un informe comercial debe declarar estos límites
y separar siempre sección y período. No hay clics históricos recuperables.

## Seguimiento, correos y respaldo

La clasificación y la curaduría aditiva conservan los IDs de capítulos/partes.
Se agregó una protección para el formulario que elimina temporadas y para la
fusión destructiva de USER_EMBED: si existe progreso, notas o historial afectado,
la transacción se revierte con 409 `TRACKING_PRESERVATION_REQUIRED`. La fusión
tampoco destruye una clasificación humana de origen. Es necesario reconciliar
estos casos manualmente; todavía no hay migración automática de progreso entre
dos fichas ni múltiples visionados. Los borrados explícitos de administración
siguen siendo destructivos y no deben confundirse con curar/clasificar.

La bienvenida describe biblioteca, capítulos/partes, estados, fechas, historial,
diario, exportación, plataformas y comunidad. Se mantienen layout y colores de
correo existentes (los clientes de correo no interpretan skins/variables CSS).
Las nuevas cadenas existen en los diez locales. El renderer acepta `labels` y
`locale`; el alta actual continúa usando español porque el idioma de interfaz
solo vive en localStorage y no hay preferencia de correo persistida. No se
inventó una elección de idioma del destinatario.

Los anuncios siguen exigiendo `NotificationPrefs.emailEnabled`, incluyendo
audiencias específicas; tienen baja y List-Unsubscribe. La bienvenida es
transaccional y no activa campañas. No se envió ningún correo durante las pruebas.
El piloto no ofrece alcance por email sin consentimiento explícito.

## Validación y puesta en servicio

Migración `20261012205349_editorial_maturity_pilot_clicks`: aplicada solo en bases
locales descartables (`mundobl_pilot` previamente y `mundobl_replay` para pruebas,
puerto 55433). No se ejecutó contra producción. `db:check` no detecta diferencias.
No editar esta migración ya aplicada: cualquier cambio posterior requiere otra.

Pruebas reproducibles (establecer explícitamente `DATABASE_URL` y `DIRECT_URL`
a `127.0.0.1:55433/mundobl_replay`; jamás cargar credenciales productivas):

- `npx tsx scripts/test-editorial-classification.ts`: autoridad, conflictos,
  revisión, preservación de clasificación/progreso/notas/historial, guardas de
  borrado, cookies firmadas y textos de correo en diez idiomas.
- `npx tsx scripts/test-editorial-routes.mjs`: handlers reales y PostgreSQL;
  sesión/cookies/APIs de invalidación simuladas. Roles, CSRF, consentimiento,
  medios, incrementos atómicos y exclusión del equipo.
- `npx tsx scripts/test-editorial-ui.mjs`: componentes reales con ThemeProvider,
  estilos y skins, diez locales y 320/390/1280 px en claro/oscuro. `fetch` simulado,
  sin servidor. Aceptar/revocar, deduplicación, formulario e informe pasaron.
  Capturas `test-results/partnership/gate-*.png`, `editor-desktop.png`,
  `report-desktop.png` y `welcome-mobile.png` revisadas visualmente. No sustituyen
  la prueba de caché HTTP.
- Suites existentes: `test-episode-chapters`, `test-watch-date`,
  `test-series-tracking-status`, `test-tracking-backup`, `test-tracking-statistics`,
  `test-tracking-insights`, `test-tracking-database`, `test-tracking-history`,
  `test-series-curation`, `test-series-save`, `test-private-tracking-routes`.
- `npx tsx scripts/backup-db.ts --check-models`: los 78 modelos tienen cobertura.
- `npm run type-check`, `npm run lint`, `npm run build` contra DB local.

**Pendiente obligatorio antes de producción:** ejecutar
`scripts/test-editorial-flow.mjs` contra el build servido localmente en puerto
3018 (arranque manual mediante `scripts/serve-editorial-local.ps1`; secret de
prueba explicitado por el script). No se ejecutó en esta sesión:
la revisión automática bloqueó `npm start`, incluso restringido a loopback, sin
explicar otro motivo. El script prepara fixtures, verifica HTML/RSC, aceptación,
revocación, navegadores separados, invalidación tras reclasificar y APIs, y limpia
los datos al terminar. Requiere revisar además los screenshots resultantes y el
comportamiento móvil/claro/oscuro. No considerar este punto validado por el build.

Antes de desplegar: backup, revisión de Flor, aplicar migración con el procedimiento
del repositorio y recién después ejecutar el workflow de deploy. Un merge no
despliega. Repetir humo en producción sin campañas ni clics de prueba del equipo
computados como público. La propuesta comercial es un borrador independiente,
sin envío ni compromiso adquirido.

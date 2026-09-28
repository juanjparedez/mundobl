# Registro de entregas

Movido tal cual desde `context.md` el 2026-09-28. Describe cada entrega en su momento; lo vigente está en `context.md`.

### Comunidad y pertenencia: nueva entrega en curso (2026-09-27)

- El usuario autorizó un bloque mayor tras #103: listas/Top 5 privados, perfil público opt-in, conversaciones conectadas, seguimiento configurable, bloqueos, denuncias/moderación y métricas. Contrato y aceptación en [comunidad-pertenencia-plan.md](docs/comunidad-pertenencia-plan.md). Este alcance nuevo no reactiva otros proyectos ajenos de seguimiento.
- Rama `codex/comunidad-pertenencia`. Migración `20260928005043_community_belonging` aplicada únicamente a PostgreSQL local; ocho tablas nuevas con RLS, publicaciones existentes preservadas y nuevos temas privados por defecto. No aplicar en producción hasta completar interfaz y controles de la entrega.
- Helpers/API de listas, perfiles, preferencias de invitación, bloqueos y moderación implementados; exportación personal incluye Comunidad y borrado de cuenta elimina borradores privados. Pantallas de listas, Top 5, perfil opt-in e invitación discreta implementadas con textos en diez idiomas y pruebas de navegador a 1280/390 px. Pruebas de librería/privacidad, solicitudes y moderación en PostgreSQL local.
- Conversaciones: controles para seguir, activar avisos explícitamente y silenciar. Las respuestas notifican únicamente a seguidores que lo eligieron, respetando bloqueos recíprocos y cuentas suspendidas; ya no notifican automáticamente al creador. API para editar/publicar/retirar borradores con control de concurrencia, marcar respuestas leídas y guardar recomendaciones sin reemplazar progreso. `test-community-conversations.ts` y `test-community-flow.mjs` aprobados localmente; OAuth y entrega real de notificaciones no están cubiertos por el navegador de prueba.
- Conversaciones integradas: el compositor guarda borradores privados; su dueño puede editar/publicar/retirar. `/comunidad/mis-conversaciones` separa propias, borradores y seguidas con respuestas nuevas y marcado de lectura por página. `/comunidad/obras/[id]` filtra por obra/capítulo y preselecciona el contexto al crear; enlaces desde ficha, reproducción y comentarios de capítulos. Respuestas admiten una obra pública adjunta; listas y respuestas permiten guardarla en pendientes conservando progreso existente. Nuevos textos en los diez idiomas. `test-community-flow.mjs` verifica este recorrido con APIs/componentes reales y PostgreSQL local; `test-community-library-flow.mjs` confirma regresión de listas/perfiles/Top 5. TypeScript y ESLint focalizado aprobados, móvil/escritorio sin desbordamiento; falta prueba con el layout completo.
- Completados controles de denuncia/bloqueo, panel de moderación con motivos/auditoría, configuración ADMIN y métricas públicas. Moderadores ya no borran contenido ajeno por rutas heredadas; la revisión no permite leer borradores. Importación recupera listas/temas/presentación en privado sin reactivar publicación ni avisos; probadas idempotencia y concurrencia. Backup/restauración local verificó las 75 tablas con datos en los ocho modelos nuevos.
- Build y TypeScript aprobados; lint focalizado sin errores. Navegador con servidor Next de producción, AppLayout y JWT verificados recorrió listas privadas/publicación/retirada, guardado de recomendaciones, denuncia/moderación y borrador contextual; anchos 1280/390 sin desbordamiento ni errores de página. Google OAuth se reemplazó por sesiones locales firmadas; no se verificó entrega externa de notificaciones. Corregidos origen en NextURL para loopback y botones que redirigían al login durante la carga de sesión.
- Entrega: ver [comunidad-pertenencia-plan.md](docs/comunidad-pertenencia-plan.md) y [entrega del 28/09](docs/entrega-comunidad-2026-09-28.md). Falta CI remoto, backup/migración de producción y comprobación posterior al merge. No hay cambios de producción aplicados todavía. Preview deshabilitado para esta rama para concentrar la entrega en un único PR.

### Conversaciones de Comunidad (2026-09-27)

- Discusiones de series/capítulos, pedidos de reseñas y recomendaciones; respuestas, cierre/reapertura, moderación y notificaciones al autor. Feed con portadas, autores públicos, extractos sin spoilers, filtros y búsqueda. Pedidos de reseña abren el editor de la obra.
- Tablas CommunityTopic/CommunityReply con RLS y límites concurrentes por usuario. Migración aditiva `20260927175456_community_topics`: aplicar antes del despliegue. Backup ampliado a 67 tablas y restauración ensayada localmente.
- Alcance, pruebas y límites: [entrega de Comunidad](docs/entrega-comunidad-2026-09-27.md). Las pruebas integradas usan APIs y PostgreSQL reales con sesión de prueba; no prueban OAuth ni entrega real de notificaciones. No implica chat privado ni seguimiento de conversaciones.

### Estadísticas de reseñas y participación (2026-09-27)

- `/estadisticas` muestra `totalPublishedReviews`: reseñas PUBLISHED de cuentas no ADMIN sobre obras públicamente accesibles. Incluye catálogo y aportes con reproducción disponible; excluye borradores y obras ocultas. Cada versión por idioma cuenta como una reseña. Reutiliza `PUBLIC_REVIEW_SERIES` de `database.ts`, compartido con `getCommunityReviews`, para mantener el mismo criterio de acceso.
- `/admin/stats` muestra reseñas publicadas totales y con `publishedAt` en los últimos siete días, incluyendo equipo y obras ocultas al público. El endpoint de edición ya renueva `publishedAt` al publicar/guardar una reseña publicada: esta métrica representa publicaciones vigentes con esa fecha, no un historial inmutable de primeras publicaciones.
- Usuarios activos conserva el límite de 20 cuentas no bloqueadas y amplía las acciones de los últimos 30 días: seguimiento, reseñas publicadas, comentarios públicos, calificaciones y favoritos. Usa `updatedAt` salvo favoritos (`createdAt`); no incorpora visitas anónimas ni borradores/comentarios privados.
- ISR público reducido de seis horas a cinco minutos. El texto explica actualización al visitar tras ese intervalo y regeneración en segundo plano; no promete tiempo real ni refresco automático de una pestaña abierta. Textos nuevos en los diez idiomas.
- `scripts/test-community-statistics.ts` pasó contra PostgreSQL temporal PGlite con las migraciones existentes: alcance público/admin, fechas, borradores, ocultar obras y actividad sin seguimiento. `scripts/test-community-statistics-ui.mjs` pasó con componentes reales y API/sesión simuladas a 1280/390 px: contadores y usuario solo reseñas, sin desbordamiento. TypeScript y ESLint de archivos modificados aprobados. Sin cambios de schema, despliegue ni consulta de cantidades de producción.

**Entrega acotada del 2026-09-26:** ver [alcance integrado, validación y pendientes](docs/entrega-seguimiento-2026-09-26.md). El usuario pidió detener la expansión del plan y concentrar el trabajo existente en un PR, con merge cuando esté verificado. No reanudar automáticamente el objetivo amplio.

### Portabilidad del seguimiento (2026-09-26)

- `GET /api/user/account/export` incluye `seriesNotes` y `episodeNotes` privadas, además de los estados de serie, temporada y episodio. Las secciones nuevas son opcionales en el formato `schemaVersion: 1`.
- `POST /api/user/account/import` restaura esos tres niveles de progreso y las notas mediante `restoreTrackingBackup` en `database.ts` y el planificador puro `tracking-backup.ts`. Conserva fechas de visionado/última actividad y fechas del diario; rechaza fechas inválidas y referencias múltiples en un mismo estado.
- Es restauración por combinación: no reemplaza registros existentes, no crea contenido editorial y siempre usa el usuario de la sesión. La vista previa de seguimiento/notas descuenta duplicados tanto de la cuenta como del archivo. Estas tres secciones se guardan juntas en una transacción; las restantes secciones del importador conservan su flujo anterior.
- La vista previa en ProfileSettings identifica las secciones en los 10 idiomas y muestra advertencias de referencias ausentes y registros inválidos. Los errores de validación de notas no incluyen su contenido.
- Ver `docs/seguimiento-respaldo.md` para formato y límites. Prueba sin base de datos: `npx tsx scripts/test-tracking-backup.ts`. La importación por títulos/CSV/IA, la edición con conflictos y el historial de vueltas siguen pendientes.

### Espacio de seguimiento (2026-09-26)

- `/watching` usa `CurrentlyWatchingDashboard/` con búsqueda, filtros Viendo/Retomar, orden, vistas lista/tarjetas y series fijadas. Las preferencias se guardan por usuario en este dispositivo, sin sincronización entre dispositivos.
- `WatchingSeriesCard` marca el siguiente capítulo; solo envía las partes todavía no vistas. `WatchingEpisodeDrawer` reutiliza el control de progreso y temporadas existente, y hace explícitas las acciones Nota privada y Conversación pública. El diario existente aparece como segunda pestaña.
- `watching-collection.ts` concentra selección y progreso. Conserva la convención de próximo capítulo posterior al último marcado; si quedan huecos anteriores se informa, sin anunciar una serie completa. Las estadísticas de esta pantalla se limitan a series en curso.
- `/api/currently-watching` selecciona los campos necesarios sin reseñas ni observaciones editoriales. El diario privado usa `no-store` y enlaza los aportes USER_EMBED a `/ver`, incluyendo el episodio cuando corresponde.
- Pruebas: `npx tsx scripts/test-watching-collection.ts` y `node scripts/test-watching-ui.mjs`. La segunda necesita el servidor local en 3100 y Playwright; intercepta todas las APIs con datos sintéticos y comprueba marcado, partes, preferencias, notas, comentarios y diseño móvil. No valida persistencia real en PostgreSQL ni producción.
- Pendientes: historial de eventos/vueltas y edición de fechas, biblioteca con todos los estados, preferencias sincronizadas y espacio de comunidad. El diario de notas no equivale a un historial completo de visionado.

### Referencias editoriales en aportes (2026-09-26)

- Corrección del comportamiento histórico de `/api/colaborador/series/[id]` y `/api/user/series/embed/confirm`: estos flujos ahora solo asocian actores, etiquetas, géneros, productoras, idiomas y países existentes. No ejecutan altas ni actualizaciones sobre esas entidades compartidas, incluso si los invoca un administrador. La gestión editorial mantiene sus endpoints propios.
- `getContributionMetadata` en `database.ts` consulta las referencias; `contribution-metadata.ts` resuelve nombres sin distinguir mayúsculas, deduplica asociaciones y rechaza nombres ausentes o ambiguos. El rechazo 422 ocurre antes de mutar y los formularios conservan sus valores con una explicación persistente traducida a diez idiomas. Los nombres nuevos aún requieren incorporación editorial; no se crea una propuesta automática.
- `GET /api/contribution-metadata` requiere sesión, acepta solo cinco tipos permitidos y devuelve hasta 30 nombres por búsqueda. `ContributionMetadataField` reutiliza Ant Design Select en los formularios público y de colaborador, con búsqueda remota, cancelación de consultas y reintento. El selector permite elegir entidades existentes; no dar de alta vocabulario.
- El guard de colaboradores exige propiedad + `USER_EMBED` + `WATCHABLE_ONLY`. PATCH de ficha vuelve a comprobar esos campos en el UPDATE dentro de la transacción, incluso en ediciones que solo cambian relaciones. El alta pública guarda ficha, asociaciones, temporada, episodio y estado de seguimiento en una transacción.
- Pruebas sin base real: `node scripts/test-contribution-boundary.mjs` ejecuta los handlers con dependencias simuladas; `node scripts/test-contribution-metadata-ui.mjs` monta el selector real en Ant Design Form y lo prueba con Playwright. No prueban concurrencia real de PostgreSQL ni constituyen una auditoría de todos los permisos editoriales.

### Fechas del seguimiento y pruebas SQL (2026-09-26)

- `tracking.ts` ya no vuelve a fechar el último episodio de un lote ni una marca repetida. `markManyWatched` devuelve cuántos estados cambiaron; solo un cambio real avanza la última actividad y reanuda RETOMAR. Se conservan las fechas históricas y `null` de importaciones. Desmarcar y volver a marcar sí genera una fecha nueva; todavía no almacena múltiples visionados.
- `scripts/local-prisma-db.mjs` levanta PGlite en memoria sobre loopback, usando dependencias instaladas de Prisma. `scripts/prisma-test-runtime.mjs` limita el cliente de prueba a una conexión. No cambian la configuración ni los datos de producción.
- Se reconstruyeron las 47 migraciones y `db:check` dio cero diferencias. `test-progress.ts` y `test-tracking-database.ts` pasaron con SQL real sobre este entorno: fechas, aislamiento de cuentas, restauración sin sobrescrituras y referencias editoriales. El caso de fallo SQL/rollback se omite explícitamente en PGlite por una limitación de su transporte; requiere PostgreSQL nativo. La concurrencia nativa y el historial real siguen pendientes. Ver `docs/seguimiento-pruebas-locales.md`.

### Historial privado de cambios (2026-09-26)

- `TrackingEvent` registra cambios de estado/fecha mediante un trigger transaccional de ViewStatus. Los reintentos idénticos no generan eventos. La migración `20260926192040_tracking_event_history` conserva estados anteriores como SNAPSHOT, sin inventar fechas de visionado ni acciones pasadas.
- `/api/user/tracking-history` exige sesión, filtra por propietario, pagina por fecha/id y permite borrar solo el historial. La pestaña Historial de seguimiento ofrece búsqueda, paginación y borrado confirmado. Los aportes enlazan a `/ver`. Textos en diez idiomas.
- Exportación personal, importación y reset incluyen eventos. IDs deduplicados por cuenta; el usuario del archivo no determina propiedad. Restauraciones con eventos suprimen el trigger solo dentro de esa transacción. El backup global cubre 63 modelos.
- PostgreSQL nativo local 18.4: migración generada/aplicada con migrate dev y sombra; pruebas de historial, reintentos concurrentes, rollback, progreso, importación y backup/restauración de 63 tablas aprobadas. UI Playwright aprobada con APIs simuladas. No se migró producción.
- Este historial describe cambios de seguimiento; no equivale a múltiples visionados. Siguen pendientes vueltas explícitas, edición de fecha en UI, estadísticas derivadas y comunidad agregada.

## Feedback de Flor (2026-09-15)

### Backups y QA (2026-09-15)

- Integrada la corrección del cron: escrituras independientes en tandas paralelas de diez.
- QA incluye smoke tests de lectura y anuncio de los ocho sitemaps en robots.txt.
- Backup JSON: 62 modelos, cobertura contra schema, lectura RepeatableRead y error con exit code distinto de cero. Restaurador solo local y sobre tablas vacías; CI verifica restauración con datos sintéticos.
- Bucket privado `mundobl-backups` creado. Secrets de Actions pendientes; el workflow diario exige la variable `BACKUPS_ENABLED=true`. Ver `docs/backups.md` antes de activarlo.

### Cambios del catálogo

- Perfil: Recientemente completadas muestra tres títulos y abre un modal con la lista completa, paginada de a 20. La API de perfil ya no corta ese listado a ocho registros.
- Catálogo: Retomar y Abandonada filtran el estado del usuario autenticado. GET /api/view-status conserva su respuesta original por defecto; ?all=true devuelve pares seriesId/status. Helper getUserSeriesStatuses en database.ts.
- Notas privadas de serie/episodio: pie flexible con separación y salto de línea; la fecha no pisa el contador.
- Ficha pública: un solo bloque Dónde ver, etiquetas de información de 160px en escritorio. Doramasflix disponible en el formulario; Spotify ya estaba soportado como WatchLink.
- Universo: Series.isUniverseMain identifica historia principal y portada. saveSeriesInUniverse serializa por universo y cambia la principal en una transacción; índice único parcial evita dos principales. Elegir otra principal reemplaza a la anterior; quitar universo limpia la marca. El catálogo prioriza esa serie como portada (si no hay principal visible, mantiene orden cronológico).
- Temporadas en Información: para series dentro de un universo, se cuentan los miembros de tipo serie y se muestra la posición de la ficha. getPublicUniverseSeries excluye aportes USER_EMBED, WATCHABLE_ONLY y HIDDEN; ordena principal, año, título, id. Películas y especiales no suman temporadas. La sección de episodios mantiene las temporadas internas propias de la ficha.
- Basado: se corrigió la interpretación del pedido: `manga` es válido; `Manga` es una variante duplicada. Las sugerencias vuelven a incluir manga usando la escritura más frecuente. GM continúa fuera de las sugerencias, pero todos los valores exactos se pueden gestionar en `/admin/tags?tab=based-on` (solo ADMIN).
- El directorio de Basado muestra cantidades y fichas por valor exacto. Permite renombrar, fusionar con otro valor existente y quitar la clasificación (null, sin borrar fichas). Antes de aplicar muestra las fichas afectadas; una transacción Serializable verifica sus IDs y rechaza listas desactualizadas. No necesita migraciones ni una tabla adicional: los valores nuevos nacen al editar fichas.
- POST/PUT de series reutilizan la escritura existente más frecuente sin distinguir mayúsculas ni espacios repetidos. PUT conserva basedOn cuando el payload no lo incluye. La gestión invalida catálogo y fichas. Ninguna reclasificación de producción se ejecuta como parte del despliegue.

### Metadata y expectativas de disponibilidad (2026-09-26)

- Fichas `/series/[id]`: título y descripción ofrecen información y seguimiento, sin prometer reparto completo, reseñas, subtítulos ni reproducción. Keywords se limitan a títulos, etiquetas y géneros presentes.
- `/ver` y sus fichas: eliminado el anuncio general de series completas y subtítulos en español. Se explicita que disponibilidad, idiomas y episodios dependen de cada fuente. Metadata de una ficha sin episodios publicables devuelve notFound, igual que su contenido.
- Nuevos textos `contentMetadata` en los diez locales. Las rutas públicas conservan español como idioma de metadata, sin añadir cookies que vuelvan dinámico su ISR. TypeScript y ESLint comprobados; pendiente comprobar el HTML renderizado y auditar el resto de superficies de descubrimiento.

### Portada: alcance público y fechas (2026-09-26)

- Las últimas fichas, novedades semanales, reseñas destacadas y contadores relacionados al catálogo usan un filtro común CURATED + PERSONAL + VISIBLE. Una ficha oculta no debe anunciarse en la portada ni aportar una reseña destacada allí.
- El contador semanal de episodios usa watchedDate dentro de los últimos siete días y hasta el presente; updatedAt no demuestra visionado reciente. Fechas desconocidas, antiguas o futuras no se cuentan como visionados de esta semana. El conteo sigue siendo de registros de episodio, no de vueltas ni capítulos agrupados por partes.
- Los títulos completos de fichas usan metadata.title.absolute para evitar repetir MundoBL al aplicar el template del layout.
- TypeScript y ESLint aprobados. No se cambió producción; queda pendiente la verificación de HTML y auditoría de visibilidad del resto de consultas públicas.

### Catálogo público y comprobación HTTP (2026-09-26)

- `/catalogo` filtra VISIBLE; su índice de filtros también excluye fichas ocultas. Nueva clave de caché v4 para no reutilizar listados anteriores. `getAllSeries` acepta visibilidad explícita y conserva su uso administrativo sin filtro.
- `getSeriesById`, helper público, exige CURATED + PERSONAL + VISIBLE. El workspace administrativo usa `getSeriesByIdAdmin`, conservando acceso editorial a fichas ocultas bajo el guard existente del proxy.
- HTTP local de `/ver` comprobado: título «Series BL y GL para ver | MundoBL» y descripción sobre disponibilidad/idiomas variables. HTML de detalles aún pendiente: el rol local de lectura no tiene políticas RLS que permitan ver las fichas sintéticas. La revisión automática rechazó BYPASSRLS; no se aplicó. No se tocaron permisos remotos ni producción.

### Estadísticas personales: fechas verificables (2026-09-26)

- El calendario semanal y el heatmap de `/api/user/profile` usan watchedDate, no updatedAt. Excluyen fechas desconocidas/futuras, otros usuarios, estados no vistos y marcas de serie sin episodio. Las fechas antiguas no pasan a contar hoy al importar o editar un registro.
- Recientemente completadas ordena por fecha de visionado, con desconocidas al final, y devuelve completedAt nullable real. No se usa updatedAt como sustituto. La racha recorre días UTC, consistente con las claves ISO del calendario.
- `scripts/test-profile-watch-dates.mjs` ejecuta las dos consultas SQL reales del handler contra una tabla temporal de la sesión en PostgreSQL local. Prueba reciente/antigua/desconocida/futura, aislamiento entre cuentas y tipos de marca; rollback elimina la fixture. Pasó sin cambiar permisos ni tablas de aplicación. TypeScript y ESLint también pasan.
- Pendiente: conteo de capítulos agrupados en las estadísticas globales del perfil, duraciones desconocidas explícitas y múltiples vueltas de visionado. La prueba SQL no equivale a validar el endpoint HTTP autenticado completo.

### Estadísticas personales: capítulos divididos (2026-09-26)

- El total de episodios de `/api/user/profile` ahora agrupa capítulos con el mismo helper que seguimiento. Requiere todas sus partes registradas vistas y mantiene cada serie separada. Se consultan también las partes no vistas de las series con alguna marca, evitando considerar completo un capítulo parcial.
- `countWatchedChapters` reutiliza groupIntoChapters; no representa vueltas ni certifica partes que aún faltan en el catálogo. Respeta la clasificación de extras existente del agrupador.
- `scripts/test-profile-chapters.ts` pasó: partes completas/parciales, trailer en playlist numerada, temporadas distintas, capítulos sin título y colección vacía. TypeScript y ESLint pasan. La verificación del endpoint autenticado y el coste sobre bibliotecas grandes siguen pendientes.

### Perfil: destinos de catálogo y reproducción (2026-09-26)

- `getContentUrl` centraliza destino por origin/catalogScope: USER_EMBED o WATCHABLE_ONLY abren `/ver`; las fichas curatoriales del catálogo abren `/series`, con slug del título.
- Favoritas, en curso, completadas, mejor valoradas, reseñas y suscripciones del perfil usan este helper. API de perfil/suscripciones y tipos incluyen origin/catalogScope; la consulta SQL de mejor valoradas los devuelve también. Se conserva el ancla de reseñas del catálogo.
- TypeScript y ESLint aprobados; no se cambian permisos ni contenido editorial. Pendiente recorrido visual autenticado y revisión de otros enlaces fuera del perfil.

### Marcado manual de series: reintentos (2026-09-26)

- El endpoint de estado de serie usa `setSeriesTrackingStatus` dentro de una transacción. Crear con skipDuplicates y actualizar solo estados distintos evita refechar marcas idénticas, incluyendo VISTA con watchedDate desconocida. Una transición real conserva el comportamiento previo de fechas.
- Primera suscripción y estado se guardan juntos; un reintento no vuelve a activar avisos deshabilitados. El trigger del historial no genera eventos para estados idénticos.
- `test-series-tracking-status.ts` pasó sobre PostgreSQL nativo local: cuatro primeras marcas concurrentes producen un evento, fechas históricas/desconocidas se preservan, desmarcar/remarcar fecha de nuevo, última actividad estable y sin resuscripción. Fixtures eliminadas al terminar. TypeScript y ESLint aprobados. No se migró ni desplegó producción.

### Primera entrada de comunidad (2026-09-26)

- Nueva `/comunidad`, accesible desde la navegación compartida escritorio/móvil. Lista las últimas 30 reseñas PUBLISHED de fichas VISIBLE y enlaza a su destino público según origin/catalogScope. No incluye estados de seguimiento, notas, emails ni borradores.
- Los títulos de reseñas con hasSpoilers se eliminan del DTO en servidor antes de enviarlo al cliente. La UI muestra aviso traducido. Texto e interfaz en diez idiomas; estado vacío y acceso al catálogo.
- Render dinámico para consultar el estado de publicación en cada visita. Falta invalidación en clientes ya abiertos, paginación, búsqueda y conversaciones/recomendaciones agregadas; no es un chat ni completa el objetivo de comunidad.
- TypeScript y ESLint aprobados. Navegador local verificó página vacía en móvil sin desbordamiento horizontal, captura `test-results/community-mobile.png`; revisión visual realizada. El feed poblado y sus límites de publicación requieren prueba adicional. Sin despliegue.

### Comunidad: límites públicos verificados (2026-09-26)

- El feed exige un destino público existente: ficha CURATED + PERSONAL o al menos un episodio publicable para `/ver`, además de visibilidad VISIBLE. No anuncia aportes vacíos cuya ficha de reproducción devolvería 404.
- Fechas publishedAt desconocidas quedan al final, sin desplazar reseñas fechadas recientes.
- `test-community-privacy.ts` pasó sobre PostgreSQL local con fixtures eliminadas al terminar: publicaciones visibles incluidas, borradores/fichas ocultas/aportes sin episodios excluidos, títulos spoiler eliminados del DTO, sin cuerpo ni email y retirada de reseña reflejada en la siguiente consulta. También verifica destino `/ver` de aportes. Esto prueba el helper SQL real; sigue pendiente UI poblada y recorrido HTTP autenticado completo.

### Comunidad: UI poblada (2026-09-26)

- `test-community-ui.mjs` monta CommunityFeed, LocaleProvider, traducciones y componentes reales con contenido sintético. Comprueba aviso de spoilers, enlaces `/series` con ancla y `/ver`, tres tarjetas y ausencia de overflow a 1280/390px. Pasó sin errores de navegador.
- Capturas pobladas en test-results, inspeccionadas visualmente. El montaje aislado usa los tokens reales de tema; no valida autenticación ni consultas del backend, que se prueban por separado.
- Los enlaces de lectura incluyen el título de la serie en su nombre accesible, para distinguirlos con lectores de pantalla.

### Comunidad: reseñas anteriores accesibles (2026-09-26)

- `/comunidad?page=N` muestra páginas de 30 reseñas con navegación Anterior/Siguiente y canonical propio. Consulta una fila adicional para saber si hay siguiente página. Valores inválidos y páginas vacías posteriores a la primera devuelven notFound.
- `getCommunityReviews(page)` mantiene todos los filtros públicos y devuelve items/hasNext. Orden por publicación e ID. Paginación por offset: nuevas publicaciones o retiradas pueden desplazar filas entre visitas; no se presenta como una instantánea inmutable.
- Prueba PostgreSQL ampliada con 31 reseñas: límite de 30, siguiente página, ninguna repetida en datos estables, todas alcanzables y rechazo de página cero. UI comprueba enlaces de anterior/siguiente en el componente real. TypeScript y ESLint aprobados.

### Comunidad: búsqueda por serie (2026-09-26)

- Formulario GET por título de serie, sin distinguir mayúsculas. El término se conserva en la URL y en Anterior/Siguiente; una nueva búsqueda vuelve a página uno. Input accesible y botón Ant Design, texto en los diez locales.
- El filtro se aplica en la consulta antes de paginar, mantiene publicación/visibilidad/destino válido y no busca cuerpos ni títulos con spoilers. Máximo 100 caracteres, validado también en servidor. Resultados de búsqueda marcados noindex/follow para no generar páginas SEO por cada término.
- Pruebas SQL: coincidencia sin distinguir mayúsculas, consulta sin resultados, contenido oculto y rechazo de longitud excesiva. Prueba UI real: query con caracteres especiales preservada al paginar y formulario GET que restablece la página. Ambas aprobadas, además de TypeScript y ESLint. Sin despliegue.

### Corrección de fecha por API (2026-09-26)

- `PATCH /api/user/watch-date` requiere sesión y acepta exactamente un seriesId/seasonId/episodeId, watchedDate `YYYY-MM-DD` o null y expectedDate ISO exacto o null. La identidad proviene exclusivamente de la sesión.
- Solo modifica filas VISTA del propietario cuya fecha actual coincide con expectedDate. Conflicto, fila ausente o no vista -> 409; input inválido -> 400. No cambia estado, última actividad ni suscripción; el trigger registra DATE_CHANGED privado. Fecha futura/calendario imposible rechazados; días elegidos se guardan a medianoche UTC.
- `test-watch-date.ts` pasó en PostgreSQL nativo local: validación, aislamiento, dos correcciones simultáneas (solo una gana), fecha desconocida, estado preservado e historial sin duplicar por reintento idéntico. TypeScript y ESLint aprobados.
- Falta conectar el editor de fecha a la UI; esta entrega habilita la operación de servidor, no una interfaz terminada. La fecha previa exacta está disponible en el export personal. No se desplegó.

### Editor de fechas en episodios (2026-09-26)

- EpisodeChapterList ofrece el botón de calendario para capítulos con partes vistas y sesión iniciada. Abre WatchDateEditor con selector de parte; cada parte conserva su propia fecha. Disponible también dentro del drawer de /watching.
- GET /api/user/watch-date consulta solo la marca VISTA de la cuenta actual, sin cache. El modal carga la fecha antes de editar, permite día UTC o desconocida y envía el timestamp anterior completo. Conflicto conserva el formulario y exige recargar; durante guardado se impide cerrar accidentalmente.
- Textos nuevos en diez idiomas; Ant Design, CSS separado y labels por props. `test-watch-date-ui.mjs` pasó con componente real/APIs simuladas: carga histórica, corrección, desconocida, conflicto y ancho móvil. Captura inspeccionada. TypeScript y ESLint aprobados. Sigue pendiente edición visual de fechas de serie/temporada y recorrido autenticado completo.

### Fecha de finalización desde la ficha (2026-09-26)

- TrackingPanel muestra Corregir fecha de visionado cuando la serie/película está VISTA, incluso sin episodios cargados. Usa el mismo WatchDateEditor que las partes de capítulos.
- El editor recibe targets tipados (serie/temporada/episodio) en vez de asumir episodeId. Mantiene GET privado, comparación de fecha previa, desconocida y protección ante conflictos. No cambia el progreso de episodios al corregir la fecha de la serie.
- Prueba de navegador ampliada: guardar una fecha de película envía seriesId y el timestamp previo exacto; los casos de episodio siguen pasando. TypeScript y ESLint aprobados. Temporadas aún no tienen botón propio. Sin despliegue.

### Seguimiento: recorrido integrado actualizado (2026-09-26)

- `test-watching-ui.mjs` abre el editor real de fecha desde el drawer de episodios de /watching, corrige una fecha histórica y verifica el PATCH con episodeId/fecha previa exacta. Comprueba que la colección y su progreso permanecen iguales, después continúa con nota privada y comentario público.
- La ejecución completa pasó tras integrar el editor generalizado: marcado de capítulos/partes, destinos /ver, fijados/vista persistidos, editor, diario, historial y borrar historial conservando progreso/notas, móvil sin overflow y tema claro.
- Todas las APIs de esta prueba se interceptan. Demuestra integración visual entre componentes, no el flujo autenticado completo contra PostgreSQL. Las reglas SQL se validaron por separado; siguen pendientes la comprobación conjunta del endpoint con sesión real, build de producción y despliegue.

### Handlers privados y persistencia conjunta (2026-09-26)

- `test-private-tracking-routes.mjs` ejecuta el código real de GET/PATCH watch-date y GET/DELETE tracking-history con helpers y PostgreSQL reales. Solo sustituye requireAuth para elegir identidades de prueba.
- Pasó: 401 sin sesión; 404/409 al intentar fechas ajenas; userId enviado por query/body ignorado; historial ajeno invisible y no borrable; corrección válida crea DATE_CHANGED; fecha desactualizada -> 409; fecha imposible -> 400; Cache-Control privado/no-store; borrar historial conserva VISTA.
- Fixtures propias eliminadas al terminar. No modifica políticas RLS ni permisos. Complementa las pruebas de UI con APIs simuladas, pero no prueba OAuth/cookies ni el transporte HTTP real con sesión.

### Horas de seguimiento con cobertura explícita (2026-09-26)

- `/api/user/profile` suma durationSeconds positivos, con fallback a duration positivo en minutos. Valores ausentes/cero/negativos no suman. Devuelve unknownDurationVideos para explicar la cobertura; no estima duraciones desconocidas.
- Ambos strips del perfil muestran Horas con duración registrada y, si corresponde, cantidad de videos vistos excluidos. Conservan el decimal de horas en vez de redondear otra vez a entero. Textos en diez idiomas.
- La prueba SQL del perfil usa también la consulta real de duración sobre tablas temporales: segundos prevalecen sobre minutos, fallback correcto, duraciones inválidas contadas como desconocidas y aislamiento por usuario/estado. Pasó. TypeScript y ESLint aprobados; revisión visual de estos nuevos textos pendiente.

### Cobertura de duración legible (2026-09-26)

- Las etiquetas de los dos strips ya no usan ellipsis; el aviso de videos sin duración tiene clase propia con salto de línea y tipografía normal. El strip fijo usa una grilla adaptable al ancho disponible, evitando apretar doce métricas en una sola fila.
- `test-profile-duration-ui.mjs` monta ambos componentes reales con datos sintéticos y prueba texto de cobertura, decimales, ausencia de recortes/desbordamiento a 1280 y 390 px. Pasó con reset border-box equivalente al global de la aplicación; capturas inspeccionadas. ESLint aprobado. No valida el transporte HTTP del perfil.

### Vistos este año según el seguimiento (2026-09-26)

- Corregida la métrica anual del perfil: antes leía completedByYear, agrupado por año de estreno. Ahora calcula completedThisYear desde watchedDate de las series VISTA y publica activityYear UTC para que el label use el mismo año que el servidor. Sin nueva consulta: reutiliza las filas de completadas.
- El desglose por años de estreno conserva su significado independiente. Fechas desconocidas, de años anteriores o futuras no cuentan como finalizadas este año.
- `test-tracking-statistics.ts` pasó límites de año/desconocidas/futuras. Prueba visual de ambos strips usa dos finalizaciones frente a 99 estrenos y comprueba que muestra dos. TypeScript y ESLint aprobados. Sin despliegue.

### Compilación integral de seguimiento (2026-09-26)

- `npm run build` terminó con código 0 contra PostgreSQL local mundobl_replay, sobrescribiendo DATABASE_URL y DIRECT_URL para evitar la base remota. Prisma generó el cliente, webpack compiló, TypeScript pasó y Next generó las 161 páginas estáticas. Log local ignorado: test-results/production-build.log.
- No hizo falta cambiar next.config.ts: la versión instalada separa el directorio de desarrollo `.next/dev` del build de producción. No se desplegó ni se modificaron permisos de la base.
- El lint integral inicial terminó sin errores y con 199 avisos; 191 correspondían al formato de las traducciones nuevas en messages.ts. Se aplicó Prettier únicamente a ese archivo.
- La segunda ejecución de `npm run lint` terminó con código 0: cero errores y ocho avisos en archivos ajenos a estos cambios (SeriesMetadataTab, GlosarioClient y email). Log local: test-results/full-lint.log.
- La compilación no demuestra OAuth ni el recorrido HTTP autenticado completo. Continúan pendientes esos controles y las funcionalidades del objetivo general todavía no implementadas.

### Privacidad de bloques editoriales (2026-09-26)

- La auditoría encontró que GET /api/series/[id]/info-blocks devolvía bloques de fichas HIDDEN sin sesión. Ahora usa getReadableSeriesInfoBlocks: público solo VISIBLE; ADMIN/MODERATOR conservan acceso editorial; COLLABORATOR puede leer HIDDEN únicamente si es dueño del aporte USER_EMBED/WATCHABLE_ONLY. Sesiones rechazadas no obtienen privilegios. Respuesta private/no-store.
- La condición de visibilidad/propiedad forma parte de la consulta SQL de los bloques. Ocultar una ficha o cambiar el alcance del aporte revoca el acceso en la siguiente lectura. ID inexistente y ficha inaccesible devuelven la misma lista vacía.
- test-info-block-privacy.mjs pasó con el handler real y PostgreSQL nativo local; solo simula la resolución de sesión. Incluye acceso anónimo/otro colaborador/dueño/editor, cambio de alcance, ocultar/publicar, orden e IDs inválidos. Fixtures eliminadas. TypeScript y ESLint aprobados.
- La política editorial general sigue pendiente: actualmente MODERATOR puede modificar series y taxonomías en otros endpoints. Se consultó al usuario si quiere exclusividad de Flor o delegación a ADMIN; no se asumió una identidad de Flor ni se alteraron esos roles. Este arreglo de lectura no demuestra control exclusivo de todo el catálogo. Sin despliegue.

### Corrección de fecha de temporadas (2026-09-26)

- SeasonsList ofrece el editor de fecha dentro de cada temporada VISTA para cuentas con sesión. Usa WatchDateEditor con seasonId y textos ya traducidos; mantiene fecha desconocida y comparación de la fecha previa. No requiere modificar capítulos.
- test-season-watch-date-ui.mjs monta SeasonsList y WatchDateEditor reales: abre desde la temporada, verifica PATCH con seasonId/fecha previa exacta, ausencia de acción para temporada sin ver/invitados y ancho móvil. APIs, sesión y estado simulados; paneles hijos ajenos al flujo omitidos. Captura con tema oscuro inspeccionada.
- test-watch-date.ts ampliado y aprobado en PostgreSQL nativo local: corregir temporada crea DATE_CHANGED y conserva fecha/estado del episodio y estado de la serie. TypeScript y ESLint aprobados. Sin despliegue ni prueba OAuth completa.

### Historial: destinos y días coherentes (2026-09-26)

- getTrackingHistory usa getContentUrl incluyendo catalogScope: CURATED/WATCHABLE_ONLY también enlaza a /ver; CURATED/PERSONAL a /series. Antes solo diferenciaba origin, generando enlaces al catálogo para contenido exclusivo de reproducción.
- TrackingHistory presenta watchedDate y previousWatchedDate como días UTC, coherentes con el editor. Una fecha elegida a medianoche UTC ya no aparece como el día anterior en Argentina. recordedAt conserva fecha/hora local para identificar cuándo ocurrió el cambio.
- test-tracking-history.ts pasó en PostgreSQL nativo verificando destinos después de cambiar origin/scope. test-watching-ui.mjs pasó completo con zona America/Argentina/Buenos_Aires, fechas actual/anterior a medianoche, desconocidas, paginación y borrado. APIs de navegador simuladas. TypeScript y ESLint aprobados. Sin despliegue.

### Créditos de guion: base de datos (2026-09-26)

- Modelos Writer y SeriesWriter: identidad, alias, nacionalidad, biografía, referencias externas, foto con procedencia/atribución/licencia y fuente de cada crédito. Rol separado de Director; no se fabricaron ni migraron nombres por inferencia.
- Migración 20260926204755_writer_credits generada con migrate dev --create-only, completada con RLS para ambas tablas y aplicada mediante migrate dev en mundobl_replay/shadow locales. Cliente generado; db:check sin diferencias. No se cambió ninguna base remota.
- getWriterById devuelve datos públicos y créditos de series VISIBLE del catálogo o con reproducción disponible, con enlaces según origin/scope. Excluye notas editoriales, obras ocultas y aportes sin reproducción.
- test-writer-credits.ts pasó en PostgreSQL: fuentes, privacidad, destinos, unicidad, borrado en cascada conservando la persona y RLS habilitado. Fixtures eliminadas. TypeScript y ESLint aprobados.
- Backup completo actualizado y ejecutado localmente: 65 tablas, incluidas Writer/SeriesWriter. La restauración con las nuevas tablas todavía no se ensayó. Faltan editor, ficha pública, enlaces desde series y traducciones para guionistas; el modelo no equivale a la funcionalidad terminada. Sin despliegue.

### Ficha pública de guionistas (2026-09-26)

- Nueva ruta dinámica /guionistas/[id], IDs validados, 404 de inexistentes y metadata sin promesas de reproducción. Usa el criterio de completitud de personas para noindex de fichas escasas; consulta actual para reflejar visibilidad de créditos.
- WriterProfile presenta identidad, alias, biografía, atribución/licencia de imagen, referencias y fuente de cada crédito. Obras distinguidas como ficha/seguimiento o episodios para ver con su destino correcto. URLs externas limitadas a HTTP/HTTPS. Textos nuevos en diez idiomas; CSS separado y PanelCard/AntD.
- test-writer-profile-ui.mjs pasó con componente real y datos sintéticos: fuentes, destinos, bloqueo de javascript: y móvil sin overflow. TypeScript y ESLint aprobados. Revisión de captura detectó compresión del avatar; se corrigió flex-shrink.
- Pendientes: editor de personas/créditos, enlaces desde fichas de obras e índice de guionistas; no hay contenido real cargado ni despliegue. La prueba visual no valida transporte HTTP con PostgreSQL.

### Navegación obra–guionista (2026-09-26)

- Las páginas /series/[id] y /ver/[id] incluyen WriterCredits cuando hay créditos cargados. Cada nombre enlaza a /guionistas/[id]; sin créditos no se muestra panel vacío. Componente compartido con textos existentes traducidos, PanelCard y CSS separado.
- getPublicWriterCredits consulta únicamente IDs/nombres y exige visibilidad VISIBLE. test-writer-credits.ts ampliado pasó sobre PostgreSQL local para catálogo, aportes y exclusión de ocultos.
- Prueba visual de guionistas ampliada: un solo panel para fixture con créditos más fixture vacía, destino /guionistas/1 y móvil sin overflow. TypeScript y ESLint aprobados. No hay aún editor de carga ni contenido real; sin despliegue.

### Restauración completa con guionistas (2026-09-26)

- Creada una base local nueva mundobl_restore_writer_20260926 en 127.0.0.1:55433, reconstruida con las 49 migraciones. No se borró ninguna base anterior ni se modificaron roles/RLS.
- test-backup-restore.ts ahora admite destinos locales con prefijo mundobl_restore_, agrega fixtures Writer/SeriesWriter con alias Unicode, atribución y fuentes, comprueba también la secuencia Writer y elimina sus propias fixtures del origen al terminar.
- Ensayo aprobado: 65 tablas idénticas fila por fila, restricciones activas, secuencias válidas y rechazo de destino ocupado. El destino queda ocupado como evidencia; no se puede repetir sobre él sin elegir otro destino vacío. El resultado sustituye la pendiente anterior sobre restauración de las tablas nuevas. No valida infraestructura remota ni despliegue.

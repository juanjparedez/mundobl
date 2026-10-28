# MundoBL - Contexto del Proyecto

Catalogo personal de series asiaticas (BL/GL y otros generos). Aplicacion full-stack para gestionar, calificar y hacer seguimiento de series, peliculas, cortos y especiales.

## Optimización Mobile UX/UI - Fase 2: Cobertura Integral del Sitio (2026-10-26)

- **Comunidad (`/comunidad/*`)**:
  - `CommunityFeed`: feed responsive a `<= 600px` con padding optimizado, filtro de categorías con snap horizontal deslizable (`scroll-snap-type: x mandatory`), buscador táctil y botones de paginación/acciones en columna táctil de 44px.
  - `CommunityCard` y `RecommendationCard`: diseño adaptativo en `<= 600px` con póster proporcional de 72px/104px y recorte fluido de sinopsis para evitar saltos de línea irregulares.
  - `CommunityThread`: cabecera y cuerpo de hilo sin desbordes, espaciado táctil en respuestas y textarea con font-size de 16px para prevenir zoom automático indeseado en iOS Safari.
  - `CommunityNavigation`: barra de navegación comunitaria transformada en pill strip deslizable horizontal sin scrollbar visible.
  - `CommunityComposer`, `CommunitySpace`, `RecommendationContents`, `PersonalCommunityTopics`: layouts responsivos adaptados a 1 columna o filas elásticas, evitando solapamiento de badges o truncamiento de texto.
- **Noticias & Glosario (`/noticias`, `/noticias/[id]`)**:
  - Eliminación total de valores hexadecimales hardcodeados (`#888`, `#333`, `#ede9fe`, `#38bdf8`, etc.), migrando a tokens del sistema dinámico (`--text-secondary`, `--primary-color`, `color-mix`, etc.).
  - Portada de noticias en aspect ratio 16:9 (`56.25%`), lectura limpia con márgenes ajustados a mano alzada y botones de llamada a la acción ("Leer original", "Ver serie") a 44px de alto.
- **Personas, Entidades & Plataformas (`/actores`, `/directores`, `/guionistas`, `/productoras`, `/plataformas`, `/tags/[id]`)**:
  - `people-grid`: en `<= 600px` se reemplaza la columna única gigante por una grilla compacta de 2 columnas (155px mínimo) para navegar ágilmente más de 1.200 perfiles sin scroll interminable.
  - `PersonCard`: avatar táctil de 38px, títulos en 2 líneas y tap target mínimo de 52px.
  - `PeopleFilters`: buscador al 100% y selectores de orden/nacionalidad repartidos al 50% en fila dual simétrica.
  - Fichas individuales (`director-profile`, `WriterProfile`, `company-profile`, `tag-page`): headers centrados con avatars proporcionados (80px), filmografía en grilla de posters compactos y saneamiento de tokens.
  - `plataformas`: tarjetas de suscripción adaptadas a pantalla móvil completa con cajas de planes en grilla 2x2 y botón de visita de 44px.
- **Notificaciones, Modales Globales & Páginas Estáticas**:
  - `notificaciones`: toolbar responsive en columna, eliminación de hex (#1677ff, #13c2c2, #faad14, #722ed1) y botones táctiles.
  - `SettingsPanel`: drawer a 100vw en pantallas `<= 600px` con padding inferior adaptado a safe-area (`env(safe-area-inset-bottom)`), selector de acentos táctil de 28px y skins en grilla de 1 columna.
  - `CommandK` y `HelpShortcutsModal`: modal responsivo que se ajusta a `100vw - 16px`, altura táctil de 44px por ítem de resultado, input a 16px para evitar auto-zoom y ocultamiento de atajos físicos irrelevantes en mobile.
  - `creditos` y `legal`: saneamiento de hex a `--primary-color` y diseño de lectura adaptable.
  - `FeedbackClient`: botón de carga táctil a 40px y corrección de color a token `--text-on-primary`.

## Optimización Mobile UX/UI y Entorno Docker (2026-10-25)

- **Mejoras Mobile UX/UI:**
  - Shell y ergonomía: variables `--safe-bottom` y `--bottom-nav-total-height` integrando safe-area en iOS/Android; buscador flexible en `TopBar` mobile y tap targets de 44px; botones flotantes respetando la elevación del `BottomNav`.
  - Catálogo y `/ver`: índice A-Z y chips rápidos con `scroll-snap` horizontal táctil en 1 línea; tap targets de tarjetas a 38px; grilla de `/ver` en 2 columnas compactas (155px) en `<= 600px`; botones de preview táctiles a 36px y ocultamiento de flechas de mouse.
  - Reproductor y ficha: player sticky en `/ver/[id]` debajo del header; botones de Parte agrandados a 40px/48px; en `/series/[id]` el `TrackingPanel` se ordenó visualmente debajo del póster antes del reparto y la sinopsis; listas de capítulos compactadas en mobile.
  - Perfil (`/perfil`): header en grilla de 2 filas con avatar de 48px y atajo rápido a Ajustes; pestañas con desplazamiento horizontal táctil; Heatmap de 26 semanas con scroll horizontal; tooltip del WorldMap estático sin tapar mapas; medallas de logros en 3 columnas proporcionales; suscripciones con scroll interno.
  - Portada y Mi biblioteca: banner hero en 16:9 y selectores de acento de 36px; corrección del padding superior de títulos en `WatchingSeriesCard` (+44px de área útil).
- **Entorno Docker:**
  - En el host Windows no está instalado Docker Desktop nativo. La suite Compose (`npm run test:docker` y el hook `pre-push` a `main`) se ejecuta automáticamente mediante el daemon Docker provisto dentro de la distribución WSL (Ubuntu) del equipo, utilizando el plugin oficial Compose v5.6.1.
- **Validación y ramas:**
  - Validación completa en contenedor: 71 pasos en 12m24s aprobados.
  - Push directo a `origin/main` (commit `912a2c0f`).
  - Limpieza de ramas: eliminadas todas las ramas locales y remotas obsoletas (`claude/*`, `codex/*`, `feat/*`), quedando únicamente `main` sincronizado.

## Segundo lote de /ver: 24 títulos, +18 y partes (2026-10-25)

- Criterio del propietario: no descartar contenido oficial por formato, inserción, edad, género, emisión o dato dudoso; incluir y avisar. Afuera solo miembros, videos ocultos por el canal y lo no oficial.
- `ver-content-2026-10-25-b.json`: 24 títulos / 188 capítulos / 455 videos (Oxin, IdeaFirst, Windsor, Ticket2Me, RAP, Regal, nooto, iQIYI PH). Canales nuevos: Ticket2Me, RAP Production, Regal Entertainment.
- `WatchBatchEpisode.playback` declara `AGE_RESTRICTED`/`NOT_EMBEDDABLE`/`GEO_BLOCKED`; API y página anónima deben coincidir. En `/ver` (`availabilityOf` → `age_restricted`) el +18 no monta iframe: link a YouTube solo con sesión, botón de login sin ella. Nunca +18 automático en MundoBL.
- Partes sobre temporadas cargadas a mano: la fila de cada capítulo queda como parte 1 (mismo ID) y `ViewStatus` se copia a las partes nuevas. Los capítulos sin publicar de una serie al aire reciben título numerado para no quedar como extras. El ensayo pide páginas de a una cada 2 s.
- Local: 791 → 810 fichas, `/ver` 57 → 81. Pendiente: Craving You necesita el minuto donde empieza el EP2. Detalle: [segundo lote](../ampliacion-ver-2026-10-25.md#segundo-lote-2026-10-25-b).

## Ampliación de /ver: 14 títulos de PH, JP, VN, TW y CN (2026-10-25)

- `scripts/data/ver-content-2026-10-25.json`: 14 títulos / 125 capítulos / 125 videos, sin partes. Once fichas existentes completan su temporada 1 y tres altas `WATCHABLE_ONLY` (Marahuyo Project, Unknown, Stay With Me). Primeras series filipinas, japonesas y chinas en `/ver`.
- Nueve canales nuevos en `official-channels.ts`: Black Sheep, ANIMA Studios, Oxin Films (sin títulos en el lote), RL Studio, MOI Studio, Vũ Luân Entertainment, GTV Drama, YOUKU English y Huace Croton TV English. Los de catálogo general están en `EXCLUDED_CHANNELS` de `news-ingest.ts`. Lovememory, ya en la lista, no existe más en YouTube.
- `ver-content-batch.ts` registra cada lote con su conteo exacto; `--batch=` es obligatorio en `import-ver-content-batch.ts` y `publish-ver-content-batch.ts`. Cada entrega verifica solo sus videos.
- La página anónima detectó 19 videos solo para miembros que la API daba públicos (Oxin, Windsor); se excluyeron sus títulos. YouTube respondió 429 al repetir; el ensayo local usó la evidencia de menos de una hora. Local: 788 → 791 fichas, `/ver` 43 → 57, repetir es no-op. Sin migración ni cadenas nuevas. Detalle y exclusiones: [ampliación del 25/10](../ampliacion-ver-2026-10-25.md).

## Perfil en pestañas y logros ampliados (2026-10-25)

- `/perfil` va en pestañas (`?tab=`): Resumen, Estadísticas (incluye lo que era `/perfil/estadisticas`, que ahora redirige), Logros, Actividad, Ajustes y Admin (solo staff). Cada pestaña con grilla (`ProfileGridTab`) conserva mover/agrandar/quitar/sumar paneles con su propio layout `profile-<rol>-tab-<tab>-v1`. Se quitaron el selector Básica/Avanzada y el CustomizeDrawer; los layouts viejos quedan sin uso.
- Logros: definición única en `src/lib/achievements.ts` (48) + parches de plataforma en `src/lib/platform-patches.ts` (6 plataformas oficiales × bronce/plata/oro por series terminadas con `WatchLink.official`). Arte propio, sin logos. Solo cuentan datos registrados: reseñas publicadas, votos "útil" recibidos, comunidad no moderada, listas públicas con ítems, sugerencias aprobadas, `UserActiveDay` y racha histórica.
- Logros guardados (2026-10-28): `UserAchievement` (usuario, key, `unlockedAt`; key `patch:<plataforma>:<nivel>` para parches). Se otorgan al momento de la accion con `awardAchievementsAfterResponse(userId, metricas)` de `src/lib/achievement-store.ts` (solo recalcula esas metricas; si aprueba un moderador, se le otorga al autor). El perfil sincroniza todo con sus estadisticas y lee lo guardado: un logro obtenido no se pierde si baja el numero. Aviso solo in-app (`achievement_unlocked`). "Reiniciar datos" borra los de seguimiento y parches. Backfill: `scripts/backfill-achievements.ts`, lo corre `npm run migrate:supabase` al aplicar `20261028040000_user_achievements` (filas con fecha del deploy). Toda accion nueva que mueva una metrica tiene que llamar a `awardAchievementsAfterResponse`.
- Compartir: `SeriesShare` (una fila por usuario y serie, migración `20261025020000_series_shares`), escrita por `POST /api/user/shares` cuando el share se completa. Cuenta desde el deploy. Pruebas: `test-achievements.ts` y `test-profile-app.mjs`.

## Portada integral, probador de temas en vivo y página de inicio opt-in (2026-10-24)

- `src/lib/start-page-preference.ts` y `LoggedInHomeRedirect`: abrir `/` estando logueado ya no cierra ni redirige automáticamente la portada salvo que el usuario elija otra página de inicio (`mb-start-page`: `landing` por defecto, `watching`, `catalogo`, `ver` o `estrenos`) desde Ajustes (`SettingsPanel`) o desde el selector inline en el propio Hero de la portada. `getUserSummary()` se sigue invocando en segundo plano para registrar `UserActiveDay`. El logo de MundoBL en `Sidebar` y el menú de usuario en `TopBar` enlazan a `/?stay=1`.
- `LandingPage`: Hero sin pared de login (accesos directos a `/catalogo`, `/ver` y `/watching`, más comparativa «Sin cuenta vs. Con tu cuenta gratis con Google en 1 click» para visitantes), banda de estadísticas conectada a `/estadisticas`, mapa interactivo de 6 pilares clicables (`/ver`, `/catalogo`, `/watching`, `/estrenos`, `/comunidad`, `/estadisticas`), probador en vivo de temas (Oscuro/Claro, 6 skins, colores de acento, tonos, modo sin spoilers y 10 idiomas) y tarjeta del tracker actualizada con el cierre del círculo (valoración 1–10 y veredicto). Cero hex hardcodeados en `LandingPage.css` y cobertura en los 10 locales (3.741 claves).

## Pruebas completas en Docker local (2026-10-24, lote sin publicar)

- El propietario pidió evitar pruebas remotas automáticas y usar su equipo. `npm run test:docker` construye Node 22/Chromium y ejecuta la misma suite de 67 pasos junto a PostgreSQL 16 descartable en `compose.test.yml`.
- La ejecución tiene red interna sin salida a Internet y sin puertos del host. La base vive en tmpfs; solo se monta `test-results/compose` para logs. El contexto de build usa una lista permitida en `.dockerignore`, sin `.env*`, `.git`, backups ni dependencias del host. Las descargas ocurren al construir la imagen y se cachean.
- Windows detecta Docker nativo o Docker en la distribución WSL predeterminada. En este equipo se reutilizó el motor existente de Ubuntu-20.04 y se instaló el plugin oficial Compose v5.6.1 verificando su checksum. No requiere Docker Desktop adicional.
- El hook pre-push usa la suite Compose al publicar `main` y la suite rápida para otras ramas. `tracking.yml` queda manual (`workflow_dispatch`) en este lote local; GitHub mantiene su configuración anterior hasta publicarlo con una instrucción nueva. El deploy de Vercel sigue siendo manual.
- Las regresiones anteriores de Actions usaban PostgreSQL efímero, no Supabase. El repositorio público usa runners estándar sin costo de minutos; cachés/artifacts y los despliegues tienen cuotas independientes. La preferencia local se aplica aunque esas regresiones no gastaran la cuota de tráfico del sitio.
- Validación local aprobada: 67 pasos en 10m57s, incluidas las 80 tablas restauradas, Chromium, build y pruebas contra la app compilada. El launcher salió con código 0 y eliminó contenedores/red; se conservaron imagen cacheada y logs. Inspección de Docker confirmó red interna, cero puertos publicados y solo el montaje de logs. Ocho advertencias de lint anteriores, sin errores. Comandos y límites del hook: [pruebas-locales.md](../pruebas-locales.md).

## Recuperación del reproductor (2026-10-24)

- El propietario confirmó que el video vacío de Chrome volvió a funcionar al resetear el Service Worker desde Ajustes; en incógnito ya funcionaba. Esto vincula el incidente con el estado local, pero no identifica qué entrada o versión lo produjo.
- `/ver/[id]` ofrece «¿No se ve el video?»: recargar solo el reproductor, revisar conexión/datos locales y reiniciar cachés/SW con confirmación. El reinicio conserva cookies, localStorage y sessionStorage, incluyendo preferencias y progreso guardado. Hay errores visibles y tiempo límite para evitar un indicador de carga infinito. No hay consultas de disponibilidad, telemetría ni escrituras de seguimiento desde esta ayuda.
- `public/sw.js` v9 deja pasar frames y medios sin intervenir; el fallback offline se limita a navegaciones de documentos del mismo origen. La activación elimina solo cachés antiguas de MundoBL. Es una corrección preventiva de una regla demasiado amplia, no una reproducción certificada de la causa original.
- `scripts/test-player-recovery.mjs` prueba reglas del SW, migración de cachés y componentes reales en un perfil aislado: revisión, recarga del iframe, cancelación, reset/recarga preservando sesión/preferencias/progreso, errores y desconexión. El proveedor de video está simulado en esa prueba. Diez locales completos; la ayuda se comprobó también en la ficha local con Vimeo real.
- Blossom Campus es un problema independiente: el diagnóstico anónimo de sus seis videos pide membresía Gold de STRONGBERRY aunque la API indique público/embebible. No cambiar ese diagnóstico por «resuelto» al limpiar cachés. Su corrección de disponibilidad queda pendiente y no se modificaron datos de producción en este lote.
- Validación: `npm run test:fast` aprobado (ocho advertencias anteriores), build optimizado con DB local aprobado, auditoría de 3.566 claves en diez locales y regresión de recuperación aprobadas. La confirmación y el panel caben a 320/390/1280 px. Ficha compilada de prueba: `http://localhost:3018/ver/815-yu-and-rachel` (ID de la copia local).
- Publicado con autorización del propietario: PR #141, commit `29c5dd31db45f2c129ddd453b212c845d8149753`. Los 67 pasos de CI pasaron en 10m16s; un solo deploy manual quedó READY. Producción sirve ese SHA y el `sw.js` v9 coincide con el archivo publicado; ayuda presente en Vimeo y YouTube. Sin migración ni cambios de datos del catálogo.
- Comprobación posterior en Chrome: las acciones están publicadas y el reinicio conserva la sesión. Un iframe volvió a quedar vacío en la pestaña inspeccionada incluso tras el reinicio; no dar por demostrada la eliminación completa del incidente ni atribuir una causa nueva sin evidencia. Las regresiones aisladas del componente y SW pasaron.

## Publicación autorizada del lote de 16 títulos (2026-10-24)

- El propietario autorizó explícitamente publicar código y los 16 títulos si pasaban una verificación nueva. A las 13:36 ART (16:36 UTC), los 114 videos YouTube y el video Vimeo dieron OK en ambas verificaciones. El límite 429 del ensayo anterior ya no impidió esa comprobación.
- Producción tiene `YOUTUBE_API_KEY` y `VIMEO_ACCESS_TOKEN` configuradas; se verificó su existencia sin revelar valores. Dailymotion continúa sin activar.
- `scripts/publish-ver-content-batch.ts` es un ejecutor separado de la receta local: solo admite el proyecto Supabase de MundoBL, simula con transacción READ ONLY, exige evidencia completa de menos de una hora y --apply con un plan previamente revisado. Verifica hashes de manifiesto/evidencia/estado previo, vuelve a consultar APIs, conserva respaldo acotado en `backups/ver-release-*` y aplica en una transacción serializable. Si cambió una ficha desde la simulación, aborta. Los respaldos nunca se publican en Git ni en artifacts.
- Flujo de entrega: PR con CI completo aprobado, aplicación del plan de datos, merge y un solo workflow manual Deploy producción. Confirmar luego el SHA servido, los 16 detalles, 43 títulos en `/ver` y reproducción de Vimeo. No hay migración de schema.

## Ampliación de plataformas preparada localmente (2026-10-24, ensayo previo)

- El propietario pidió más YouTube y otras plataformas; detuvo la publicación inicial. La autorización nueva y su comprobación están documentadas arriba.
- Nuevo lote adicional: 7 temporadas YouTube / 63 capítulos, seleccionadas y comprobadas con API + página anónima. Con las ocho iniciales: 15 títulos / 107 capítulos / 114 videos. Manifiesto `scripts/data/ver-content-youtube-expanded-2026-10-24.json`.
- Vimeo: `Yu and Rachel` (Taiwán, 2014, corto, 733 s), video 129009162 del propietario 7732934 (WU ZI-EN); autoría contrastada con Iris Prize. API disponible/público/embebible, oEmbed público y reproducción en Chrome comprobados. Manifiesto separado `ver-content-vimeo-2026-10-24.json`.
- `episode-platforms.ts` valida host e ID y normaliza URLs. `external-episode-source.ts` consulta endpoints fijos, verifica propietario/obra en `official-video-publishers.ts`, duración y acceso público. Preview, confirmación y administración comparten `resolveOfficialEmbedFields`; no se confía en datos de canal enviados por el cliente. El audit incluye las nuevas plataformas.
- Vimeo reutiliza `VIMEO_ACCESS_TOKEN` (solo servidor). Dailymotion usa `NEXT_PUBLIC_DAILYMOTION_PLAYER_ID` (público; requiere build para cliente): iframe `geo.dailymotion.com/player/{id}.html?video=...` y oEmbed con `player`. Sin ID ni obras oficiales verificadas permanece sin activar. La cuenta del propietario x6gs386 muestra Medios/Análisis/Ganancias, sin Embeds/Players; su handle no reemplaza un Player ID. No se cambió plan ni cuenta.
- Terminología: suscribirse al canal en YouTube; seguir al autor/canal en Vimeo/Dailymotion; avisos de MundoBL para la campanita propia. Los me gusta/reproducciones de YouTube se filtran por proveedor; enlaces, avisos y miniaturas respetan el proveedor. Diez locales con claves e interpolaciones comprobadas. El progreso manual sigue disponible; la detección automática de tiempo visto sigue siendo exclusiva de YouTube.
- Ensayo local: 785 fichas / 43 en `/ver`, frente a 777/27 iniciales. Lote completo: 16 títulos / 108 capítulos / 115 videos. Ocho fichas enriquecidas y ocho altas WATCHABLE_ONLY. Build, test:fast (ocho warnings previos), regresiones de importación/fuentes/aportes/audit y listado/detalles aprobados. En Chrome se comprobó Vimeo dentro de la ficha, avance del reproductor, progreso manual, filtro Vimeo y Suscribite en YouTube.
- YouTube devolvió HTTP 429 al repetir la verificación anónima después del dry-run exitoso (08:01 UTC). Se detuvieron las consultas; para terminar el ensayo de los ocho adicionales se usó evidencia positiva guardada a las 07:43 UTC, de menos de una hora, más API y Vimeo consultados nuevamente. No se eludió el límite. Antes de publicar, repetir la comprobación en vivo cuando el proveedor lo permita; la receta normal sigue abortando ante UNKNOWN. Detalles en `docs/ampliacion-ver-2026-10-24.md`.
- Estado: implementación local terminada; Dailymotion pendiente de configuración y obras. La receta solo admite bases locales de ensayo. Sin migración de schema ni escrituras en producción; no push/PR/merge/deploy.

## Ampliación de /ver preparada localmente (2026-10-24)

- Diagnóstico de solo lectura: 777 fichas, 27 títulos elegibles en `/ver`; la clave local de YouTube funciona. Faltaba incorporar episodios y reconocer más canales, no construir otro reproductor.
- Cinco fuentes agregadas a `official-channels.ts`: GND STUDIO, Rookie Thailand, Mind Trio, Sukfilm y Wayufilm Production, verificadas por ID. País sugerido agregado al importador; el barrido hereda los canales de la lista compartida.
- `scripts/data/ver-content-2026-10-24.json` selecciona 8 títulos / 44 capítulos / 51 videos: cinco fichas existentes se enriquecen y tres altas quedan WATCHABLE_ONLY. `scripts/import-ver-content-batch.ts` simula por defecto, admite `--apply` solo en DB local, revalida canal, duración, mercados y página anónima. `watch-content-batch.ts` conserva IDs/seguimiento, registra revisión, incrementa editVersion, rechaza conflictos y no duplica al repetir.
- Hallazgo: The Star devuelve público/embebible en la API pero exige membresía en la página. Se excluyó del lote; la doble comprobación queda obligatoria para esta receta. No se modificó el comportamiento del importador web ni del cron de auditoría.
- Copia local: `/ver` pasa de 27 a 35 títulos. Regresiones de datos, controles estáticos y build local aprobados. No hay migración ni nuevas cadenas de interfaz. No se escribió producción ni se publicó código.
- Fuentes, comandos y alcance: [ampliación de /ver](../ampliacion-ver-2026-10-24.md). Publicado en producción el 24/10.

## Primer ingreso y días activos (2026-10-24)

- Datos que lo motivan (prod, 24/10): 57% de las cuentas VISITOR nunca hizo nada tras registrarse (72% en octubre); 72 de 79 que alguna vez siguieron una serie lo hicieron en su primera hora.
- `FirstVisitOnboarding` (layout raíz): a quien entra logueado sin nada seguido le pregunta "¿Qué estás viendo ahora?" con hasta 5 series al aire (`getOnboardingSeries`: mismo corte que la parrilla, sin +18, las más seguidas primero) y por qué capítulo de la última temporada va. `POST /api/user/onboarding` las deja en VIENDO (eso suscribe a avisos) y marca el progreso. Guardar, "Ahora no" o cerrar setean `User.onboardingCompletedAt`: se muestra una sola vez. No aparece en `/admin`, legales ni si hay un pending-track del login.
- `UserActiveDay` (userId, día UTC): `GET /api/user/me/summary` anota el día; el cliente cachea el resumen 5 minutos. Es la única forma de medir retorno: las PAGE_VIEW se anonimizan y la sesión es JWT. Retención = filas por usuario a lo largo de los días.
- Migración `20261024060000_onboarding_active_days` (con RLS). Pruebas: `scripts/test-onboarding.ts` y `scripts/test-onboarding-ui.mjs` contra `mundobl_replay` local.

## Aviso de estreno y resumen semanal (2026-10-24)

- Por qué: 54 cuentas seguían 53 series y nunca salió un aviso, porque `notifyEpisodesAvailable` depende de que un episodio reciba su video. El día de estreno sí se sabe (`Series.airDays`).
- `AiringAlertCta` (ficha y `/ver`, solo con `isAiringNow`): "Avisame cuando salga el próximo capítulo". Anónimo: guarda la intención (`src/lib/pending-alert.ts`, sessionStorage 30 min) y va a Google; al volver se suscribe solo. Después ofrece una vez el mail (setea `emailEnabled`, opt-in explícito). Si ya sigue la serie, no aparece.
- Embudo: kinds `alert_offer` / `alert_click` / `alert_on` en `SeriesActivityDaily` (anónimo, respeta GPC/DNT y el opt-out, sin equipo). Se ve en `/admin/informe-productoras`, fuera del texto copiable.
- `/api/cron/alerts` (Vercel, 12:00 UTC = 09:00 AR / 19:00 TH), `src/lib/airing-alerts.ts`: todos los días `air_day` ("Hoy sale capítulo de X", in-app + push, mismo interruptor que `notifySeasonAdded`, refId `serie:fecha`, no repite aunque esté leído). Los lunes, resumen por mail a `emailEnabled` (sin equipo): series seguidas al aire con sus días + hasta 5 en VIENDO; si no hay nada, no sale. `NotificationPrefs.digestSentAt` se reclama antes de enviar (dos corridas no duplican; un fallo de Resend no se reintenta esa semana). Textos en español: el idioma no se guarda en la cuenta.
- Migración `20261024200000_airing_alerts` (columna + amplía el CHECK de kind). Va DESPUÉS de `20261024190000_tracking_redesign`. Pruebas: `scripts/test-airing-alerts.ts` y `scripts/test-airing-alert-ui.mjs`.

## Recomendaciones (2026-10-19)

- `src/lib/recommendations.ts` puntúa por tags, géneros y actores compartidos (actor 3, tag 2, género 1, divididos por log2 de cuántas candidatas tienen ese rasgo). Hace falta un actor o dos rasgos en común; un género suelto no alcanza.
- Ficha: `getSimilarSeries` ("Si te gustó esta") se hornea en el HTML de ISR. Excluye la propia serie, su universo (ya se muestra aparte), +18 y todo lo que no sea catálogo curado público. Puede quedar vieja hasta el próximo revalidate de la ficha.
- `/watching`: `GET /api/user/recommendations` arma "Para vos" con lo visto, viendo, retomar y favoritas, sin nada que ya esté en la biblioteca. Sin semillas o sin parecidas cae a lo más seguido del sitio.
- Prueba: `scripts/test-recommendations.ts` contra `mundobl_replay` local. Sin cambios de schema.

## Anchos, 404 y transacciones (2026-10-17)

- **Anchos:** las páginas no tienen tope fijo en px. `--content-max-width` es `none` y cada página lo usa. El texto de lectura corrida (legales, notas, formularios) usa `--reading-max-width` (110ch). Las grillas se acomodan con `auto-fill`/`auto-fit` o con `@container`, no con `@media` del viewport: la barra lateral hace que el ancho real sea menor que la ventana. El reproductor de `/ver/[id]` usa `--player-max-width` para que el video entre en el alto de la pantalla.
- **404:** cada `[id]` con `loading.tsx` chequea la existencia en su `layout.tsx` (`src/lib/detail-loaders.ts`, memoizado con `cache`). Desde la página, `notFound()` llegaba con el esqueleto ya enviado y salía 200. Los `loading.tsx` de `/ver` y `/catalogo` viven en `(index)/` para no envolver a sus `[id]`.
- **Fichas +18:** `/series/[id]` y `/ver/[id]` son ISR. Un título ADULT18 redirige a `/adultos`, la única variante que lee la cookie.
- **Transacciones:** `src/lib/serial-transactions.ts` encola las consultas de cada transacción. Prisma lanza en paralelo las subconsultas de un `include` sobre la única conexión de la transacción, y pg@9 va a fallar con eso.

## Catálogo liviano y curaduría móvil (2026-10-13)

- Lote solicitado y probado localmente; el propietario luego autorizó una sola
  MR y un solo deploy una vez finalizada la verificación.
- `getCatalogSeries` proyecta sólo los campos públicos usados por las tarjetas:
  omite sinopsis, reseñas, notas privadas y relaciones completas innecesarias.
  `catalogTransport` envía cada etiqueta una vez y reconstruye el mismo shape
  para conservar búsqueda, filtros, universo, favoritos y vistas.
- Sinopsis a demanda: `/api/series/[id]/preview`, GET estático con TTL de seis
  horas; `revalidateSeriesDetail` lo invalida al editar. Sólo CURATED + PERSONAL
  - VISIBLE; ADULT18 devuelve null, nunca evita la compuerta del detalle.
    Hover y modal comparten petición y caché de texto público por 60 segundos,
    limitada a 50 entradas. Errores se pueden reintentar y no se cachean en cliente.
- Comparación al crear una serie ya capturada: campos en bloques seleccionables,
  valores apilados a menos de 600 px y lado a lado en escritorio, sin celdas
  comprimidas ni scroll dentro de cada texto. Selección individual y conjunta,
  botones de 44 px, temas mediante tokens. Temporadas del formulario apiladas
  en móvil. Los tokens de Table cubren selección/hover/expansión también.
- Pruebas: build, TypeScript, lint (ocho advertencias previas), 3.481 claves
  consistentes en diez locales; curaduría real en PostgreSQL local y navegador
  a 320/390/768/1280, claro/oscuro. Se conservan IDs de episodios/enlaces,
  revisiones, borrador y rechazo de versiones antiguas.
- `test-catalog-preview-ui.mjs`: límites públicos, +18, ID inválido, carga sólo
  al abrir, reutilización, HIT ISR (`TEST_ISR=true`) e invalidación después de
  guardar una curaduría. `test-catalog-payload.ts`: roundtrip de todos los datos
  de filtros y caché concurrente/expirada/error. Fixture sintético de 700 títulos:
  JSON 1.017.233 → 183.447 bytes; gzip 13.788 → 5.800. No son cifras de cuota.
- Línea de base pública antes de esta entrega (13/10, 04:30 ART, HIT): catálogo
  2.048.270 bytes HTML descomprimido, 405.332 de CSS inline. La extracción del
  CSS SSR permanece pendiente. No se aumentaron TTL ni se desactivaron tareas
  funcionales. El ahorro real de CPU/ISR requiere comparar ventanas equivalentes
  después del deploy; no se deduce del porcentaje del fixture.

## Flujo local y corrección de navegación (2026-10-12)

- Por instrucción del propietario: desarrollar y validar localmente, agrupar las
  mejoras y esperar una nueva indicación explícita antes de push/PR/merge/deploy.
  El propietario autorizó reunir este lote en una sola MR y un solo deploy.
- `vercel.json` ya desactiva despliegues Git de todas las ramas. Producción se
  despliega únicamente al ejecutar manualmente `deploy.yml`; los checks de PR
  usan runners GitHub con PostgreSQL descartable, no previews de Vercel.
- Smoke de producción pausado en GitHub (`disabled_manually`). La copia local
  elimina el cron de seis horas y conserva ejecución manual. Playwright apunta
  a `localhost:3018` por defecto; producción exige `SMOKE_BASE_URL` explícito.
- Analytics pasa a ser opt-in mediante `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true`:
  sin esa bandera no se monta el script ni se envían eventos propios. Este cambio
  sólo afectará producción después de una entrega autorizada. Se mantienen las
  tareas funcionales del cron y los backups; no se promete ahorro de CPU/ISR por
  quitar Analytics, que tiene su propia cuota.
- 24/10/2026: ese opt-in dejó Analytics apagado en producción desde el deploy
  del 13/10 (la bandera nunca se cargó). Se creó
  `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true` en Vercel (solo Production); al ser
  `NEXT_PUBLIC_`, rige desde el siguiente build. Los eventos custom (`trackEvent`)
  requieren plan Pro: en Hobby solo cuentan las pageviews.
- Corrección local del diseño rechazado: grupos inline en Sidebar y AdminNav;
  al expandir aparecen los destinos en el mismo menú. Un grupo con un destino
  es un enlace directo. Mobile mantiene una sola superficie en «Más», con grupos
  compactos, sin resúmenes repetidos ni paneles adicionales.
- Verificación local: build, TypeScript, lint y auditoría de los diez idiomas
  aprobados. Navegador contra Next dev/PostgreSQL local: retorno, filtros, scroll,
  grupos inline, sidebar colapsado, móvil 320/390/768 y admin aprobados. El servidor
  dev se detuvo para compilar; la revisión automática bloqueó después `next start`
  sin motivo específico, por lo que no quedó una vista local persistente encendida.
- No agregar coautorías. Se limpiaron 187 mensajes del historial publicado y el
  tag, preservando árboles, identidades, fechas y topología de los 757 commits.
  Los SHA históricos anteriores ya no identifican la línea vigente; referencias
  antiguas de PR y cachés de GitHub pueden seguir accesibles. Respaldo sólo local.
- Build remoto: Actions pasa `MUNDOBL_BUILD_SHA` y `MUNDOBL_BUILD_COMMIT_DATE`.
  El build ID usa los primeros 12 caracteres del SHA. Sin `.git` no se ejecuta
  Git; en local se conserva fallback silencioso. Pruebas cubren CI sin Git,
  metadata del proveedor y checkout ausente/roto.
- `useHasNovedades` comparte petición en curso y timestamp público por 60 segundos,
  conservando la lectura de la marca personal en cada navegación. Pruebas de
  concurrencia, expiración y reintento después de error. No comparte datos privados.
- Esto reduce consultas redundantes y telemetría opcional, pero no certifica
  resolver las cuotas acumuladas de CPU/ISR. La reducción del payload del catálogo
  y CSS SSR del diagnóstico sigue pendiente; requiere medición comparativa propia.

## Navegación y traducciones (2026-10-12)

- Sidebar: conserva los accesos principales y abre cajones por sección. Actores,
  directores, guionistas y productoras comparten «Personas y productoras»; comunidad
  y ayuda tienen grupos propios. Mobile conserva sus cuatro accesos + Más.
  `navItems.ts` mantiene los 21 destinos previos y sus permisos, y suma el acceso
  al directorio existente de guionistas; `NavigationSections`
  renderiza enlaces reales, grupos desplegables y el resumen de sus destinos.
  Patrocinio sigue condicionado a su visibilidad publicada.
- Admin: los cinco grupos de `adminDestinations.tsx` abren el mismo componente de
  navegación en desktop y mobile. Se respetan restricciones de rol y propietario
  de patrocinio; la selección de una ruta anidada usa el destino más específico.
- Retorno: `useBackNavigation` centraliza el botón público y cancelaciones de
  formularios. `navigation-history.ts` conserva metadatos propios al actualizar
  filtros sin pasar las claves privadas de Next a su integración History API.
  Comunidad, creación de series y colaborador tienen fallbacks propios. Se
  conserva el hash en la entrada directa de `NavigationGuard`.
- Catálogo: la URL usa la búsqueda actual (no su valor diferido, que podía borrar
  la búsqueda durante la hidratación). `/ver` conserva búsqueda, país, plataforma,
  selección de curadas y vista en query params. `useHistoryScroll` guarda posición
  por entrada y URL en catálogo y `/ver`, reemplazando el scroll global del catálogo.
- i18n: `npx tsx scripts/audit-locale-coverage.ts` verifica 3.479 claves por idioma,
  claves faltantes/extra y consistencia de variables en los 10 diccionarios. Se
  corrigieron variables sin valores y el texto de búsqueda de noticias que usaba
  HTML/ICU, formatos que `t()` no interpreta. Una clave obsoleta vacía
  (`reviews.aiComingSoon`) permanece vacía deliberadamente en todos los idiomas.
  Esto **no significa cobertura completa de la interfaz**: `audit-i18n.ts`
  detectó 298 posibles textos fijos en 49 archivos (heurística con falsos positivos),
  incluyendo aportes, ajustes de notificaciones y suscripciones además de admin.
  La calidad lingüística de las traducciones generadas sigue requiriendo revisión.
- Verificación reproducible: `npx tsx scripts/test-navigation.ts` cubre destinos,
  roles, agrupación, marcas de historial y fallbacks. `scripts/test-navigation-ui.mjs`
  requiere servidor local en 3018 y `DATABASE_URL` apuntando exclusivamente a
  `127.0.0.1:55433/mundobl_replay`; crea y limpia sus fixtures. Cubre búsqueda,
  página, scroll, recarga, atrás/adelante, acceso directo, `/ver`, cajones públicos
  a 320/390/768 px y administración desktop/mobile. Sin cambios de schema.

## Calidad y sostenibilidad (2026-10-12)

Compartir usa SeriesShareButton (texto breve y URL canónica); PosterPreview abre originales a demanda con Ant Design. /apoyar y /admin/patrocinio usan SupportSettings (borrador/snapshot, versión, RLS y backup), solo ADMIN + ADMIN_EMAILS administra; publicación desactivada por defecto, sin pagos integrados ni avisos. Desplegado como f2f8ac1 (PR #113), con patrocinio oculto. Diagnóstico de cuotas del 12/10: Vercel excedía CPU (8 h 29 min / 4 h) e ISR Writes (311.224 / 200.000); Supabase sin excesos. Lo que sigue abierto está en [pendientes](../pendientes.md).

## Piloto editorial (2026-10-12)

Clasificación humana `UNREVIEWED | GENERAL | ADULT18` y avisos independientes,
edición ADMIN con versión/revisión, compuertas de detalle/medios y preferencia
revocable de 30 días en `/preferencias-contenido`. No es control parental ni
oculta todos los títulos/portadas. `/contenido` conserva su directorio de videos.
`WatchLinkClickDaily` cuenta todos los clics de "Dónde ver" por día UTC, link y
superficie (`series`/`info`/`watching`), sin identidad y excluyendo al equipo
(`src/lib/outbound-links.ts`, `/api/watch-link-clicks`). Es el número para hablar
con productoras. Los links oficiales salen con UTM `utm_source=mundobl` y mandan
el origen como referrer (los no oficiales siguen con `noreferrer`).
`PilotClickDaily` cuenta clics GagaOOLala por día UTC y sección, sin identidad ni
historial individual; `/admin/piloto` muestra 60 días. La curaduría bloquea borrar
temporadas/aportes que conservan seguimiento, notas o historial. Bienvenida
actualizada; no cambia opt-in ni se enviaron correos. Nuevas cadenas en 10 locales.

Estado y límites, incluidos tests HTTP completados y fichas +18 en la variante dinámica /adultos:
[piloto editorial](../piloto-editorial-2026-10-12.md). Migración
`20261012205349_editorial_maturity_pilot_clicks` aplicada en producción el 12/10.

## Estado actual (2026-10-01)

- Guardado de series (#110): el form de edicion guarda en UNA transaccion y por diferencias ([saveSeriesFromForm](../../src/lib/series-save.ts)): sin cambios no reescribe filas, y si algo falla no se aplica nada. `Series.editVersion` la sube solo un guardado de form (admin, colaborador) o el cambio de alcance; el form manda la version con la que abrio y el server responde 409 `EDIT_CONFLICT` si cambio (pestaña vieja). Sin version tambien es 409. Antes de cada guardado queda una foto JSON completa en `SeriesRevision` (quien, cuando, version reemplazada; sin FK a proposito: sobrevive al borrado de la serie). Motivo: el 29/09 se perdio contenido de "Poisoned chalice" (705) sin forma de saber que habia ni quien guardo. El cron de reproducibilidad ya no toca `updatedAt` si `geoRestrictedCore` no cambia. Migracion `20260930120000_series_revisions` aplicada en produccion el 01/10.
- Region: funciones en `gru1` (São Paulo, `vercel.json`), al lado de la base (sa-east-1). Antes corrian en `iad1` y cada consulta cruzaba el continente (~130 ms; un guardado de serie eran 6-8 s). En Hobby la cuota es en horas y GB-h, no en dolares: la region no cambia el costo y la memoria provisionada baja porque la instancia espera menos I/O. Si se pasa a Pro, `gru1` cuesta 1,7x por unidad.
- Avisos: ADMIN y MODERATOR no quedan suscriptos solos al marcar "viendo" ([subscribeOnFirstTrack](../../src/lib/tracking.ts)), ni el backfill los suscribe; el aviso de temporada nueva no le llega a quien la agrego. Reporte de Flor del 27/09.
- Pendiente medido (01/10, HTML sin comprimir): el CSS inline de Ant Design (SSR de cssinjs) pesa en todas las paginas: ficha 288 KB de 510 KB, `/ver/[id]` 221 KB de 383 KB, `/estrenos` 163 KB de 311 KB, `/catalogo` 405 KB. Extraerlo a CSS estatico cacheable es la mejora de carga mas grande que queda. `/catalogo` ademas manda 1,3 MB de datos (sinopsis 290 KB, etiquetas como objetos 139 KB): sinopsis a demanda en la vista rapida y diccionario de etiquetas.
- Runtime: sección de mantenimiento ADMIN con inspección paginada y borrado individual de deployments de producción de más de 90 días (no hay previews: Git no despliega), protecciones recalculadas antes de borrar, auditoría en AccessLog, limpieza de logs vencidos y diagnóstico de variables R2. Integración Vercel server-only mediante `MAINTENANCE_VERCEL_TOKEN`, `MAINTENANCE_VERCEL_PROJECT_ID`, `MAINTENANCE_VERCEL_TEAM_ID`; sin ellas no se habilita. Los overrides de emergencia existentes son por instancia, no un freno global. Procedimiento y límites en el [manual](../manual-mantenimiento.md).
- Operación: [manual de mantenimiento](../manual-mantenimiento.md) con interpretación de cuotas, limpieza de deployments y backups. #107 comprobada en producción (`6b815cf`), con HIT de caché en `/ver/676` y `/series/1`. Supabase Free con gracia agotada (terminó el 10/09) pero ninguna métrica pasada al 29/09: Egress 32 %, Log Ingestion 53 % (todavía no se cobra; la genera sobre todo Supavisor por conexiones Prisma), DB 25 %, Storage 11 %. 20 series y 12 imágenes de pedidos siguen en Supabase. Métricas de Vercel pendientes (solo en el panel). `PAGE_VIEW` ya no mide tráfico: el proxy que lo registra corre solo en `/admin`. No asumir 16 CPU-h como cuota de Vercel Hobby: la documentación indica 4 CPU-h incluidas.
- Comunidad: conversaciones (#103) y listas, Top 5, perfiles, bloqueos y moderación (#104) están en producción con su migración aplicada. Las conversaciones se publican desde el formulario; guardar borrador es opcional y quien pregunta puede pedir aviso de respuestas.
- Seguimiento: biblioteca, historial, diario y estadísticas en producción. En castellano, lo que sigue el avance (`/ver`, ficha, `/watching`, perfil) dice "capítulo"; admin y carga de datos siguen con "episodio". Las etiquetas muestran capítulo y parte, nunca el número de fila. Faltan múltiples visionados y conflictos al importar.
- Pendientes verificados contra el código: [pendientes.md](../pendientes.md). La historia de entregas está en `CHANGELOG.md`.

---

## Stack Tecnologico

| Tecnologia     | Version | Uso                      |
| -------------- | ------- | ------------------------ |
| **Next.js**    | 16      | Framework (App Router)   |
| **React**      | 19      | UI                       |
| **TypeScript** | 5.9     | Tipado estricto          |
| **Ant Design** | 6       | Componentes UI           |
| **Prisma**     | 7.4     | ORM                      |
| **PostgreSQL** | -       | Base de datos (Supabase) |

## Infraestructura

| Servicio           | Detalle                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Hosting**        | Vercel (deploy manual con GitHub Actions)                                                                                          |
| **Base de datos**  | Supabase PostgreSQL (sa-east-1, Sao Paulo)                                                                                         |
| **Almacenamiento** | Supabase Storage (bucket `images`)                                                                                                 |
| **Auth**           | NextAuth.js (Google OAuth)                                                                                                         |
| **Dominio**        | **mundobl.com.ar** (primario), mundobl.win (backup). Redireccion `.win → .com.ar` via Cloudflare (DNS / Page Rules), NO en codigo. |
| **SSL**            | Automatico via Vercel                                                                                                              |

### Variables de Entorno (Vercel + .env local)

```
# Base de datos
DATABASE_URL                # Transaction pooler (puerto 6543) - para la app
DIRECT_URL                  # Session pooler (puerto 5432) - para migraciones Prisma
SUPABASE_PASSWORD           # Password del proyecto Supabase

# Auth (NextAuth + Google OAuth)
AUTH_SECRET                 # Secret para NextAuth
NEXTAUTH_URL                # URL absoluta del sitio
GOOGLE_CLIENT_ID            # Google OAuth client ID
GOOGLE_CLIENT_SECRET        # Google OAuth client secret
ADMIN_EMAILS                # Emails admin separados por coma

# Supabase Storage (subida de imagenes)
NEXT_PUBLIC_SUPABASE_URL                       # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY   # Anon key publica
SUPABASE_SERVICE_ROLE_KEY                      # Service role key (server-only)

# Integraciones externas
YOUTUBE_API_KEY             # YouTube Data API v3 (importacion de videos/canales/playlists)
VIMEO_CLIENT_ID             # Vimeo API
VIMEO_ACCESS_TOKEN          # Token de acceso de Vimeo

# Links del proyecto (admin/info)
PROJECT_GITHUB_URL
PROJECT_VERCEL_URL
PROJECT_SUPABASE_URL
```

> **Limpiar del `.env` local**: las vars `DEV_AUTH_BYPASS`, `DEV_AUTH_ROLE`, `DEV_AUTH_USER_ID` no las lee ningun archivo en `src/`. Son dead config (auditado 2026-05-09). Si en el futuro se reintroduce un bypass de auth dev, debe ir guardado tras `process.env.NODE_ENV !== 'production'`.

**Asistente IA del proyecto:** **Gemini** (no Claude/Anthropic). El helper esta en [src/lib/gemini.ts](../../src/lib/gemini.ts) y la env var es `GEMINI_API_KEY`. Cualquier feature de IA debe usar este helper, no integrar otro proveedor.

---

## Integraciones Externas

### YouTube Data API v3

- **Env**: `YOUTUBE_API_KEY` (configurada). Cuota gratuita: 10k unidades/dia.
- **Helper**: [src/lib/channel-fetcher.ts](../../src/lib/channel-fetcher.ts) → `fetchYouTubeChannel(url, pageToken?)`
  - Acepta URLs de canal: `/channel/UCxxx`, `/@handle`, `/c/customname`, `/user/username`
  - Usa el endpoint `playlistItems` sobre la playlist `uploads` del canal
  - Pagina con `nextPageToken`, 50 videos por pagina
  - Devuelve `ChannelVideo[]` con `videoId`, `title`, `description`, `thumbnailUrl`, `channelName`, `channelUrl`, `publishedAt`, `platform: 'YouTube'`
- **`fetchYouTubePlaylist(url, pageToken?)`**: importa una playlist (ej. la playlist oficial de una serie en GMMTV). Acepta URLs `?list=PLxxx` o `playlist/PLxxx`. Devuelve `PlaylistFetchResult` con metadata del playlist (titulo, descripcion, thumbnail, itemCount) ademas de los videos.
- **`fetchAllYouTubePlaylistVideos(url, maxPages=10)`**: paginacion automatica hasta `maxPages` (500 videos) — para series con muchos episodios.
- **Lo que NO esta implementado todavia**:
  - Fetch por **video unico** con metadata enriquecida (`videos` endpoint con `contentDetails` para duracion)

### Vimeo API

- **Env**: `VIMEO_CLIENT_ID`, `VIMEO_ACCESS_TOKEN` (configuradas).
- **Helper**: [src/lib/channel-fetcher.ts](../../src/lib/channel-fetcher.ts) → `fetchVimeoChannel(url, pageToken?)`
  - Acepta URLs de usuario/canal: `/channels/name`, `/username`
  - Usa el endpoint `users/{userId}/videos`, 25 videos por pagina, ordenado por fecha
  - Misma forma de retorno (`ChannelVideo[]`) que YouTube → flujo unificado

### Internacionalizacion (i18n)

- **10 locales soportados con traduccion completa**: `es`, `en`, `it`, `de`, `fr`, `ja`, `ko`, `zh-CN`, `zh-TW`, `th`. Default: `es`.
- Storage: `localStorage['app-locale']` (client-side). El toggle es client-side, las URLs NO cambian por locale.
- **Estructura**:
  - [src/i18n/config.ts](../../src/i18n/config.ts): SUPPORTED_LOCALES, LOCALE_LABELS, isSupportedLocale
  - [src/i18n/messages.ts](../../src/i18n/messages.ts): TranslationShape (tipo), bloques `es` y `en` inline (~1500 lineas cada uno), MESSAGES record que importa los otros 8 desde `locales/`
  - `src/i18n/locales/{code}.ts`: traducciones generadas por IA (Gemini), una por locale. Editables a mano si una frase suena mal.
- **Helper**: [src/lib/providers/LocaleProvider.tsx](../../src/lib/providers/LocaleProvider.tsx) → `useLocale()` retorna `{ locale, setLocale, t(key) }`. `t` falla a `en` si la clave no existe en el locale activo, y a la propia clave si tampoco existe en `en`.
- **antd locales**: [src/lib/providers/ThemeProvider.tsx](../../src/lib/providers/ThemeProvider.tsx) mapea cada locale al pack de antd (`antd/locale/xx_YY`) para DatePicker, Calendar, etc.
- **Para regenerar un locale via IA**: `npx tsx scripts/translate-locales.ts {code}` (usa `MESSAGES.en` como source de verdad, batchea en groups de 40 strings, escribe el archivo). Free tier de Gemini suficiente.
- **Para agregar un locale nuevo**: ver header de [config.ts](../../src/i18n/config.ts).

### Google Gemini API (asistente IA)

- **Env**: `GEMINI_API_KEY` (configurada en Vercel; **no** en `.env` local). Free tier: 15 RPM / 1500 RPD compartido por key.
- **Modelo**: cadena con fallback automatico. Default: `gemini-2.5-flash` → `gemini-flash-latest` → `gemini-2.5-flash-lite`. Override via env `GEMINI_MODELS` (csv).
- **Helper**: [src/lib/gemini.ts](../../src/lib/gemini.ts) → `generateText({prompt, systemInstruction, temperature?, maxOutputTokens?, thinkingBudget?})`
  - `thinkingBudget: 0` desactiva "thinking tokens" (recomendado para tareas cortas)
  - Tira `GeminiError` con `status` HTTP + `googleStatus` simbolico (RESOURCE_EXHAUSTED, PERMISSION_DENIED, etc.)
  - Fallback automatico ante 429/404/5xx; errores definitivos (400, prompt invalido) frenan
- **Consumidores actuales**:
  - `POST /api/reviews/ai-assist` — sugerencias de resena
  - `POST /api/admin/changelog/ai-assist` — redaccion de changelog
  - `POST /api/admin/news/ai-generate` — generacion de news
  - `POST /api/reviews` — asistencia inline
- **Casos de uso futuros**: traduccion de sinopsis al español al importar series, normalizacion de titulos parseados de YouTube, deteccion de pais/año desde metadata de canal.

### Embed helpers ([src/lib/embed-helpers.ts](../../src/lib/embed-helpers.ts))

Soporta 8 plataformas para reproducir/parsear:

- **YouTube**, **Vimeo**, **Bilibili**, **Dailymotion**, **TikTok**, **Instagram**, **Twitter/X**, **Spotify**
- `getYouTubeId`, `getVimeoId`, `getBilibiliId`, `detectPlatform(url)`, `buildEmbedSrc(url)`, `getThumbnailUrl(url)`
- Constantes: `PLATFORM_OPTIONS`, `CATEGORY_OPTIONS`, `PLATFORM_COLORS`

### Supabase Storage

- **Helper**: [src/lib/supabase.ts](../../src/lib/supabase.ts)
- Bucket: `images`. Funciones: `uploadImage`, `deleteImage`, `downloadAndUploadImage` (re-hostea imagen desde URL externa)
- Usa la **service role key** y SOLO para Storage. La app NUNCA consulta tablas via el cliente Supabase (`supabase.from(...)`) — todo el acceso a DB es via Prisma.

### Seguridad DB — RLS (Row Level Security)

- **Todas las tablas del schema `public` tienen RLS habilitado** (deny-by-default para el rol `anon`). Sin esto, la anon/publishable key (PUBLICA, `NEXT_PUBLIC_...`) permitiria leer/escribir tablas via la REST API de Supabase (PostgREST), salteando la app.
- **No rompe la app**: Prisma conecta con el rol postgres (conexion directa `DATABASE_URL`), que **bypassea RLS**. Storage usa la service key (RLS aparte).
- ⚠️ **RLS no lo maneja Prisma**: las tablas nuevas de futuras migraciones NO heredan RLS. Tras cada `prisma migrate` correr [scripts/enable-rls.ts](../../scripts/enable-rls.ts) (`--apply`) para re-habilitarlo en las nuevas.

### NextAuth (Google OAuth)

- [src/lib/auth.ts](../../src/lib/auth.ts), [src/lib/auth-helpers.ts](../../src/lib/auth-helpers.ts)
- `requireAuth()`, `requireRole(['ADMIN' | 'MODERATOR' | 'USER'])` para proteger endpoints
- Roles via `User.role` (enum `Role`); admin se puede sembrar via `ADMIN_EMAILS`
- **Authorized Redirect URIs** que tienen que estar registrados en Google Cloud Console (cliente OAuth):
  - `https://mundobl.com.ar/api/auth/callback/google` (primario)
  - `https://mundobl.win/api/auth/callback/google` (backup; aunque el proxy redirige .win → .com.ar, conviene tenerlo por si el callback llega antes del redirect)
  - `http://localhost:3000/api/auth/callback/google` (dev)

### Display name publico (privacidad)

- `User.nickname String?` (migracion `20260509064748_add_user_nickname`).
- Helper [src/lib/user-display.ts](../../src/lib/user-display.ts) → `formatPublicName({name, nickname})` y `getInitials(...)`. Usar en TODO contexto donde otros usuarios ven el nombre (comentarios, feedback, reseñas). El sidebar/menu propio puede seguir mostrando `session.user.name` directo (uno se ve a si mismo con apellido completo).
- Fallback cuando no hay nickname: `"Nombre I."` (inicial del apellido). Si el usuario solo tiene un nombre: se muestra tal cual.
- API: `PATCH /api/user/me` body `{nickname: string | null}` para que el usuario edite su propio nickname.
- UI: input en [/perfil → ProfileSettings](../../src/app/perfil/ProfileSettings/ProfileSettings.tsx) (primer card del grid).
- **Importante para futuras queries**: cualquier `prisma.user.findX` o `select: { user: ... }` que vaya a renderizar publicamente debe incluir `nickname: true` ademas de `name: true`.

### Tags (matching sin duplicados)

- `Tag.name` es `@unique` pero el indice de Postgres es case/espacios-sensible, asi que "Enemy to Lovers" vs "enemy to lovers" eran filas distintas.
- Helpers en [src/lib/tag-utils.ts](../../src/lib/tag-utils.ts): `findOrCreateTag(client, rawName, category='trope')`, `findOrCreateGenre(client, rawName)` y `findOrCreateActor(client, rawName)`. Hacen `trim` + `findFirst({ name: { equals, mode: 'insensitive' } })` y solo crean si no existe (maneja carrera P2002). Aceptan el cliente Prisma o un `Prisma.TransactionClient`.
- **Usar siempre estos helpers** al persistir tags/generos/actores desde nombre (nunca `X.upsert({ where: { name } })` a pelo). Aplicados en [POST /api/series](../../src/app/api/series/route.ts), [PATCH /api/series/[id]](../../src/app/api/series/[id]/route.ts), [POST /api/user/series/embed/confirm](../../src/app/api/user/series/embed/confirm/route.ts) y (actores) [PATCH /api/seasons/[id]](../../src/app/api/seasons/[id]/route.ts). `POST /api/tags` rechaza duplicados case-insensitive.
- **Limpieza de duplicados existentes**: `scripts/merge-duplicate-tags.ts` y `scripts/merge-duplicate-actors.ts` (dry-run por defecto, `--apply` fusiona; reusan la logica de `/api/tags/merge` y `/api/actors/merge`). Corridos 2026-07-21: 6 tags + 5 actores fusionados (espacios al inicio/final).
- Tablas compartidas que aun usan `upsert({ where: { name } })` exacto (ProductionCompany, Language): mismo bug latente; replicar `findOrCreate*` + script de merge si aparecen duplicados.

### Bloques de informacion adicional (crear + editar)

- [SeriesInfoBlocksManager](../../src/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager.tsx) soporta 2 modos: **edicion** (prop `seriesId`, persiste via API en vivo) y **creacion** (props `pendingBlocks`/`onPendingBlocksChange`, en memoria). En creacion, [SeriesForm](../../src/components/admin/SeriesForm.tsx) adjunta `infoBlocks` al payload de `POST /api/series`, que los persiste como `SeriesInfoBlock`. Mismo patron que `SeriesContentManager` (`contentItems`).

### Web Push (notificaciones)

- Paquete `web-push`. Suscripciones en `PushSubscription` model. Server actions en [src/lib/push-server.ts](../../src/lib/push-server.ts) (si existe).

### SEO (JSON-LD + Breadcrumbs + sitemap segmentado + robots)

**JSON-LD** ([src/components/seo/JsonLd.tsx](../../src/components/seo/JsonLd.tsx) helper):

- Layout/home: `WebSite` + `Organization`
- `/series/[id]` y `/catalogo/[id]`: `TVSeries` con name, alternateName, description, image, datePublished, countryOfOrigin, inLanguage, productionCompany, numberOfSeasons, numberOfEpisodes, actor, director, genre, keywords, aggregateRating
- `/ver/[id]`: `TVSeries` simplificada con `WatchAction`
- `/catalogo`, `/ver`, `/sitios`, `/noticias`: `CollectionPage` con `ItemList` (top 20-30)
- `/actores/[id]`, `/directores/[id]`: `Person`
- `/tags/[id]`: `CollectionPage`
- Cada `<Breadcrumbs>` emite `BreadcrumbList` automaticamente

**Robots y Sitemap**:

- [src/app/robots.ts](../../src/app/robots.ts): permite contenido publico, bloquea admin/api/perfil/notificaciones/watching/auth/scanners. Apunta a `/sitemap.xml`.
- [src/app/sitemap.ts](../../src/app/sitemap.ts): usa `generateSitemaps()` para segmentar en 7 sub-sitemaps:
  - `/sitemap/0.xml` static (home, /catalogo, /ver, /noticias, /novedades, /sitios, /creditos, /legal, /feedback, /estadisticas)
  - `/sitemap/1.xml` series — solo `catalogScope: 'PERSONAL'` (las del catalogo curado)
  - `/sitemap/2.xml` noticias — solo `status: 'PUBLISHED'`
  - `/sitemap/3.xml` ver — series con al menos un `Episode.embedUrl`
  - `/sitemap/4.xml` actores
  - `/sitemap/5.xml` directores
  - `/sitemap/6.xml` tags
- Next.js genera automaticamente `/sitemap.xml` como sitemap-index que apunta a los 7.
- `lastModified` por entidad sale de `updatedAt` → acelera re-crawl de lo que cambia.

---

## Flujos de Catalogo (CURATED / USER_EMBED + PERSONAL / WATCHABLE_ONLY)

`Series` tiene dos discriminadores ortogonales:

- **`origin`** (`'CURATED'` default | `'USER_EMBED'`): quien creo el row.
  - `CURATED`: Flor (admin) la subio al catalogo.
  - `USER_EMBED`: aportada por un user registrado via `/ver/agregar`.
- **`catalogScope`** (`'PERSONAL'` default | `'WATCHABLE_ONLY'`): donde aparece publicamente.
- **`visibility`** (`'VISIBLE'` default | `'HIDDEN'`): Flor puede ocultar aportes post-hoc.
- **`submittedById`**: User que aporto la USER_EMBED (nullable; on-delete SetNull).

Matriz publica:

| origin / scope                        | /catalogo | /ver (si tiene embedUrl) | /series/[id]                  | sitemap series | sitemap ver |
| ------------------------------------- | --------- | ------------------------ | ----------------------------- | -------------- | ----------- |
| CURATED + PERSONAL                    | ✓         | ✓                        | ✓                             | ✓              | ✓           |
| CURATED + WATCHABLE_ONLY              | —         | ✓                        | ✓                             | —              | ✓           |
| USER_EMBED + WATCHABLE_ONLY (VISIBLE) | —         | ✓                        | 404 (excepto submitter/admin) | —              | ✓           |
| USER_EMBED + WATCHABLE_ONLY (HIDDEN)  | —         | —                        | 404 (excepto submitter/admin) | —              | —           |

**Campos de embed en `Episode`:** `embedUrl`, `embedPlatform`, `embedVideoId`, `embedChannelName`, `embedChannelUrl`.

**Helpers en [src/lib/database.ts](../../src/lib/database.ts):**

- `getAllSeries({ scope, origin })` — `scope: PERSONAL|WATCHABLE_ONLY|ALL`, `origin: CURATED|USER_EMBED|ALL`.
- `getWatchableSeries()` — filtra `visibility=VISIBLE` + episodios con `embedUrl` (cualquier origin).
- `getWatchableSeriesById(id)` — filtra `visibility=VISIBLE`. Variante admin: `getWatchableSeriesByIdAdmin(id)` (sin filtro).
- `getSeriesById(id)` — filtra `origin=CURATED` (USER_EMBED no se sirve por aca). Variante admin: `getSeriesByIdAdmin(id)`.
- `getActorById`, `getTagById`, `getDirectorById`, `getCountryById`, `getUniverseById`, `getCatalogFilterIndex`, `getAllActorsWithCount`, `getAllDirectorsWithCount`, `getAllUniverses` — todos filtran sus `include.series` (o `_count.series`) por `origin=CURATED, catalogScope=PERSONAL` para no exponer aportes USER_EMBED en listings publicos. Actores/tags/etc. con count=0 quedan ocultos.

**API:**

- `POST /api/series/[id]/scope` — admin cambia `catalogScope` entre PERSONAL ↔ WATCHABLE_ONLY (solo CURATED).
- `POST /api/series/[id]/subscribe`, `POST /api/reviews` — rechazan con 422 si la serie es USER_EMBED (suscripcion/resena solo despues de linkear).

### Aporte de series por users (flow USER_EMBED)

Cualquier user registrado puede agregar series embebidas via `/ver/agregar`. UI cliente: [src/app/ver/agregar/AgregarVerClient.tsx](../../src/app/ver/agregar/AgregarVerClient.tsx).

**Endpoints (en [src/app/api/user/series/embed/](../../src/app/api/user/series/embed/)):**

- `POST /api/user/series/embed/preview` — body `{ url }`. Llama `buildEmbedPreview(url)` en [src/lib/user-embed-preview.ts](../../src/lib/user-embed-preview.ts), que combina oEmbed (YouTube/Vimeo/Dailymotion) o scrape og: (Bilibili) con Gemini ([src/lib/gemini.ts](../../src/lib/gemini.ts)) para autopoblar metadata. Devuelve `EmbedPreview` con `confidence: high|medium|low`. No persiste. Dedupe global por `Episode.embedUrl` (409 con `existingSeriesId`).
- `POST /api/user/series/embed/confirm` — persiste `Series` con `origin=USER_EMBED`, `visibility=VISIBLE`, `catalogScope=WATCHABLE_ONLY`, `submittedById=session.user.id` + `Season` + `Episode`. Upsert silencioso de tablas compartidas (`Actor/ProductionCompany/Tag/Language/Genre/Country` por nombre). Rate limit ([src/lib/rate-limit.ts](../../src/lib/rate-limit.ts)): max 5/h y 20/dia por user (429 + `Retry-After`).
- Plataformas soportadas: YouTube, Vimeo, Bilibili, Dailymotion. Otras → 422.

### Panel admin `/admin/series/user-submitted`

Lista de aportes USER_EMBED con acciones de moderacion ([src/app/admin/series/user-submitted/](../../src/app/admin/series/user-submitted/)):

- `POST /api/admin/user-series/[id]/visibility` — toggle VISIBLE/HIDDEN (HIDDEN saca del listing publico, admin sigue accediendo).
- `DELETE /api/admin/user-series/[id]` — borra el aporte (cascade limpia Episodes/tags/etc.).
- `POST /api/admin/user-series/[id]/link` — transaccion que mueve los `Episode` con embedUrl al `Season` equivalente de una serie `CURATED` target (crea Season si falta, enriquece episode destino sin embed, omite duplicados) y luego borra el USER_EMBED. Es la unica forma de "promover" un aporte: no se cambia el `origin` del row, se fusiona al row CURATED existente.

`/admin/series` (la tabla curada principal) ahora filtra `origin=CURATED` para no mezclar los aportes con el catalogo de Flor.

### Vista carrusel de `/catalogo` (opt-in, no reemplaza grid/list)

Tercer `viewMode` de `CatalogoClient.tsx` (`'grid' | 'list' | 'carousel'`), elegible por el usuario vía toggle en la toolbar — el default sigue siendo `'grid'`. Filas por categoría curada a mano (no una por cada género/país/plataforma), reordenables y ocultables por el usuario vía drag-and-drop (`@dnd-kit`), persistido en `localStorage`. **No reusa** `MediaCarousel`/`StreamingHub` de `/ver` (forma de datos distinta — `SerieData` vs `CarouselMediaItem`) ni se integra con `/catalogo/dashboard` (ese es un dashboard de estadísticas con el sistema de widgets pesado, sin relación).

- **Tipos compartidos**: [src/app/(app)/catalogo/catalogTypes.ts](<../../src/app/(app)/catalogo/catalogTypes.ts>) (`SerieData`, `CatalogItem`, etc. — antes vivían inline en `CatalogoClient.tsx`).
- **Agrupación por universo**: [src/app/(app)/catalogo/catalogGrouping.ts](<../../src/app/(app)/catalogo/catalogGrouping.ts>) → `groupIntoCatalogItems()`, compartida entre la grilla clásica y la categoría "Sagas y universos" del carrusel.
- **Pool de categorías**: [src/app/(app)/catalogo/carousel/catalogCarouselCategories.ts](<../../src/app/(app)/catalogo/carousel/catalogCarouselCategories.ts>) — array fijo en código (`CarouselCategoryDef[]`: id, label i18n, filtro, sort opcional). Países curados (Tailandia/Corea/Japón) elegidos por distribución real del catálogo, no adivinados.
- **Persistencia**: `localStorage['catalog-carousel-prefs']` = `{ order: string[]; hidden: string[] }`, manejado por `useCarouselPrefs.ts` — se reconcilia contra el pool actual en cada lectura (ids viejos se descartan, ids nuevos se agregan al final), así un storage vacío/corrupto/desactualizado siempre converge a un estado válido.
- **Componentes**: `CatalogCarouselView` (orquestador), `CatalogCarouselRow` (una fila, scroll horizontal calcado de `MediaCarousel.css`), `CarouselConfigDrawer` (drawer de reorder/hide, mismo patrón que `CustomizeDrawer` de `/perfil` + drag handles de `@dnd-kit/sortable`). Las cards individuales reusan `renderSingleCard`/`renderUniverseCard` de `CatalogoClient.tsx` (pasadas como render-prop) en vez de reconstruir esa lógica.

---

## Flujos de Importacion

### 1. Import de canal a `EmbeddableContent` (existente)

- **Ruta admin**: [/admin/contenido](../../src/app/admin/contenido/)
- **Endpoint**: `POST /api/contenido/import-channel`
- **Drawer**: [src/app/admin/contenido/ImportChannelDrawer/](../../src/app/admin/contenido/ImportChannelDrawer)
- **Caso de uso**: importar trailers/OSTs/clips/entrevistas sueltas de un canal de YouTube/Vimeo
- **Destino**: tabla `EmbeddableContent` (no se asocia automaticamente a una `Series`)
- Workflow: pegar URL de canal → preview de videos → seleccionar y categorizar → guardar

### 2. Import de playlist → Series + Episodes (IMPLEMENTADO)

- **Caso de uso**: pegar una playlist de YouTube de una serie completa (ej. GMMTV) y crear `Series` (default scope `WATCHABLE_ONLY`) + `Season` + `Episode[]` con todos los `embed*` poblados.
- **Ruta admin**: [/admin/series/importar](../../src/app/admin/series/importar/) → form para pegar URL + scope + opcional traduccion ES via Gemini → preview editable (titulo, año, pais sugerido por canal, sinopsis, tabla de episodios con renumerar/eliminar) → boton confirmar.
- **Helpers**:
  - [src/lib/channel-fetcher.ts](../../src/lib/channel-fetcher.ts) → `fetchYouTubePlaylist(url, pageToken?)` + `fetchAllYouTubePlaylistVideos(url, maxPages=10)`
  - [src/lib/episode-parser.ts](../../src/lib/episode-parser.ts) → `parseEpisodeTitle(title)` extrae `seasonNumber`, `episodeNumber`, `partNumber/partTotal` (para videos partidos como `[1/4]`), `cleanTitle` sin marcadores. Cubre `EP.X`, `Episode X`, `S1E12`, `1x01`, `Capitulo X`, `E01`. `inferSeriesTitle(cleanTitles[])` deduce el nombre por prefijo comun.
  - [src/lib/playlist-importer.ts](../../src/lib/playlist-importer.ts) → `buildImportPreview({url, autoTranslate, catalogScope, maxPages})` orquesta fetch + parse + traduccion + agrupacion por temporada + deteccion de duplicados/missing. Incluye mapping de canales → pais ISO (GMMTV→TH, BeOnCloud→TH, IdeaFirstCompany→PH, etc.).
- **Endpoints**:
  - `POST /api/series/import-playlist` (admin) → devuelve `ImportPreview` sin escribir DB
  - `POST /api/series/import-playlist/confirm` (admin) → persiste tras validar uniqueness `(seasonId, episodeNumber)` en una transaccion Prisma
- **Decision de producto sobre videos partidos** (`[1/4]`, `[2/4]`...): cada video → un Episode. Si dos parsean al mismo `episodeNumber`, la UI marca duplicados como warning bloqueante; el admin debe renumerar o eliminar antes de confirmar (boton "Renumerar 1..N" disponible). No hay campos `partNumber`/`partTotal` en `Episode` — solo se exponen como Tag informativo en el preview.

### 3. Barrido de canal → playlists candidatas (IMPLEMENTADO)

Paso PREVIO al importer de playlists. El importer resuelve "tengo la URL de una serie"; el barrido resuelve "de las 200 playlists de este canal oficial, cuales son series que valen la pena". Es lo que permite escalar /ver de a decenas de series en vez de una por vez.

- **Ruta admin**: [/admin/series/barrido](<../../src/app/(app)/admin/series/barrido/>) → pegar URL de canal (o tocar uno de los atajos) → tabla de playlists clasificadas → boton "Importar" por fila que abre el importer con `?url=` ya cargado.
- **Endpoint**: `POST /api/series/sweep-channel` (ADMIN + COLLABORATOR). Solo lee, no persiste. Devuelve 503 (no 500) cuando la API key esta vencida o ausente, que es su modo de falla mas comun.
- **Helpers**:
  - [fetchYouTubeChannelPlaylists](../../src/lib/channel-fetcher.ts) → lista todas las playlists publicas de un canal (1 unidad de cuota por pagina de 50).
  - [src/lib/channel-sweep.ts](../../src/lib/channel-sweep.ts) → `sweepChannel(url, importedTitles)` clasifica cada playlist en `CANDIDATE | ALREADY_IMPORTED | NOISE | TOO_SHORT`, con el motivo en texto para que el admin pueda no creerle.
- **Por que el filtro importa tanto como el fetch**: un canal como Dee Hup House mezcla la serie completa con `Highlights | X`, `Reaction | X`, `Next Episode | X`, `Shorts | X` y hasta una playlist POR episodio (`EP.12 | X`). Importar sin filtrar llena /ver de basura. `NOISE_PREFIXES` / `NOISE_KEYWORDS` en channel-sweep.ts son la lista negra; el minimo de videos es 4 (hay BL cortos legitimos de 4-5 episodios).
- **Deteccion de "ya importada"**: por titulo normalizado (`normalizeTitle`), NO por playlistId — el importer no guarda el playlist de origen. La comparacion es por **contencion**, no por igualdad: los titulos de playlist arrastran el canal (`Bad Buddy Series | GMMTV`) o el titulo original pegado adelante (`แค่เพื่อนครับเพื่อน BAD BUDDY SERIES`). Se cruza contra TODAS las series (incluido el catalogo curado) porque si el titulo ya existe ahi el admin querra linkear en vez de duplicar — es solo lectura de titulos, no mezcla los catalogos.
- **Canales precargados**: [officialChannels.ts](<../../src/app/(app)/admin/series/barrido/officialChannels.ts>). **Todos los handles fueron verificados uno por uno contra el titulo real del canal** — los handles "obvios" son casi siempre homonimos: `@BeOnCloud` es un canal personal indonesio, `@domundi` es "Ios 23:59", `@Strongberry` es un musico centroafricano. No agregar de memoria.

---

## Reproducibilidad de embeds en /ver (`Episode.playback`)

El catalogo de /ver **se pudre solo**: las productoras licencian series a Viki/iQIYI y geo-bloquean lo que estaba abierto, YouTube pone age-gates, los uploaders borran videos. Medido el 2026-09-06 desde IP argentina sobre las 24 series con episodios de YouTube: **18 OK, 5 parciales, 1 rota**. El mensaje exacto de YouTube en las bloqueadas es "Quien subió este video no permitió que estuviera disponible en tu país".

- **Campos** (en `Episode`): `playback` (enum `EpisodePlayback`: `UNKNOWN | OK | GEO_BLOCKED | AGE_RESTRICTED | REMOVED | NOT_EMBEDDABLE`), `playbackCheckedAt`, `playbackBlockedMarkets` (subset de `CORE_MARKETS`).
- **Relacion con `Series.geoRestrictedCore`**: ese flag sigue existiendo y es a nivel serie; `playback` es por episodio. Una serie puede tener los primeros capitulos bloqueados y el resto no (patron real de GMMTV). El audit **recalcula** `geoRestrictedCore` a partir de los episodios, asi deja de ser un snapshot manual del import.
- **Helper**: [src/lib/playability.ts](../../src/lib/playability.ts) — dos fuentes, NO intercambiables:
  - `probeViaApi` (preferida): `videos.list` con `contentDetails,status`. Devuelve `regionRestriction`, que lista los paises bloqueados de TODO el mundo en una sola llamada por cada 50 videos. Necesita `YOUTUBE_API_KEY`.
  - `probeViaWatchPage`: scrapea la watch page publica. Sin API key, pero **solo sabe del pais desde el que corre el proceso** — no asumir que el resto de los mercados estan bien porque dio OK.
  - `isPlayableIn(playback, blockedMarkets, market)`: `UNKNOWN` cuenta como reproducible **a proposito** — un episodio sin sondear no se esconde de /ver, es preferible mostrar de mas a vaciar la pagina porque el audit no corrio.
- **Script**: `npx tsx scripts/audit-ver-playability.ts` (`--dry-run`, `--limit N`, `--stale N`, `--source api|watch-page`, `--market AR`). Conviene correrlo periodicamente; sondear 1.800 episodios por API cuesta ~36 de las 10.000 unidades diarias.
- **UI**: `getWatchableSeries(market)` devuelve `playableEpisodes`. /ver muestra el badge `ver.partiallyUnavailableBadge` ("{count} de {total} disponibles acá") cuando hay bloqueo parcial; el badge de bloqueo total (`geoRestrictedBadge`) gana sobre el parcial. El color va por `--text-on-overlay`, un token que **no** se redefine por tema: el chip tiene fondo oscuro siempre.
- **Pendiente**: el `market` es fijo en `'AR'`. Para que respete al visitante real hay que leer el header `x-vercel-ip-country` en `/ver/page.tsx` y pasarlo a `getWatchableSeries`.

---

## Parrilla semanal de emision (`/estrenos`)

Que serie sale cada dia de la semana. Vive en la landing como banda (entre `landing__stats` y
`landing__novedades`) y en `/estrenos` como permalink. La banda es el producto: `/` recibe 249
visitas/mes contra 134 de `/catalogo` y 4 de `/glosario` — una ruta nueva y profunda nace con el
trafico del glosario.

**El dato es `Series.airDays`, NO `Episode.airDate`.** Medido el 2026-09-12 en produccion:

|                                                                 |                                         |
| --------------------------------------------------------------- | --------------------------------------- |
| Episodios con `airDate`                                         | 1.831 de 6.933                          |
| con `airDate` en los ultimos 7 dias                             | **2**                                   |
| en los ultimos 90 dias                                          | 41 — **las 41 de una sola serie**       |
| esa serie                                                       | id 655, `USER_EMBED` + `WATCHABLE_ONLY` |
| Series con `airDays`, `year >= 2026`, creadas hace < 16 semanas | **38, todas `CURATED` + `PERSONAL`**    |

`airDate` es el `publishedAt` de YouTube: un archivo historico de subidas (2022 -> 398 episodios,
2023 -> 315, 2024 -> 201), no un feed de estrenos. Una parrilla por fecha mostraria 2 episodios de
un aporte de usuario y habria filtrado `USER_EMBED` al catalogo curado. **La query no toca esa
columna**, asi que el blindaje es estructural y no hay heuristica que calibrar.

- **Helper**: [getAiringSchedule()](../../src/lib/database.ts) — `origin='CURATED'` +
  `catalogScope='PERSONAL'` + `visibility='VISIBLE'` explicitos. Payload podado a 9 campos
  (~8 KB): sin `synopsis`, `review`, `seasons`, `tags` ni `genres`.
- **Logica pura**: [src/lib/airing-schedule.ts](../../src/lib/airing-schedule.ts) — `AIR_DAY_MAP`,
  `parseAirDays`, `groupByWeekday`, `getAirDayStatus`. Se extrajo de
  `CurrentlyWatchingDashboard.tsx`, que la tenia privada y con las etiquetas en español
  hardcodeadas dentro de un componente traducido a 10 idiomas.
- **Componente**: [WeeklySchedule](../../src/components/estrenos/WeeklySchedule/WeeklySchedule.tsx) —
  sin texto propio (recibe `labels` via `useWeeklyScheduleLabels`), reusa `MediaCard` y `Chip`
  del design-system.

**Ventana de vigencia (`AIRING_WINDOW_WEEKS = 16`)**: `airDays` nunca se apaga — una serie que
termino en mayo sigue diciendo "jueves" para siempre, y publicar un horario falso es peor que no
publicar nada. Flor carga la serie cuando empieza a emitirse y una temporada BL dura 10-14
semanas. **La ventana caduca sola**: el error, cuando ocurre, es por omision (una serie muy larga
desaparece), nunca por afirmacion falsa. Cuando moleste, el reemplazo es `Series.airingUntil
DateTime?` (columna aditiva, override manual del admin) y `isAiringNow` gana una linea.

**Lo que la parrilla NO afirma, a proposito**: numero de capitulo (derivarlo de `createdAt` +
cadencia seria inventarlo), hora de emision (no existe el campo) ni "ya esta disponible"
(ninguna de las 38 tiene embed).

**Trampa de hidratacion**: "hoy" NO se calcula en el servidor. Con ISR y Vercel en UTC, el dia
queda congelado en el cache y da mal para un argentino despues de las 21:00. `WeeklySchedule` usa
`useSyncExternalStore` con `getServerSnapshot` devolviendo un centinela: el SSR renderiza lunes ->
domingo sin marca de hoy, y el cliente rota el orden con su dia real.

**Aviso de capitulo nuevo**: implementado el 2026-10-24 como aviso `air_day` a partir de `Series.airDays` (no de `airDate` por episodio), en `/api/cron/alerts`. Ver "Aviso de estreno y resumen semanal" arriba.

---

## Rol de colaborador externo (`COLLABORATOR`)

Cuarto valor del enum `Role` (junto a `ADMIN`/`MODERATOR`/`VISITOR`), pensado para productoras/proveedores de contenido externos (ej. XUXY) que Flor evalua y aprueba a mano — **nunca autoservicio**: solo un ADMIN asigna este rol desde `/admin/usuarios` (`PUT /api/users/[id]/role`).

- **Acceso**: admin reducido en `/admin/colaborador/**`, gateado en [src/proxy.ts](../../src/proxy.ts) — un COLLABORATOR no puede entrar a ningun otro `/admin/*` (redirect a `/catalogo`); si intenta, cae directo a `/admin/colaborador`. El resto de `/admin` sigue exactamente igual que antes (ADMIN/MODERATOR).
- **3 vistas** en [src/app/(app)/admin/colaborador/](<../../src/app/(app)/admin/colaborador/>):
  - `/admin/colaborador` — listado de series propias (`ColaboradorClient.tsx`), filtra `origin=USER_EMBED, submittedById=self`.
  - `/admin/colaborador/importar` — reusa [ImportarClient](../../src/app/admin/series/importar/ImportarClient.tsx) (`variant="collaborator"`): mismo flujo de playlist de YouTube que el importer de ADMIN, **pura YouTube Data API, sin Gemini** salvo que el propio colaborador tilde "traducir sinopsis" (una llamada por serie, no por video — no consume cuota relevante de `GEMINI_API_KEY`).
  - `/admin/colaborador/[id]` — ficha reducida (`CollaboratorSeriesForm.tsx`): titulo/sinopsis/poster/pais/productora/actores/tags/generos + [SeriesInfoBlocksManager](../../src/components/admin/SeriesInfoBlocksManager/SeriesInfoBlocksManager.tsx) embebido (mismo componente que usa ADMIN) + tabla de episodios (solo lectura, con link a "importar mas"). **No** expone campos curatoriales (`featured`, `review`, `overallRating`, `notesPrivate`, universo, series relacionadas — esos siguen 100% ADMIN-only).
- **Endpoints propios**: `POST /api/series/import-playlist(/confirm)` aceptan `COLLABORATOR` ademas de `ADMIN` y fuerzan server-side `origin=USER_EMBED`, `catalogScope=WATCHABLE_ONLY`, `submittedById=session.user.id` (ignoran lo que mande el body); `PATCH /api/colaborador/series/[id]` (ficha reducida). `DELETE /api/admin/user-series/[id]` y los 3 endpoints de `info-blocks` (`/api/series/[id]/info-blocks`, `/api/series/info-blocks/[id]`, `/api/series/[id]/info-blocks/reorder`) tambien aceptan `COLLABORATOR` sobre su propio aporte.
- **Ownership guard reusable**: [src/lib/collaborator-guard.ts](../../src/lib/collaborator-guard.ts) → `assertSeriesOwnership(seriesId, auth)` / `assertInfoBlockOwnership(blockId, auth)`. ADMIN/MODERATOR pasan siempre (mismo comportamiento pre-COLLABORATOR); COLLABORATOR solo si `origin=USER_EMBED && submittedById === auth.userId`. Usar en cualquier endpoint nuevo que un colaborador pueda tocar, siempre despues de `requireRole([...])`.
- **Rate limit propio**: [checkCollaboratorImportRateLimit](../../src/lib/rate-limit.ts) — 200 series/dia (vs. 5/hora + 20/dia de `checkUserEmbedRateLimit` para aportes casuales de usuarios comunes), pensado para onboarding masivo de un catalogo completo en pocas sesiones.
- **Chequeo de edad de YouTube** (defensa extra, no reemplaza la vetting manual del rol): [checkYouTubeAgeRestriction](../../src/lib/channel-fetcher.ts) — batchea `videos.list?part=contentDetails` de a 50 ids, lee `contentRating.ytRating === 'ytAgeRestricted'`. Solo se activa (`checkAgeRestriction: true`) para el importer de COLLABORATOR. Los videos marcados aparecen con warning y **des-tildados por defecto** en el preview (columna "Incluir" en `ImportarClient`, solo visible si hay al menos un episodio marcado) — el colaborador puede volver a tildarlos.
- **Publicacion**: inmediata (`visibility` default `VISIBLE`, igual que el resto de `Series.create` sin override explicito) — a diferencia de `/ver/agregar` para usuarios comunes, que arranca en `PENDING_REVIEW` si el submitter no es ADMIN/MODERATOR (ver `POST /api/user/series/embed/confirm`). La distincion es deliberada: COLLABORATOR ya paso por vetting humano al recibir el rol, un VISITOR anonimo no. Moderacion post-hoc sigue disponible en `/admin/series/user-submitted` (hide/delete/link) para AMBOS casos — ese panel ahora tambien muestra un tag "Colaborador" junto al nombre cuando el submitter tiene el rol.
- **Reseñas y suscripcion habilitadas en USER_EMBED** (antes solo reseñas estaban bloqueadas con 422): decision de Flor al construir este feature — "mientras no afecte al catalogo curado". Las vidrieras publicas que agregaban reseñas SIN filtrar `origin` (spotlight + contador de la landing en [src/app/page.tsx](../../src/app/page.tsx)) se corrigieron para excluir `USER_EMBED`. La UI de rating+reseñas se agrego a `/ver/[id]` ([VerSerieClient.tsx](<../../src/app/(app)/ver/[id]/VerSerieClient.tsx>)), condicionada a `isUserEmbed` (para CURATED+WATCHABLE_ONLY ya existe en `/series/[id]` via "Ver ficha completa", no se duplica). Favoritos y "marcar visto" ya funcionaban sobre USER_EMBED desde antes — no fue necesario tocarlos.
- **Sidebar**: item propio "Mi panel de colaborador" (`sidebar.collaboratorPanel`, i18n a 10 locales) visible solo para `role=COLLABORATOR`, en vez del item "Administracion" (que sigue sin mostrarse a este rol). Label de rol (`adminUsers.roleCollaborator`) tambien i18n'd — es el unico string nuevo de este feature que paso por los 10 locales: **el resto de `/admin/colaborador/**`queda hardcodeado en español**, mismo criterio que el resto de`/admin/\*` (`ImportarClient`, `UserSubmittedClient`, `SeriesForm`, etc. — ninguno usa `useLocale()`; el admin es una herramienta interna de Flor, no contenido público).
- **Upload de imagenes**: `POST /api/upload` ahora acepta `COLLABORATOR` ademas de `ADMIN`/`MODERATOR` (mismo endpoint, sin distincion de carpeta).

---

## Principios de Desarrollo

### SOLID

- **Single Responsibility**: Cada componente/archivo hace una sola cosa
- **Open/Closed**: Componentes extensibles via props
- **Liskov Substitution**: Componentes intercambiables via interfaces
- **Interface Segregation**: Props especificas, no interfaces genericas
- **Dependency Inversion**: Inyeccion de dependencias via props

### DRY & Buenas Practicas

- No repetir logica: extraer a helpers en `src/lib/` o hooks en `src/hooks/`
- Componentes reutilizables en `src/components/common/`
- Tipos compartidos en `src/types/`
- Constantes en `src/constants/`
- No usar `any` en TypeScript, usar tipos especificos o `unknown`

### Estilos

- **NO usar CSS-in-JS**. Estilos en archivos `.css` separados por componente
- Usar variables CSS definidas en `src/styles/variables.css`
- Temas claro/oscuro via atributo `[data-theme]` en HTML
- Preferir variables CSS sobre valores hardcodeados:
  ```css
  background: var(--bg-base);
  color: var(--text-primary);
  padding: var(--spacing-md);
  ```
- Tema de Ant Design configurado en `src/lib/theme.config.ts`

### Componentes

- Funcionales con hooks (no clases)
- Exportar con nombre (no default export)
- Props con interfaz TypeScript explicita
- Cada componente tiene su carpeta: `Component.tsx` + `Component.css`
- Usar componentes de Ant Design antes de crear personalizados
- Importar Ant Design individualmente: `import { Button, Input } from 'antd'`

### Nomenclatura

- Componentes: **PascalCase** (`SearchBar`, `PageTitle`)
- Archivos componentes: **PascalCase**, utilidades: **camelCase**
- Variables CSS: **kebab-case** (`--primary-color`, `--spacing-md`)
- Funciones: **camelCase** (`handleSearch`, `formatearFecha`)

---

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raiz (Ant Design + ThemeProvider)
│   ├── page.tsx                  # Home → redirige a /catalogo
│   ├── api/                      # API REST endpoints
│   │   ├── series/               # CRUD series + ratings, comments, favorites, view-status, search
│   │   ├── seasons/              # CRUD temporadas + ratings, comments
│   │   ├── episodes/             # CRUD episodios + view-status, comments, generate
│   │   ├── actors/               # CRUD actores + merge duplicados
│   │   ├── directors/            # CRUD directores + merge duplicados
│   │   ├── tags/                 # CRUD tags + merge duplicados
│   │   ├── universes/            # CRUD universos
│   │   ├── languages/            # CRUD idiomas
│   │   ├── production-companies/ # CRUD productoras
│   │   ├── countries/            # Lectura paises
│   │   ├── genres/               # CRUD generos
│   │   ├── currently-watching/   # Series en curso (filtrado por usuario)
│   │   ├── contenido/            # CRUD contenido embebible + import de canales
│   │   ├── sitios/               # CRUD sitios recomendados + sugeridos
│   │   ├── feature-requests/     # Feedback + votos
│   │   ├── upload/               # Subida de imagenes (Supabase Storage)
│   │   ├── users/                # Gestion de usuarios
│   │   ├── admin/                # Logs, info del proyecto (solo admin)
│   │   ├── changelog/            # Changelog publico
│   │   └── build-info/           # Info de build/version
│   ├── catalogo/                 # Catalogo personal publico (scope PERSONAL)
│   │   ├── page.tsx              # Server component: fetch series
│   │   ├── CatalogoClient.tsx    # Client component: filtros, busqueda, paginacion
│   │   └── [id]/                 # Detalle de serie
│   ├── ver/                      # Catalogo "ver completo" (series con embedUrl)
│   │   ├── page.tsx              # Server: fetch via getWatchableSeries
│   │   ├── VerPage.tsx           # Client: filtros (busqueda, pais, plataforma, toggle "solo curadas")
│   │   ├── agregar/              # /ver/agregar - aporte user-embed (login-gated, IA autopobla)
│   │   └── [id]/                 # Player con seleccion de episodio (badge submitter para USER_EMBED)
│   ├── creditos/                 # Atribucion a canales oficiales (YouTube, etc.)
│   ├── legal/                    # Aviso legal sobre embeds y derechos
│   ├── contenido/                # Pagina publica de contenido embebible
│   ├── sitios/                   # Pagina publica de sitios recomendados
│   ├── admin/                    # Panel de administracion
│   │   ├── page.tsx              # Tabla de series
│   │   ├── series/nueva/         # Crear serie
│   │   ├── series/[id]/editar/   # Editar serie
│   │   ├── series/user-submitted/# Panel de moderacion de aportes USER_EMBED (hide/delete/link)
│   │   ├── actores/              # Gestion actores
│   │   ├── directores/           # Gestion directores
│   │   ├── tags/                 # Gestion tags
│   │   ├── universos/            # Gestion universos
│   │   ├── idiomas/              # Gestion idiomas
│   │   ├── productoras/          # Gestion productoras
│   │   ├── sitios/               # Gestion sitios recomendados
│   │   ├── contenido/            # Gestion contenido embebible + import canales
│   │   ├── usuarios/             # Gestion usuarios y roles
│   │   ├── logs/                 # Access logs con filtros clickeables
│   │   └── info/                 # Info del proyecto (links, equipo)
│   ├── feedback/                 # Feedback + Changelog
│   ├── actores/[id]/             # Perfil de actor
│   ├── directores/[id]/          # Perfil de director
│   ├── series/[id]/              # Detalle de serie (publica)
│   └── watching/                 # Dashboard "Viendo ahora"
├── components/
│   ├── layout/                   # AppLayout, Header, Sidebar, BottomNav
│   ├── common/                   # PageTitle, SearchBar, CommentsList, EmbedPlayer,
│   │                             # ContentDisclaimer, CountryFlag
│   ├── series/                   # SeriesHeader, SeriesInfo, SeasonsList, EpisodesList,
│   │                             # RatingSection, CommentsSection, ViewStatusToggle
│   ├── admin/                    # SeriesForm, SeasonForm, SeasonEditForm, SeriesContentManager
│   └── watching/                 # CurrentlyWatchingDashboard
├── lib/
│   ├── database.ts               # Helpers de acceso a DB (Prisma)
│   ├── supabase.ts               # Cliente Supabase Storage (upload/delete/downloadAndUpload)
│   ├── auth.ts                   # Configuracion NextAuth
│   ├── auth-helpers.ts           # requireAuth, requireRole
│   ├── access-log.ts             # Registro y consulta de access logs
│   ├── embed-helpers.ts          # Helpers para contenido embebible (YouTube, etc.)
│   ├── channel-fetcher.ts        # Importacion de videos de canales de YouTube
│   ├── country-codes.ts          # Codigos de pais
│   ├── theme.config.ts           # Configuracion tema Ant Design
│   ├── utils.ts                  # Utilidades generales
│   └── providers/ThemeProvider.tsx
├── hooks/                        # useMediaQuery, useMessage
├── types/                        # series.types.ts, content.ts, person.types.ts, theme.types.ts
├── constants/                    # navigation.ts, series.ts, sitios.ts
├── styles/                       # globals.css, variables.css, dark-mode-fixes.css
└── generated/prisma/             # Cliente Prisma generado (no editar)
```

---

## Patron de Datos (Server → Client)

```
page.tsx (Server Component)
  → Llama a src/lib/database.ts (Prisma query)
  → Pasa datos como props a *Client.tsx (Client Component)
  → Client Component maneja interactividad y estado
  → Cambios del usuario → API call (fetch a /api/*) → Actualizar UI
```

### Acceso a Base de Datos

```typescript
// En Server Components o API routes:
import {
  getAllSeries,
  getSeriesById,
  searchSeriesByTitle,
} from '@/lib/database';

// Funciones disponibles:
// Series: getAllSeries, getSeriesById, searchSeriesByTitle, getSeriesByCountry, getSeriesByType
// Actores: getAllActors, getActorById, searchActorsByName, getAllActorsWithCount
// Directores: getAllDirectors, getDirectorById, searchDirectorsByName, getAllDirectorsWithCount
// Paises: getAllCountries, getCountryById
// Universos: getAllUniverses, getUniverseById
// Stats: getStats, getViewStats
```

---

## Base de Datos (Prisma + Supabase)

### Schema: `prisma/schema.prisma`

**Modelos principales:**

- `Series` - Series/peliculas/cortos. Campos discriminadores: `catalogScope` (`PERSONAL` | `WATCHABLE_ONLY`), `origin` (`CURATED` | `USER_EMBED`), `visibility` (`VISIBLE` | `HIDDEN`), `submittedById` (User ref nullable)
- `Season` - Temporadas por serie
- `Episode` - Episodios. Campos de embed: `embedUrl`, `embedPlatform`, `embedVideoId`, `embedChannelName`, `embedChannelUrl`
- `Actor` - Actores
- `Director` - Directores
- `Country` - Paises

**Modelos de relacion:**

- `SeriesActor`, `SeasonActor` - Actores por serie/temporada (con pairingGroup)
- `SeriesDirector` - Directores por serie
- `SeriesTag` - Tags por serie
- `SeriesGenre` - Generos por serie
- `SeriesDubbing` - Idiomas de doblaje
- `RelatedSeries` - Series relacionadas (bidireccional)

**Modelos de metadata:**

- `Universe` - Agrupacion de series relacionadas
- `Tag` - Etiquetas (tropes, genres, moods)
- `Genre` - Generos
- `ProductionCompany`, `Language`
- `Rating` - Calificaciones por categoria (trama, casting, BSO, etc.)
- `UserRating` - Calificaciones de usuarios
- `Comment` - Comentarios en serie/temporada/episodio (con userId)
- `ViewStatus` - Estado de visualizacion (`WatchStatus` enum, por usuario)

**Modelos de contenido:**

- `SeriesInfoBlock` - Cards labeladas libres por serie ("Basado en", "Curiosidades", "Premios"...). Render publico solo si tiene contenido. Editables desde `/admin/series/[id]/editar` via `SeriesInfoBlocksManager`.
- `EmbeddableContent` - Contenido embebido (trailers, OSTs, entrevistas)
- `RecommendedSite` - Sitios recomendados curados por admin
- `SuggestedSite` - Sitios sugeridos por la comunidad
- `WatchLink` - Plataformas donde ver cada serie

**Modelos de feedback:**

- `FeatureRequest` - Solicitudes de bugs/features/ideas con status y prioridad
- `FeatureRequestImage` - Imagenes adjuntas a solicitudes
- `FeatureVote` - Votos de usuarios en solicitudes

**Modelos de sistema:**

- `User`, `Account`, `Session`, `VerificationToken` - NextAuth
- `AccessLog` - Visitas (solo ruta y hora, sin IP ni usuario), intentos de ataque (`ABUSE`, con IP, se borran a los 7 dias), acciones del equipo y corridas del cron. El cron diario borra el resto a los 90 dias (ver `/privacidad`)
- `BannedIp` - IPs bloqueadas

**Enums:**

- `Role` - USER, MODERATOR, ADMIN
- `WatchStatus` - SIN_VER, VIENDO, VISTA, ABANDONADA, RETOMAR

### Migraciones

```bash
# Generar cliente Prisma despues de cambios al schema
npx prisma generate

# Crear migracion SOLO contra PostgreSQL local (DIRECT_URL local)
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en produccion: a mano y ANTES del deploy (workflow "Deploy produccion").
# El build de Vercel no migra: si el codigo llega antes que las tablas, prod se rompe (paso en #87).
npm run migrate:supabase

# Ver estado de migraciones
npx prisma migrate status

# Verificar que la base coincide con el schema (solo lectura)
npm run db:check

# Abrir Prisma Studio (UI para explorar datos)
npx prisma studio
```

**Nota:** El build command en Vercel es `prisma generate && next build --webpack`. Prisma genera el cliente automaticamente antes de cada build.

---

## Guia de Cambios Comunes

### Agregar una nueva pagina

1. Crear carpeta en `src/app/nombre-pagina/`
2. `page.tsx` (Server Component) - fetch de datos
3. `NombreClient.tsx` (Client Component) - UI interactiva
4. `nombre.css` - Estilos
5. Agregar ruta en `src/constants/navigation.ts`

### Agregar un nuevo componente

1. Crear carpeta en `src/components/categoria/NombreComponente/`
2. `NombreComponente.tsx` - Logica
3. `NombreComponente.css` - Estilos
4. Exportar con nombre: `export function NombreComponente()`

### Agregar un endpoint API

1. Crear `src/app/api/recurso/route.ts`
2. Exportar funciones HTTP: `GET`, `POST`, `PUT`, `DELETE`
3. Proteger con `requireAuth()` o `requireRole(['ADMIN'])`
4. Usar helpers de `src/lib/database.ts` o Prisma directo
5. Retornar `NextResponse.json()`

### Modificar filtros del catalogo

- Filtros estan en `src/app/catalogo/CatalogoClient.tsx`
- Tipos de filtro en `src/types/series.types.ts`

### Modificar tema/estilos globales

- Variables CSS: `src/styles/variables.css`
- Tema Ant Design: `src/lib/theme.config.ts`
- Skins: `src/styles/skins/<nombre>.css` (ver "Sistema de skins" abajo)
- Dark mode fixes: `src/styles/dark-mode-fixes.css` (limpiado a 113 lineas, sin `!important`. Solo quedan reglas para componentes que AntD no expone como token)

---

## Sistema de skins

Las skins son una dimension visual ortogonal a `theme` (light/dark), `tone` (default/warm/cool/contrast), `accent` (los 11 presets) y `density`. Una skin remapea los tokens base (`--bg-*`, `--text-*`, `--border-*`, `--radius-*`, `--shadow-*`) a una paleta nueva, y opcionalmente aplica overrides al shell (sidebar, topbar, content area).

**Skins disponibles:**

| Skin      | Archivo                                                                      | Cuando aplica                                                                                                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default` | (sin archivo)                                                                | Default — usa tokens base de [variables.css](../../src/styles/variables.css)                                                                                                                                                               |
| `premium` | [src/styles/skins/premium-dark.css](../../src/styles/skins/premium-dark.css) | Solo cuando `data-theme='dark'`. Paleta premium dark (`#090911`/`#11101d`/`#171423`/`#211b32`), bordes sutiles `rgba(255,255,255,0.06–0.14)`, sombras soft, radii 14/18. Expone tambien `--mb-*` para componentes nuevos del design-system |

**Como agregar una skin nueva:**

1. Crear `src/styles/skins/<nombre>.css` con `html[data-skin='<nombre>'] { ... }`
2. Importarla en [src/styles/skins/index.css](../../src/styles/skins/index.css)
3. Agregar la key a `SkinKey` en [src/types/theme.types.ts](../../src/types/theme.types.ts)
4. Sumar la opcion al toggle en [src/components/layout/SettingsPanel/SettingsPanel.tsx](../../src/components/layout/SettingsPanel/SettingsPanel.tsx)
5. Agregar las claves i18n `settings.skinDefault`/`<nombre>` en `messages.ts` y los 10 locales
6. Si la skin requiere tokens distintos en AntD ConfigProvider (Layout, Modal, Tooltip), extender `buildTheme(mode, accent, skin)` en [src/lib/theme.config.ts](../../src/lib/theme.config.ts)

**ATENCION sobre el accent dorado de la skin premium:** NO esta hardcodeado. El "dorado" sale del accent que el usuario eligio en Settings (en este caso, probablemente `amber`). Si se elige otro accent, la skin sigue siendo coherente — los items selected/focus/primary toman el accent del usuario via `--primary-color`. Cualquier hex tone-of-brand hardcodeado en componentes nuevos rompe esto: usar siempre tokens.

---

## Design system primitivos

[src/components/design-system/](../../src/components/design-system/) — primitivos sin texto hardcodeado (cada componente recibe el texto via props/children traducidos por la pagina).

| Componente      | Cuando usar                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `PanelCard`     | Wrapper de `Card` con variant (default/soft/flat) + slots header/footer. Reemplaza `<Card>` directos en paginas refactorizadas   |
| `SectionHeader` | Title + subtitle + actions, 3 sizes (sm/md/lg), heading semantico ajustable                                                      |
| `StatCard`      | Label + value + delta (up/down/neutral) + icon. Para KPIs de paneles                                                             |
| `ActionCard`    | Icon + title + description + badge. Para grids de quick actions                                                                  |
| `MediaCard`     | Cover (aspect ratio 2:3 default, 16:9, 1:1) + title + subtitle + overlay tags + actions on hover. Para grids de series/peliculas |
| `Chip`          | Pills con tones (neutral/accent/success/warning/error/info), opcional toggle clickable                                           |
| `EmptyState`    | Icon + title + description + action. Para listas vacias                                                                          |

Convencion: ningun primitivo contiene texto fijo, ningun hex de marca. Todo via tokens CSS y props.

---

## Sistema de dashboards modulares

Cada vista premium se monta como un grid responsive de **widgets reordenables y resizables**. Cada usuario puede customizar su layout y se sincroniza entre dispositivos via DB.

**Stack:**

- `react-grid-layout@2.x` (~80kb gzipped). API v2 sin `WidthProvider` — usa el hook `useContainerWidth`.
- Persistencia: localStorage como cache + DB (model `UserDashboardLayout`) como source of truth cross-device.

**Arquitectura:** [src/components/dashboard/](../../src/components/dashboard/)

- `DashboardGrid` — wrapper de `Responsive` de react-grid-layout. Recibe `layouts` por breakpoint (lg/md/sm/xs/xxs), `widgetProps` por id, flag `editing`, callbacks `onLayoutsChange` + `onRemoveWidget`.
- `Widget` — panel premium con header (icono + title + actions), drag handle (visible solo en editing) y remove btn. Si vive en un grid, lee meta via `DashboardItemContext`; si no, acepta props.
- `WidgetRegistry` — registro singleton donde cada feature registra sus widgets con id + categoria + roles + modos + defaultSize + Component.
- `useDashboardLayout(key, defaults)` — hook con persistencia 3-capas (server > localStorage > defaults). Debounce 600ms al server. Si no auth, cae a localStorage solo.
- `DashboardEditToolbar` — toggle "Editar layout"/"Listo" + "Agregar widget" + "Reset".
- `WidgetPickerDrawer` — drawer con widgets del registry filtrados por roles/modo/categoria.

**Vistas dashboard implementadas (todas opt-in via URL alterna, la vista clasica queda intacta):**

| Vista             | Ruta                       | Widgets                                                                                                                                                                                                                                                                                                       | dashboardKey    |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Perfil de usuario | `/perfil` (= dashboard)    | Overview, Ratings, RecentlyCompleted, Notifications, MyCases, Heatmap, GenresDonut, CompletedByYear, TopGenresList, TopCountriesList, CurrentlyWatching, TopActors, TopCompanies, TopRated, Favorites, MyReviews, MyDisputes, MyComments. Footer: ProfileSettings + SubscriptionsSection + ClientVersionInfo. | `profile-v3`    |
| Detalle de titulo | `/catalogo/[id]/dashboard` | Hero, Info, Actors, Ratings                                                                                                                                                                                                                                                                                   | `series-detail` |
| Catalogo          | `/catalogo/dashboard`      | Stats globales, RecentlyAdded                                                                                                                                                                                                                                                                                 | `catalogo`      |
| Admin home        | `/admin/dashboard`         | KPIs, Alerts                                                                                                                                                                                                                                                                                                  | `admin-home`    |

**Convencion `fade` en Widgets:** los widgets cuyo contenido puede exceder la altura del cell del grid pasan `fade={true}` al `<Widget>` para activar un degradado fade-out abajo. Reemplaza el `overflow: auto` previo (scrollbar interno feo). Casos: listas largas (RecentlyCompleted, CurrentlyWatching, Notifications, MyCases, TopActors, etc.) y MyCommentsWidget que sí mantiene scroll interno explícitamente porque su lista paginada no se presta al fade.

**Layout footer del dashboard de perfil:** abajo del grid se renderizan `ProfileSettings` + `SubscriptionsSection` + `ClientVersionInfo` como bloque fijo (no son widgets reordenables — son singletons que se esperan en una posicion estable). Ver `mb-perfil-dashboard__footer*` en [dashboard.css](../../src/app/perfil/dashboard/dashboard.css).

**Como agregar una vista dashboard nueva:**

1. Crear `src/app/<ruta>/dashboard/page.tsx` (Server Component) que fetchea data y pasa al Client.
2. Crear `DashboardClient.tsx` (Client) que: (a) registra los widgets en `WidgetRegistry` con `useMemo`; (b) usa `useDashboardLayout('<key>', DEFAULT_LAYOUTS)`; (c) pasa `widgetProps` a `<DashboardGrid>`.
3. Crear cada widget en `widgets/<NombreWidget>/<NombreWidget>.tsx` envolviendo el contenido en `<Widget>`. Recibir datos por props.
4. Agregar las i18n keys del dashboard (`<vista>Dashboard.*`) al shape de `messages.ts` y los 10 locales.
5. Agregar un link "Ver dashboard" desde la vista clasica.

**Persistencia DB:** [src/app/api/user/dashboards/[key]/route.ts](../../src/app/api/user/dashboards/[key]/route.ts) — GET/PUT/DELETE. Scoped por `session.user.id`. El hook `useDashboardLayout` hace write-through automatico cuando el usuario esta autenticado.

### Agregar una integracion externa (API de terceros)

1. Agregar la env var en `.env.example` con un comentario describiendo el uso
2. Agregar la env var en Vercel (production)
3. Crear el helper en `src/lib/<nombre>-fetcher.ts` o `src/lib/<servicio>.ts`
4. Documentar en este archivo (`context.md`) bajo "Integraciones Externas":
   - Que env var necesita
   - Que helper expone (signature + ejemplo de retorno)
   - Que casos de uso cubre y cuales NO
5. Si genera datos persistidos, mencionar el modelo Prisma destino

### Mantener `context.md` al dia

**Regla**: cada vez que se agrega una feature, integracion, modelo, env var, ruta nueva o flujo, actualizar este archivo en el mismo PR. Los flujos paralelos (ej. `/catalogo` vs `/ver`) deben quedar documentados con su scope, helpers y diferencias.

---

## Backlog (FeatureRequest)

El backlog vive en la tabla `FeatureRequest` (`/feedback`, `/admin/feedback`), no en docs. Al 2026-10-28: 1 OPEN, 1 IN_PROGRESS, 151 COMPLETED. Lo que el código todavía no tiene está en [pendientes.md](../pendientes.md).

- `Series` tiene score de completitud: [src/lib/series-completeness.ts](../../src/lib/series-completeness.ts) (`computeCompleteness(series) → { score, missing }`), con `CompletenessCard` en `/admin/series/[id]`.
- `Director` tiene `aliases`, `imdbUrl`, `mdlUrl`, `wikiUrl`, `birthYear` y `awards`; la ficha pública muestra "Obras destacadas" solo si ≥2 series tienen rating.

---

## Notas técnicas / gotchas

- **Imágenes externas sin re-hostear (08/10/2026)**: `isDirectServedImageUrl` también sirve directamente hosts que no están en `OPTIMIZED_IMAGE_HOSTS` (lista compartida con `next.config.ts`). Evita el 400 de `/_next/image` cuando falla la copia a R2; caso real: Fandom en `/series/717-decoding-you`, que permite cargar en el navegador pero rechaza la descarga del servidor. `isStoredImageUrl` identifica exclusivamente R2/Supabase para decidir si hay que re-hostear; no usar la política de visualización para saltear subidas. Regresión: `npx tsx scripts/test-image-delivery.ts`.

- **Íconos de antd en Server Components**: importar de `@ant-design/icons` en un Server Component ROMPE el build (`createContext is not a function`): su barrel corre `createContext` sin `'use client'` y el entorno RSC no tiene `createContext`. Regla: en Server Components (page.tsx/layout/loading sin `'use client'`), importar íconos desde [src/lib/client-icons.ts](../../src/lib/client-icons.ts) (re-export `'use client'`). Los Client Components pueden importar de `@ant-design/icons` directo. Mismo motivo por el que el `App` de antd se usa vía [src/lib/providers/AntdApp.tsx](../../src/lib/providers/AntdApp.tsx), no importado en el layout server. `next.config.ts` NO debe poner `antd`/`@ant-design/icons` en `transpilePackages` (anula el barrel-optimization y reintroduce el crash); se usa `experimental.optimizePackageImports` en su lugar.
- **Headers de seguridad**: [next.config.ts](../../next.config.ts) `headers()` define CSP completa + `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`. `img-src` es amplio (`'self' data: blob: https:`) a propósito: cargamos favicons externos (Google S2 via `getFaviconUrl`) y URLs de imagen legacy; restringirlo por host rompe logos/favicons (ej. /sitios). `frame-src` SÍ es lista blanca de los embeds soportados (clickjacking) — al sumar una plataforma de embed nueva, agregar su host ahí. `form-action` incluye `https://accounts.google.com`: la página genérica `/api/auth/signin` (adonde el proxy manda a quien entra a `/admin` sin sesión) postea un form que termina en un 302 a Google, y Chrome chequea `form-action` en cada salto; sin ese host el login desde ahí se bloquea. Un proveedor OAuth nuevo necesita su host ahí también. `images.remotePatterns` (para next/image optimizado) es independiente y sí es por-host.
- **RLS (Supabase)**: toda tabla nueva del schema `public` debe recibir `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY` en su migración (Prisma usa el rol owner que bypassa RLS; sin esto la anon key expone la tabla vía PostgREST). Patrón en `prisma/migrations/*_enable_rls*`.
- **Ban en API**: `requireAuth`/`requireRole` ([src/lib/auth-helpers.ts](../../src/lib/auth-helpers.ts)) chequean `banned` → 403. El middleware (`proxy.ts`) no cubre `/api` (su matcher lo excluye).
- **Storage de imagenes**: todo pasa por `uploadImage()` en [src/lib/supabase.ts](../../src/lib/supabase.ts) — es el unico punto de subida (`/api/upload`, `/api/feedback/upload` y el re-hosteo de imagenes externas). Sube solo a **Cloudflare R2**; sin las 5 vars `R2_*` la subida falla (desde 2026-09-29; antes caia a Supabase Storage, que cobra egress). Supabase Storage queda para leer y borrar imagenes viejas. `downloadAndUploadExternalImage` no re-procesa una URL que ya servimos nosotros — chequea los DOS hosts, si no cada guardado de una serie duplicaria el poster.
- **Convención `unoptimized` en `<Image>`**: `unoptimized={isDirectServedImageUrl(url)}` (R2/Supabase y hosts externos no admitidos se sirven directo; solo los CDNs de OPTIMIZED_IMAGE_HOSTS van al optimizador). NO invertir con `!`. Desde 2026-09-09 los posters viven en Cloudflare R2 (`img.mundobl.com.ar`), no en Supabase Storage: R2 no cobra egress y ya sale por el CDN de Cloudflare con `cache-control: immutable` a un año, asi que pasarlo por el optimizador de Vercel solo gastaria cuota. El helper cubre los dos hosts porque los archivos de Supabase quedaron como respaldo.
- **Rate limiting**: [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) — `checkCommentRateLimit`, `checkFeatureRequestRateLimit`, `checkUserEmbedRateLimit` (cuenta filas Prisma por ventana, sin tabla auxiliar).
- **Orden de estilos antd vs. los nuestros**: con SSR, el `<style>` de antd llega en el stream después de nuestras hojas y, a igual especificidad (`:where(.css-x).ant-*`), les gana. [src/lib/providers/AntdStyleOrder.tsx](../../src/lib/providers/AntdStyleOrder.tsx) (adentro de `AntdRegistry`) lo mueve antes del primer `<link data-precedence>`. No usar `layer` de cssinjs: el reset `* { margin: 0; padding: 0 }` de `globals.css` sin capa pisaría todo antd.
- **Botón atrás**: [NavigationGuard](../../src/components/layout/NavigationGuard/NavigationGuard.tsx) inyecta una entrada "padre" cuando se entra desde afuera y la navega con el router en `popstate` (el browser solo cambia la URL). Las rutas de detalle llevan slug: los patrones son `[^/]+`, no `\d+`.
- **Para ver acá / para seguir**: `navItems.ts` agrupa la navegación por `section` (`watch`, `follow`, `explore`, `people`, `community`, `help`, `manage`); Sidebar y el cajón "Más" usan los mismos grupos. `SerieData.watchableHere` sale de `getCatalogFilterIndex().watchableIds` (PERSONAL + CURATED + `HAS_WATCHABLE_EPISODE`): casi todo lo de /ver es WATCHABLE_ONLY y no está en el catálogo, así que el chip "Se ve acá" aparece poco y es correcto.
- **Avisos descartables**: `DismissibleNotice` (design system) + `useDismissedNotice(id)`, un array de ids en `localStorage['mundobl.dismissedNotices']`. Mismo id en dos páginas = mismo aviso. En el servidor cuentan como cerrados.
- **Seguimiento automático en `/ver`**: `EmbedPlayer` activa la YouTube IFrame API solo cuando recibe `onWatchProgress`. `useYouTubeWatchTime` acumula tiempo reproducido real (los saltos no cuentan), marca una parte al 80 % y avisa `ended` para avanzar únicamente a la parte siguiente del mismo capítulo. Al terminar el capítulo no reproduce otro automáticamente.
- **Progreso sin sesión**: `localStorage['mundobl.localProgress']` guarda por serie los ids vistos con schema `{ v: 1, series }`, manejado por `src/lib/local-progress.ts`. `SeriesUserStatusProvider` expone `storage: 'account' | 'local'`; `useMarkEpisodes` y el stepper escriben localmente sin mandar al login. `LocalProgressImporter`, montado en `AppLayout`, ofrece copiarlo a la cuenta después de autenticarse y borra cada serie local solo cuando su POST termina bien.
- **Ficha solo para el catálogo**: `/series/[id]` sirve CURATED + PERSONAL + VISIBLE. Lo que solo se ve acá (WATCHABLE_ONLY o aporte) redirige con 307 a `/ver/[id]`, temporal porque la serie puede pasar al catálogo; si no se ve, 404. No mostrar "Ficha completa" fuera del catálogo: `getContentUrl` elige el destino.
- **Costos en Vercel (plan Hobby, al límite en septiembre de 2026)**: Mergear a `main` no despliega (`vercel.json`: `deploymentEnabled: false`). Se juntan merges y se despliega a mano con el workflow **Deploy producción** (Actions → Run workflow, secret `VERCEL_TOKEN`); conviene evitar builds innecesarios, pero no asumir que cada deploy elimina todas las capas de caché (Vercel conserva ISR para rollback). #107 agregó `generateStaticParams` vacío en siete rutas de detalle para generar a demanda y reutilizar páginas con `revalidate`; comprobar el resultado en build y runtime, porque cookies, auth y otras dependencias pueden volver dinámica una ruta. El proxy corre solo en `/admin`. No hay Speed Insights montado. Antes de proponer un ISR corto, polling o una API por página, pensar el costo en funciones. Verificar local con `npm run build` + `npm start` contra DB local y chequear `x-nextjs-cache`; en Vercel, `X-Vercel-Cache`. Cuotas y procedimiento en el [manual de mantenimiento](../manual-mantenimiento.md).

## Guardado de fichas y borradores (2026-10-12)

La coincidencia de títulos en `/api/series?title=...` incluye CURATED de ambos
ámbitos. El formulario de alta ofrece comparar con la ficha existente y guardar
los campos elegidos sobre ella mediante `/api/series/[id]/curate` (ADMIN/MODERATOR).
El guardado conserva episodios y seguimiento, une temporadas por número y enlaces
por URL, agrega contenidos pendientes transaccionalmente y exige la editVersion
de la comparación. `series-curation.ts` contiene la política de precedencia;
no se convierte USER_EMBED por esta ruta.

`useLocalFormDraft` conserva campos y contenidos pendientes del formulario por
cuenta/ficha en este navegador. Recuperar una edición mantiene su versión original.
Es un respaldo de este navegador, no sincronización entre equipos. Pruebas:
`scripts/test-series-curation.ts`, `scripts/test-series-save.ts` y
`scripts/test-series-curation-ui.mjs`.

## Seguimiento unificado y actividad anónima (2026-10-24)

- Un solo panel "Mi seguimiento" ([TrackingPanel](../../src/components/series/TrackingPanel/TrackingPanel.tsx)) con y sin cuenta. El estado sale del progreso (capítulos, vía `updateSeriesAfterWatch`): SIN_VER/QUIERO_VER/RETOMAR pasan a VIENDO al marcar; VISTA y ABANDONADA se respetan. A mano solo se eligen intenciones: QUIERO_VER (nuevo valor del enum), RETOMAR (se muestra "En pausa"), ABANDONADA y VISTA.
- Sin cuenta todo vive en `localStorage` (`mundobl.localProgress` v2, con `intent`; v1 se sigue leyendo) en [local-progress.ts](../../src/lib/local-progress.ts). Al iniciar sesión [LocalProgressImporter](../../src/components/series/LocalProgressImporter/LocalProgressImporter.tsx) lo pasa solo a la cuenta (`POST /api/user/local-progress`): unión de capítulos y la intención solo si la cuenta no tenía estado. Nunca pisa la cuenta.
- `/watching` sin cuenta muestra [LocalWatchingList](../../src/components/watching/LocalWatchingList/LocalWatchingList.tsx) y la home "Seguir viendo" ([ContinueWatchingRow](../../src/components/watching/ContinueWatchingRow/ContinueWatchingRow.tsx)); los datos públicos salen de `GET /api/series/summaries` (cacheado por CDN). El catálogo tiene acción rápida por tarjeta (QuickStatusButton) y filtro "Quiero verla".
- /ver: YouTube y Vimeo registran solos al 80% (`useVimeoWatchTime`); cada tarjeta de capítulo tiene su check.
- Actividad anónima: `SeriesActivityDaily` (día, serie, kind view|chapter|want|finish, source account|browser, país del edge, count). Sin usuario, IP ni cookie. No cuentan GPC/DNT, el opt-out de /privacidad (`mundobl.activityOptOut`), ADMIN/MODERATOR/COLLABORATOR ni series no visibles. El contador público ("N capítulos vistos esta semana") exige mínimo 5 y se pide por API (las fichas son ISR de una semana).
- Ranking: quien no publicó su perfil aparece con un alias generado ([community-alias.ts](../../src/lib/community-alias.ts)): dos listas de 24 sustantivos por idioma (`communityAlias.firstWords/secondWords`, separadas por `|`) y una plantilla. Semilla: `CommunityProfile.aliasSeed` o hash del userId. Se cambia con `POST /api/community/alias` (cada 10 min).
- `/admin/informe-productoras` ([producer-report.ts](../../src/lib/producer-report.ts)): cuentas, activas, capítulos con/sin cuenta, por serie, canal oficial y país, y clics a plataformas, con resumen copiable.
- Cierre del círculo post-capítulo y post-serie: `GET /api/series/[id]/my-status` hidrata `userRating` (`category: 'general'` o promedio de categorías) y `hasReview`. En estado `VISTA`, `TrackingPanel` muestra [PostFinishPrompt](../../src/components/series/PostFinishPrompt/PostFinishPrompt.tsx) con puntaje rápido 1–10, favorito, apertura directa del modal de reseñas (`mundobl:open-review-modal`) y enlace al desglose por categorías; `RatingSection` combina puntaje rápido (`general`) arriba y las 9 categorías debajo, sincronizados vía `mundobl:user-rating-updated`. `/ver/[id]` habilita valoraciones, reseñas, comentarios de serie y comentarios/notas del capítulo activo para todas las obras visibles. `/estadisticas` suma el ranking `topRated`, reseñas recientes y banner atractor con links `getContentUrl`.
- Tests: `scripts/test-tracking-redesign.ts` y `scripts/test-activity-routes.mjs`.

## Comandos

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm run start        # Servir build de produccion
npm run lint         # Verificar codigo
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

## Migraciones seguras y reconciliación (2026-09-15)

- Se reconciliaron cambios aplicados previamente fuera del historial: SeriesNote, SeriesSuggestion, Actor.funFacts, Comment.isAnonymous/parentId, FeatureRequest.category, NotificationPrefs.notifyAdminComments y Series.airDays. La migración 20260915110000_reconcile_untracked_schema reproduce esos cambios para bases nuevas, incluyendo RLS. En producción se verificó que ya existían y se registró con migrate resolve --applied; no se ejecutó su DDL allí.
- La causa recurrente incluía scripts/migrate-supabase.sh, que usaba db push. Ahora npm run migrate:supabase ejecuta scripts/migrate-supabase.mjs y solo aplica SQL versionado con migrate deploy. Conserva la lectura explícita de DIRECT_URL desde .env para Supabase; no usa .env.local.
- prisma.config.ts llama a scripts/prisma-safety.ts: migrate dev/reset y db push quedan bloqueados contra hosts remotos. Generar cambios en PostgreSQL local; nunca resetear la base compartida para resolver drift.
- .github/workflows/migrations.yml reconstruye una base vacía en cada PR que toca Prisma y ejecuta npm run db:check. Así detecta campos agregados al schema sin su migración. db:check por sí solo compara base y schema; la reconstrucción es lo que valida el historial.
- No editar migraciones ya aplicadas ni sus checksums. Para hotfixes existentes: comparar el esquema real, crear y probar una migración que los reproduzca, y marcarla aplicada únicamente en las bases donde ya existen todos sus efectos.
- scripts/audit-migration-history.mjs consulta el historial sin modificarlo; ignora intentos revertidos y admite diferencias de finales de línea al verificar checksums.

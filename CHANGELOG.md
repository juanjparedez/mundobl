# Changelog

Todas las versiones notables del proyecto se documentan aqui.

> **Este archivo es la fuente de verdad.** `/api/changelog` lo lee del repo en
> cada deploy y lo muestra en `/novedades`, el tab Changelog de `/feedback` y la
> landing. Para publicar novedades: agregar la entrada aca y deployar. La DB
> (`ChangelogItem`, `/admin/changelog`) quedo como fallback solo si este archivo
> esta vacio.

## 2026-09-26 — Capítulos que cuentan bien, favoritos en la ficha y noticias al día

### Features

- **Para ver acá y para seguir, por separado**: el menú separa lo que se mira en el sitio ("Ver series") de lo que se sigue (catálogo, viendo, perfil). En el catálogo, las series que además se ven acá llevan "▶ Se ve acá" y tienen su filtro. Un aviso, que se cierra una vez, explica por qué no todo se ve acá.
- **El seguimiento cuenta capítulos, no videos**: YouTube sube muchos capítulos en partes ([1/4]…[4/4]). Antes, ver el capítulo 1 de Baker Boys decía "Ep. 4 / 52"; ahora cuenta capítulos, y "Vi el ep. N" marca el capítulo entero. Vale para la ficha, `/ver`, `/watching` y el perfil.
- **"Vi el capítulo N" desde el reproductor**: debajo del video en `/ver`, junto a Anterior y Siguiente. Tocarlo otra vez lo desmarca.
- **La lista de episodios de la ficha responde**: muestra "Episodios (12)" en vez de 64 videos sueltos, con los avances y extras resumidos en una línea, y el botón de visto actualiza el panel sin recargar.
- **Favoritos desde la ficha y desde `/ver`**: una estrella al lado de la campanita. Antes solo se podía desde el catálogo.
- **`/ver` avisa antes del play**: si el video no está disponible en tu país, solo se ve en YouTube o la productora lo sacó, lo dice arriba del reproductor.
- **Fichas sin dónde ver**: si no sabemos dónde verla legalmente, lo dice y te deja contarnos.
- **Catálogo con filtros en la URL**: un catálogo filtrado se comparte con el link, y la búsqueda desde Google (`?q=`) funciona.
- **Noticias que llegan solas**: el sitio junta noticias de los sitios recomendados y de los canales oficiales; alguien del equipo las revisa antes de publicarlas, y las de cada serie aparecen en su ficha.

### Fixes

- **La ficha ya no promete episodios que no hay**: una serie con solo un tráiler decía "Ver episodios oficiales" y el link daba error.
- El filtro "Recién agregados" del catálogo filtraba por año de estreno: ahora se llama "Estrenos recientes".
- **El botón "atrás" del navegador**: si entrabas directo a una página, "atrás" cambiaba la URL pero la pantalla no se movía; y desde una ficha abierta por un link externo te sacaba del sitio. Además, volver al inicio con sesión ya no te manda a `/watching` a la fuerza: eso pasa solo cuando abrís el sitio.
- **El contenido ya no se separa de la barra lateral**: en escritorio quedaba un hueco de 250px entre el menú y la página.
- **Carátulas**: las series sin póster muestran un cartel con el título en vez de un recuadro vacío, y las miniaturas de YouTube ya no traen franjas negras.
- **En el catálogo, el adelanto de la serie ya no se abre solo** al pasar el mouse por la grilla; se abre con "+ info". En la vista carrusel sigue igual.
- **Las páginas llegan con contenido desde el servidor**: antes se veía una pantalla vacía hasta que cargaba todo.

## 2026-09-25 — Seguir una serie te avisa, y la privacidad que prometemos

### Features

- **Aviso de capítulo disponible**: cuando se suben videos nuevos de una serie que seguís, te llega un aviso (y push, si lo tenés activado) que te lleva directo al primero de los nuevos.
- **Seguir una serie te suscribe a sus avisos**: antes eran dos cosas separadas. La campanita sigue a la vista para apagarlo.
- **"Seguir viendo" retoma donde ibas**: desde `/watching` te lleva al capítulo siguiente, no al primero. El episodio viaja en la URL (`?e=1x5`), así que se puede compartir y sobrevive al F5.
- **Estar al día no es terminar**: si la serie todavía sale, llegar al último capítulo cargado dice "Estás al día" y la serie se queda en tu lista.
- **Las series en "Retomar" aparecen en `/watching`**, con su etiqueta.
- **Reproducciones y me gusta de YouTube** en las tarjetas de `/ver`.
- **La home cuenta lo que hace el sitio**: seguir series capítulo a capítulo. Con sesión y series en curso, abrir el sitio te lleva a tu lista.

### Fixes

- **"Quiero colaborar" lleva a un lugar donde se puede colaborar**: el formulario de feedback, que ahora funciona sin sesión.
- **Las estadísticas de la comunidad son de la comunidad**: se separan los números del equipo.
- **Tu acento de color se respeta en todo el sitio**: dos variables inexistentes lo pisaban con rosa.
- **Foco de teclado visible** otra vez en todos los botones.

### Privacidad

- **Las visitas no te siguen**: de cada visita guardamos solo la página y la hora; ni IP, ni navegador, ni usuario.
- Se sacaron los eventos de embudo y el panel de retención.

## 2026-09-21 — Notas privadas, navegación móvil completa y menos consumo de servidor

### Features

- **Notas privadas por episodio y por serie**: en la ficha, además de los comentarios públicos, ahora hay accesos directos a "Nota del T1·E4" (del último capítulo visto) y "Nota de la serie", siempre a mano sin buscarlos en otro menú.
- **Navegación móvil con las mismas opciones que en la compu**: la barra inferior y el nuevo menú "Más" ahora llegan a todo lo que antes solo estaba en el menú de escritorio — Actores, Directores, Productoras, Plataformas, Glosario, Acerca, Perfil y Administración. Antes, desde el celular, esas secciones no existían.
- **"Seguir viendo" en la página de reproducción**: `/ver/[serie]` ahora tiene el mismo panel de seguimiento que la ficha, y el dashboard de "Viendo ahora" suma un botón que te lleva directo a reproducir donde ibas.

### Fixes

- **Video embebido en pantalla completa**: al rotar el teléfono con un video de YouTube embebido, ahora sí ocupa toda la pantalla nueva (el sitio bloqueaba sin querer el sensor de rotación de los reproductores).
- **Subida de adjuntos en Feedback**: las imágenes fallaban al subirse; ya está resuelto.
- Los chips de género/etiquetas en la ficha ya no se cortan contra el borde en el celular.
- Traducción completa de la parrilla semanal de estrenos: faltaban 2 claves en 8 idiomas.

### Rendimiento

- **Menos escrituras de caché y CPU en Vercel** (habíamos pasado el plan gratuito): las páginas de series, personas y productoras ahora se refrescan solo cuando algo cambió de verdad, no cada pocos minutos por reloj. Como efecto, editar una serie ya no regenera las 648 fichas del catálogo, solo la que cambió.
- **Actores, Directores y Productoras vuelven a cargar al instante**: los tres índices (2.500+ fichas) son estáticos otra vez en lugar de consultar la base en cada visita.

## 2026-09-20 — Plan de retención: seguir una serie es más simple, y solo contenido oficial

### Features

- **Seguí el progreso con un toque**: en la ficha, un stepper "Ep. N / total" para marcar o desmarcar episodios de a uno sin entrar a la lista completa. Si terminaste todos, te pregunta si querés pasar la serie a Vista.
- **¿La estás viendo? Decíselo sin loguearte**: quien entra sin sesión ve una tarjeta con el mismo selector de episodio; elige por dónde va y, al tocar "Empezar a seguir", lo llevamos a iniciar sesión con Google — al volver, el progreso elegido se guarda solo, sin repetirlo.
- **Panel de seguimiento unificado**: la ficha muestra el mismo bloque tenga o no episodios cargados. Para cortos, películas y especiales (98 fichas sin episodios) hay un botón directo "Ya la vi" en vez de no mostrar nada.
- **`/watching` con acción real**: la tarjeta principal ahora es "Vi el ep. N" en lugar de solo llevarte a la ficha; si ya viste todo, "Terminé la serie" la saca de la lista. Las series sin episodios también tienen un botón para cerrarlas, y las que no tienen poster muestran un cartel prolijo en vez de romper el diseño.
- **Solo contenido con licencia**: los embeds de episodios y los links de "dónde ver" se verifican ahora contra el canal oficial real de la productora o distribuidora (vía la API de YouTube) antes de guardarse; se limpiaron 273 embeds y 1 link que no cumplían la regla.

### Fixes

- Marcar un episodio como visto ahora sí mueve la serie a "Viendo" (antes se quedaba afuera de `/watching` para varios usuarios hasta marcarla manualmente).
- **Panel de administración**: gráfico de actividad con fechas corregidas (por huso horario), mejor comportamiento al redimensionar widgets, todos los modales ahora abren a pantalla completa en el celular, y el menú de accesos directos se puede reordenar.

## 2026-09-12 — Parrilla semanal de estrenos

### Qué sale esta semana

- **Parrilla de emisión** en la landing y en `/estrenos`: qué serie sale cada día de la semana,
  con el día de hoy primero y resaltado. El fandom mira semanal y hasta ahora la app no mostraba
  en ningún lado cuándo salía un capítulo.
- **Sale de `Series.airDays`**, el día de emisión que ya se cargaba desde el admin. No dice número
  de capítulo, ni hora, ni "ya está disponible": no tenemos esos datos y no los inventamos.
- **Se apaga sola**: una serie deja la parrilla cuatro meses después de cargada, así una que ya
  terminó no sigue publicando un horario que no existe.
- **Campanita "avisame"** por serie. Por ahora alimenta las notificaciones que ya existían; el
  aviso automático de capítulo nuevo todavía no está.
- Traducida a los 10 idiomas. Como efecto colateral, el semáforo de emisión de "Viendo ahora"
  dejó de estar en español fijo y ahora también se traduce.

## 2026-09-06 — Feedback colaborativo, curaduría ágil, SEO semántico, experiencia de landing y disponibilidad real en /ver

### Features

- **Aviso de disponibilidad real en `/ver`**: las series ahora indican cuántos episodios se pueden reproducir efectivamente desde tu región. Varias series alojadas en canales oficiales están geo-bloqueadas por la productora en Latinoamérica y España (el clásico "quien subió este video no lo permitió en tu país"), a veces solo en parte de los capítulos. En vez de que te enteres al hacer click, la tarjeta lo avisa antes con un "X de Y disponibles acá". El chequeo se corre periódicamente y también detecta videos dados de baja o con restricción de edad, que no se pueden ver embebidos en ningún lado.
- **Barrido de canales oficiales (admin)**: nueva herramienta en `/admin/series/barrido` que recorre un canal oficial completo (GMMTV, Be On Cloud, Idol Factory, Star Hunter, Dee Hup House, Domundi, Studio Wabi Sabi, Mandee, Strongberry, IdeaFirst, GagaOOLala, WeTV Thailand) y detecta qué playlists son series completas, separándolas del relleno (highlights, reacciones, shorts, OST, playlists de un solo episodio) y marcando las que ya están en el catálogo. Es el paso previo al importador y el que permite sumar series de a decenas en lugar de una por vez.
- **Respuestas abiertas en Feedback**: el hilo de comentarios en `/feedback` ahora está abierto a toda la comunidad — cualquier usuario autenticado puede responder, dialogar sobre sugerencias y debatir propuestas de colaboración (como la de Xuxyn / Alxy) directamente con el equipo. Incluye notificaciones directas al creador de la solicitud y rate limit defensivo (20 comentarios/hora).
- **Fusión de Géneros en Panel de Administración**: nueva herramienta en `/admin/tags` (pestaña Géneros) con selección múltiple y modal interactivo para fusionar géneros duplicados o con errores tipográficos hacia un único género destino, migrando todas las series asociadas de forma atómica y segura.
- **Narrativa interactiva en la Landing Page**: rediseño progresivo del flujo de inicio enfocado en valor real y retención — presenta las herramientas diferenciales a medida que se hace scroll (tracker personal con timestamps, modo sin spoilers, glosario cultural con trivia interactiva, noticias de actualidad y el ecosistema abierto de fansubs y plataformas oficiales).
- **Filtro de Género en Administración de Series**: selector con autocompletado en `/admin/series` para filtrar el catálogo rápidamente por género, sumado a un botón directo para crear nuevas series.
- **Slugs semánticos en URLs (SEO)**: enlaces optimizados para motores de búsqueda (`/series/:id-:slug`, fichas de personas y productoras), con metadatos JSON-LD estructurados (Schema.org) y sitemap canonical para maximizar la indexación en Google.
- **Vista Rápida (Quick Preview)**: navegación ágil en carruseles y grillas mediante un modal emergente para revisar detalles, sinopsis y episodios sin perder la posición de lectura.
- **Módulo centralizado de correos**: infraestructura ligera (`src/lib/email.ts`) compatible con Resend (REST API directa) y simulación segura en logs para entornos de desarrollo.
- **Medición de rendimiento y analítica**: integración de Vercel Analytics y Speed Insights para monitorear Core Web Vitals (LCP, INP, CLS) y uso real de la plataforma.

### Fixes

- **Curaduría de Especiales**: al dar de alta un especial en el formulario de series, se oculta la complejidad de temporadas y solo se solicita cantidad de capítulos y año, asignando temporada 1 automáticamente y guardando sin errores.
- **Auto-generación de Episodios**: al ingresar o aumentar la cantidad de capítulos de una serie o especial, el sistema genera automáticamente todos los episodios del 1 al N en la base de datos sin requerir carga manual.
- **Días de emisión al editar (`airDays`)**: se corrigió la pantalla de edición (`/admin/series/[id]/editar`) para que los días de emisión previamente marcados no se desmarquen al abrir el formulario.
- **Navegación post-creación**: tras registrar una nueva serie, el panel redirige de forma directa a la ficha pública (`/series/:id-:slug`) para previsualizar el contenido al instante, invalidando cachés asociadas.
- **Rendimiento de renderizado estático**: optimización de caché en `/catalogo` y `/series/[id]` desacoplando la consulta de sesión en el render para preservar la revalidación estática rápida.

## 2026-09-05 — Glosario Cultural: tags, recursos y logros

### Features

- **Tags reales en el Glosario Cultural**: los términos ahora muestran
  chips de tag (compartidos con el catálogo) y se pueden filtrar por tag,
  tanto desde la barra de filtros como haciendo click en un chip de una
  tarjeta.
- **Recursos externos editables**: la tab "Resources" de `/glosario` dejó
  de ser una lista hardcodeada — ahora se gestiona como cualquier otro
  sitio recomendado desde `/admin/sitios` (categoría "Glosario Cultural").
- **Logros ligados al glosario y la trivia**: 3 logros nuevos en
  `/perfil` — dos por contribuciones aprobadas al glosario ("Voz
  cultural", "Colaborador cultural") y uno por sacar puntaje perfecto en
  la trivia cultural ("Sabelotodo cultural"). El mejor puntaje de la
  trivia ahora se guarda por usuario en la base (antes solo vivía en
  `localStorage` del dispositivo); sin sesión sigue funcionando igual que
  antes.
- **README renovado**: presentación más visual del proyecto (pitch,
  features, quick start) sin duplicar el detalle técnico de `context.md`.

## 2026-09-04 — Rol de colaborador externo y Glosario Cultural dinámico

### Features

- **Rol de colaborador externo (`COLLABORATOR`)**: nuevo admin reducido en
  `/admin/colaborador` para productoras/proveedores externos que aportan su
  propio catálogo — importan una serie completa desde una playlist de
  YouTube (con chequeo automático de restricción de edad) y editan su
  propia ficha (poster, sinopsis, cast, tags), sin acceso al resto del
  panel ni al catálogo curado. Reseñas y suscripción habilitadas también
  para aportes de la comunidad (antes solo reseñas estaban bloqueadas).
- **Glosario Cultural dinámico**: los términos ahora salen de la base de
  datos en vez de estar hardcodeados, con flujo de contribuciones
  moderadas (cualquiera puede sugerir un término, un admin lo aprueba
  antes de publicarlo). Sumado al menú de administración. Las sugerencias
  ahora también aceptan ejemplos de uso y errores comunes de traducción,
  y la fuente citada se conserva y se muestra al publicar el término.
- **Anuncios personalizados**: el título y cuerpo de un anuncio pueden
  usar `{userName}` — se reemplaza por el nombre de quien lo está viendo,
  así un mismo anuncio sirve para varios destinatarios sin reescribir el
  texto.
- **Suscribite al canal**: en `/ver`, los videos de YouTube ahora muestran
  un botón directo para suscribirse al canal de origen.

### Fixes

- **Precios de plataformas**: aclarados y corregido el cierre de Vimeo On
  Demand en el comparador de `/plataformas`.
- **Importador de series**: el país sugerido por canal no se estaba
  asignando (comparaba código ISO en mayúscula contra códigos guardados en
  minúscula).

### Infra / Housekeeping

- **Sesión de NextAuth por JWT** en vez de "database": bajó
  significativamente el uso de Fluid Active CPU en Vercel (cada página
  vista de un usuario logueado hacía una consulta extra a la base solo
  para validar la sesión).
- Aprobación explícita de los install scripts de Prisma/esbuild/
  unrs-resolver (requerido por versiones recientes de npm).

## 2026-08-16 — Streaming Hub, comparador de plataformas y Glosario Cultural

### Features

- **`/ver` rediseñado como Streaming Hub**: Hero Billboard destacando una serie, carruseles temáticos por categoría (plataforma, género, novedades) y switch de vista grid/carrusel, con seed masivo de series oficiales adicionales.
- **Comparador de plataformas (`/plataformas`)**: precios, subtítulos y políticas de afiliados transparentes de cada plataforma de streaming, con reparto enriquecido y tip de geoblock/VPN.
- **Glosario Cultural BL/GL (`/glosario`)**: sección interactiva con términos, honoríficos tailandeses y guía de traducción para quienes recién arrancan con el género.
- **Página `/acerca`**: historia y manifiesto del proyecto.
- **Capítulos con partes (1/4 a 4/4)**: nueva arquitectura para episodios multiparte, con miniaturas de video y duración en las tarjetas de capítulos/extras. Modal de ayuda con atajos de teclado en el reproductor.
- **Notas privadas por serie**: además de las notas por episodio, ahora se puede guardar una nota privada a nivel serie (ej. "dónde verla si no está en una plataforma legal") — solo visible para quien la escribe.
- **Borrar historial y estadísticas propias** desde `/perfil` → Configuración (zona de peligro): borra vistos, ratings, favoritos y notas del usuario sin tocar la cuenta ni comentarios/reseñas públicos.
- **Suscripción y badges públicos**: suscripción a novedades habilitada en todas las series de `/ver`; el header de series ahora muestra el conteo público de favoritos y "viendo ahora".
- **Moderación**: flujo `PENDING_REVIEW` para aportes de la comunidad, notificaciones al usuario cuando su aporte es revisado, y generador de changelog asistido por IA en el panel admin.
- **Accesos rápidos**: acceso directo de un clic a admin en el sidebar y nuevos atajos en el Command-K.

### Fixes

- **Reproductor Vimeo On Demand**: detección de privacidad y botón de redirección directa al sitio oficial cuando el video no se puede embeber.
- **Linkeo de aportes con el catálogo**: corregido error 500 al vincular series aportadas por usuarios con series curadas; precios de plataformas actualizados; linkeo masivo optimizado (timeout de 60s y memory mapping).
- **Parser de capítulos en tailandés** corregido en la importación de episodios.
- **Base de datos**: se previene el timeout del pool de conexiones en entornos serverless (conexión singleton reutilizada).
- **Enlaces de video rotos en `/ver`**: 5 series (_Bed Friend_, _Choco Milk Shake_, _Some More_, _Long Time No See_, _Match Boy_) tenían IDs de video de YouTube inexistentes, generados sin verificar contra la API real en una carga de datos anterior. Se corrigieron con videos reales y verificados de los canales oficiales (Mandee Channel, STRONGBERRY); _Match Boy_ se dio de baja al no encontrarse evidencia de que corresponda a un título real.
- **Catálogo `/ver` ampliado con series verificadas**: se sumaron _SOTUS: The Series_, _The Eclipse_, _Only Friends_ (GMMTV) y _The Middleman's Love_ (Mandee), todas importadas desde playlists reales de YouTube y confirmadas video por video contra el canal oficial antes de publicarse.

### Infra / Housekeeping

- Reorganización de rutas bajo un grupo `(app)` para separar el layout público del autenticado.

## 2026-08 — Experiencia de reproducción, catálogo para ver y optimización mobile

### Features

- **Catálogo /ver ampliado y legal**: Importación de series BL oficiales completas desde YouTube (_My School President_, _A Tale of Thousand Stars_, _Vice Versa_, _Cooking Crush_, _Cupid's Last Wish_) con separación estricta de contextos (sin alterar el catálogo curado de Flor ni crear etiquetas/actores automáticos).
- **Autocompletado con IA (Gemini) On-Demand por campo**: En el alta de series, Flor ahora puede solicitar asistencia de IA de forma granular sobre Sinopsis, Reparto, Directores, Géneros/Tags, Producción o Info Básica sin pisar lo completado a mano.
- **Botón Compartir Inteligente**: Integración de Web Share API en dispositivos móviles (para enviar a WhatsApp, Instagram, Telegram en 1 toque) y modal desktop con enlaces directos y copiado rápido de URL.
- **Skeletons de Carga Fluidos**: Nuevos esqueletos de carga accesibles (`loading.tsx`) en `/`, `/ver`, `/ver/[id]`, `/novedades` y `/feedback` para eliminar pantallas blancas y saltos de layout (CLS).

### Fixes

- **Reproductor de Video /ver**: Corrección en la resolución automática de IDs de video de YouTube para episodios embebidos y backfill en la base de datos.
- **Responsividad Mobile Integral**: El póster hero ya no ocupa el 65% de la altura vertical de la pantalla en teléfonos; la grilla de `/ver` adopta un layout de 2 columnas tipo streaming para navegación fluida y se aplicaron reglas globales de prevención de desbordes (`overflow-x`).
- **Feedback & Tareas**: Categorización de solicitudes por tema (Frontend, Backend, Catálogo, Infra, UI, General) y filtro de asignaciones.

## 2026-07 — Seguridad, performance y mejoras de feedback

### Seguridad

- **RLS en toda la base**: Row Level Security activado en las 16 tablas publicas que faltaban (marcadas por el advisor de Supabase). Cierra el acceso publico via PostgREST sin afectar la app (Prisma usa el rol owner).
- **Privacidad en votos**: el board de feedback ya no expone quien voto cada solicitud; solo se calcula si vos votaste.
- **CSP**: se habilitan favicons externos (`img-src https:`) — los logos de `/sitios` volvieron a cargar.

### Performance

- **Indices en toda la DB**: indices de cobertura en las 30 claves foraneas que no los tenian, acelerando joins y borrados en cascada.
- Alta de series en el admin con llamadas paralelizadas.

### Features

- **Badge "Del equipo"** en `/feedback`: los items del roadmap oficial se distinguen de los aportes de la comunidad.
- **Precarga IA** al crear series reutiliza el vocabulario existente de tags y generos (menos duplicados).

### Fixes

- Card de serie "watchable" sin portada muestra el titulo (antes: rectangulo vacio).
- Dedup case/space-insensitive de actores y tags, con scripts de merge.
- Admin: conteos de tags/generos/productoras/universos con scope curado; highlight de la pagina activa; tags que linkean a sus series.
- Tanda de bugs reportados por Flor (estados, imagenes, series).

## 2026-05-19 — Completitud del catalogo (#112) y pulido del perfil

### Features

- **Score de completitud** de cada serie: indicador publico en la ficha, panel de gestion en el admin y widget configurable en el perfil.

### Fixes

- Perfil: corregida una race al cambiar de modo/personalizar; FAB de edicion mas estable (renderizado via portal al body para evitar recortes).

## 2026-05-15 — Pulido post-launch: /perfil, catalogo, novedades, sitios (3 iters)

### Fixes

- **BUG CRITICO catalogo**: el catalogo mostraba series marcadas "Visto" que el usuario nunca vio. El cache global servia el `viewStatus` del primer visitante (Flor) a todos. Ahora `getAllSeries`/`getSeriesById` filtran el estado por usuario y el cache es scoped por `userId`.
- **Roles**: el rol USER (visitante) ya no ve botones de editar/borrar episodios y temporadas (helper `canEditCatalog` gatea la UI; el backend ya lo rechazaba). Aportar series via `/ver/agregar` sigue habilitado para todos.
- **Modos del perfil** (Basica/Avanzada/Admin): al cambiar de modo se aplica el preset de widgets correcto. Antes se quedaba con el layout del modo anterior y parecia que los botones no hacian nada.
- **Personalizar perfil**: reactivar una seccion oculta vuelve a mostrarla (antes desactivaba pero no reactivaba — el widget se perdia del layout al ocultarlo).
- **Layout admin**: `/admin/noticias` se renderiza dentro del layout admin. El boton "Editar layout" de `/admin` se integro al hero en vez de quedar flotando.
- **Accesos**: gestion de usuarios accesible desde el menu admin (grupo Sistema). Modal de feedback sin inputs de archivo nativos duplicados.

### Features

- **Estadisticas del perfil** como widget removible y configurable: cada mini-stat (vistas, viendo, favoritos, etc.) se muestra/oculta individualmente.
- **Widget "Mis feedbacks"** recuperado en el perfil. Aportar una serie via `/ver/agregar` la deja automaticamente en "Viendo ahora".
- **Carrusel de series completas** (estilo Netflix) en landing y `/novedades`: scroll horizontal con portada, click directo al reproductor.

### UX

- Novedades: "Nuevas temporadas" con portada de la serie (antes solo texto). Changelog renderizado con formato real (listas, negritas, links) via `react-markdown`.
- Sitios de interes: cada sitio muestra su favicon (logo propio o el del dominio). Header del perfil reorganizado con la version del cliente arriba.
- Mobile: en `/perfil` se oculta la barra superior casi vacia. Handles de widgets mas grandes para touch.

### i18n

- Nuevas claves de interfaz traducidas a los 10 idiomas (es/en/it/de/fr/ja/ko/zh-CN/zh-TW/th).

### Infra

- Notificaciones push: codigo listo, falta configurar las VAPID keys del servidor (tarea de infraestructura).

## 2026-05-12 — /ver: aporte de series por users registrados + panel admin de moderacion

- **Nueva ruta `/ver/agregar`** (login-gated): cualquier usuario logueado pega una URL de canal oficial (YouTube / Vimeo / Bilibili / Dailymotion) y la IA precarga title, year, country, sinopsis, cast, productora, idiomas, subs, tags, generos. Confianza expuesta (high / medium / low) y warnings si Gemini no respondio o devolvio JSON dudoso. Form editable antes de confirmar; al guardar aparece al instante en `/ver` con badge `@nickname`.
- **Helper `buildEmbedPreview`** en `src/lib/user-embed-preview.ts`: oEmbed nativo de cada plataforma (titulo / canal / thumbnail confiables) + Gemini con shape JSON estricta para el resto. Plataformas no soportadas (Netflix, TikTok, etc.) → 422.
- **Dedupes + rate limit**: dedupe global por `Episode.embedUrl` (409 redirige al existente), dedupe submitter+title+year, max 5 aportes/h y 20/dia por user (429 + `Retry-After`).
- **Schema**: `Series.origin` (`CURATED` / `USER_EMBED`), `Series.visibility` (`VISIBLE` / `HIDDEN`), `Series.submittedById`. Migration `add_series_origin_visibility_submittedby`. Defaults preservan todo el catalogo existente como CURATED+VISIBLE.
- **Panel admin `/admin/series/user-submitted`**: tabla de aportes con thumb, @submitter, plataformas, embeds, visibility. Acciones HIDE/SHOW (oculta de `/ver` post-hoc sin borrar), DELETE (cascade), LINK con una serie CURATED (transaccion que mueve Episodes con embedUrl al Season equivalente del target, crea Season si falta, enriquece episode destino sin embed, y borra el aporte). Nuevo item "Aportes" en AdminNav (groupCatalog).
- **Fix anti-leak transversal**: las series `USER_EMBED` no aparecen en `/catalogo`, `/series/[id]`, homepage, `/novedades`, `/actores/[id]`, `/tags/[id]`, sitemap-series, `/api/series`, `/api/search`, `/api/stats/public`. Listings de actores/tags filtran `_count.series` por curadas (cero contaminacion). `/ver` y sitemap-ver SI las incluyen si `visibility=VISIBLE`.
- **VerSerieClient**: badge "Aporte de @user" cuando origin=USER_EMBED, oculta el link a `/series/[id]` (esa pagina da 404 para user-embed), reemplaza el boton "Mover a catalogo" admin por "Linkear con curada" → `/admin/series/user-submitted`. Fix flicker auth (espera `status==='authenticated'` antes de mostrar acciones admin).
- **/ver `VerPage`**: CTA "Agregar una serie" en hero (solo authenticated). Toggle "Solo curadas por Flor" en filtros. Badge `@nickname` en cards user-embed.
- **Endpoints rechazo 422 para USER_EMBED**: `POST /api/series/[id]/subscribe` y `POST /api/reviews` (no se suscribe ni resena un aporte hasta que admin lo linkea con una curada).

Cobertura parcial de los items #109 (pagina agregar serie con AI), #110 (full AI integration en creacion) y #111 (precarga IMDB/MDL/YouTube): el lado user-embed (`/ver/agregar`) esta listo; el lado admin (catalogScope=PERSONAL con AI + fetch IMDB/MDL) queda pendiente. Comentarios de progreso en las 3 features.

## 2026-05 — i18n masivo, SEO, import YouTube, paletas y nickname (deployado)

### Features

- **Internacionalizacion completa**: 10 idiomas reales (es, en, it, de, fr, ja, ko, zh-CN, zh-TW, th). Antes 8 eran aliases de ingles, ahora cada uno tiene ~1500 strings traducidos via Gemini API. Selector honesto en sidebar.
- **Auto-i18n tooling** (`scripts/audit-i18n.ts`, `scripts/auto-i18n-file.ts`, `scripts/translate-locales.ts`): scanner detecta strings hardcoded, Gemini reescribe componentes para usar `useLocale().t()`, regenera todos los locales automaticamente. 31 componentes migrados en una pasada.
- **t(key, params)** ahora soporta interpolacion nativa (`t('paginationTotal', { total: 42 })` → "Total: 42"), antes habia que usar `interpolateMessage()` aparte.
- **6 paletas de acento nuevas**: emerald, coral, indigo, crimson, slate (12 totales). AccentPicker en sidebar las auto-detecta.
- **Import de series por playlist YouTube** en `/admin/series/importar`: pegar URL → extrae metadata, parsea episodios (EP.X, S1E12, [1/4], etc.), traduce sinopsis con Gemini, crea Series + Season + Episodes en una transaccion. Helpers en `src/lib/playlist-importer.ts`.
- **`SeriesInfoBlock` genérico**: cards labeladas libres por serie ("Basado en", "Curiosidades", "Premios"...). Editables desde el admin, render publico solo si tienen contenido. Schema flexible — Flor agrega bloques nuevos sin migracion.
- **Nickname publico opcional** para privacidad: cada usuario puede setear un nickname desde `/perfil`. En contextos publicos (comentarios, reseñas, feedback) se muestra el nickname o `"Nombre I."` (inicial del apellido) en vez del nombre completo de Google OAuth.

### SEO

- **Sitemap segmentado** con `generateSitemaps()`: `/sitemap.xml` ahora es sitemap-index automatico, con sub-sitemaps por dominio (static, series, noticias, ver, actores, directores, tags). `lastModified` real desde DB para acelerar re-crawl.
- **Robots fortalecido**: bloqueos por seccion (admin, api, perfil, notificaciones, watching, auth, scanners) y declara `host` canonico.
- **JSON-LD enriquecido**: TVSeries con `numberOfSeasons`, `numberOfEpisodes`, `inLanguage`, `productionCompany`. Nuevos schemas en `/catalogo`, `/ver`, `/sitios` (CollectionPage). `WatchAction` en `/ver/[id]`. Breadcrumbs JSON-LD en todas las paginas con migas.
- **Meta titles keyword-first** en paginas de entidad: "Bad Buddy (2021) | Reseña, Reparto y Episodios — Serie BL" en lugar de generico. Mejora CTR en queries tipo "[serie] reseña" y "[actor] filmografia".

### Auth y dominio

- **Dominio canonico** ahora `mundobl.com.ar` (era `mundobl.win`). Redirect a nivel Cloudflare DNS, no en codigo.
- **NextAuth `trustHost: true`** para que el flow OAuth funcione en local dev sin necesidad de cambiar `NEXTAUTH_URL`.

### Fixes

- **antd v6 deprecations**: `Drawer.width` → `styles.wrapper.width`, `Modal.maskClosable` → `mask.closable`, `Spin.tip` → `description`, `Alert.message` → `title`. Limpieza completa de warnings.
- **CSS Modules `:global()`**: removido de `CategoryRater.css` (Next.js 16 ya no lo tolera fuera de modulos CSS).
- **Image quality whitelist**: `quality={60}` agregado a `images.qualities` en `next.config.ts`.
- **Regresion seasonLabel**: la auto-migracion habia reemplazado una prop dinamica por una constante; restaurada.

### Refactor / housekeeping

- 25 items de roadmap migrados de `ideas.md`/`retomar.md` (que se borraron) a la tabla `FeatureRequest` para tracking real.
- Trim de `README.md` (de 11 KB a 1 KB) — el changelog inline ya esta en DB y la doc tecnica en `context.md`.
- PII removida de notas: emails de admin reemplazados por roles "Flor"/"Juan" sin contacto.

### Suscripciones (deployado antes)

- Suscripciones a series: boton de campana en pagina de serie permite suscribirse para recibir avisos cuando hay novedades.
- Modelo `SeriesSubscription` con dispatch automatico de notificaciones in-app a suscriptores cuando se agregan temporadas, contenido embebido o se publica una resena.
- Helper `notifySeriesSubscribers` no-bloqueante e idempotente reutilizable en cualquier endpoint.
- Campana de notificaciones renderizada en sidebar (desktop) y BottomNav (mobile) con badge de no leidas.
- Hook `useUnreadNotifications` con poll cada 30s, refresh inmediato al volver a la pestaña y pausa cuando esta oculta.
- Catalogo: chips adicionales en cada card (plataforma, genero) para mejor identificacion visual.
- Mobile: rediseno cinematografico del header de serie — poster full-width con fade-out, contenido emerge debajo.
- Pagina /novedades reorganizada: changelog en orden cronologico (mas reciente primero), layout mas compacto.

### Performance

- Preconnect a Supabase storage en root layout (ahorra 100-200ms en primera carga de imagenes).
- DNS-prefetch a hosts de YouTube (i.ytimg.com, img.youtube.com).

## 2026-04 — Catalogo, news, feedback y PWA (deployado)

### Features

- Panel de administracion de changelog en `/admin/changelog`
- CRUD completo de novedades desde DB (`/api/admin/changelog`)
- Endpoint publico de changelog (`/api/changelog`) ahora prioriza DB y usa fallback a archivo
- Boton para importar changelog historico desde `CHANGELOG.md` al panel admin
- Feedback: nueva pestaña "Mis solicitudes" para seguimiento de casos del usuario
- Feedback: hilo de comentarios por solicitud con carga lazy y publicacion inline
- Feedback: gestion completa de casos del usuario en perfil (editar, replicar, comentar, eliminar, cambiar estado)
- Feedback: nuevos endpoints para CRUD de casos y comentarios
- Sidebar admin: acceso directo a "Novedades" y "Casos"
- Noticias BL: Fase 1 completa con panel admin `/admin/noticias`, generacion de resumen con IA y feed publico `/noticias`
- Noticias BL: modelo `News` + `NewsTag` con estados editoriales (`DRAFT | REVIEW | APPROVED | PUBLISHED | REJECTED`)
- Mapeo completo de paises del mundo (~200) con codigos ISO para banderas automaticas
- Rediseno de lista de episodios: layout compacto tipo tabla con seleccion masiva
- Endpoint de borrado masivo de episodios y acciones masivas (marcar vistos/no vistos, eliminar)
- Nuevas categorias de rating: Direccion, Guion, Produccion, Quimica de pareja principal/secundaria
- Banner de bienvenida para visitantes no logueados en el catalogo
- Parejas de protagonistas ordenadas por numero de grupo
- Banderitas de pais en tarjetas de Universos
- Vista de logs responsive con cards para mobile
- Boton "Limpiar scanners" en la pagina de admin logs

### Fixes

- Notificaciones movidas desde el acceso separado del sidebar al panel de configuracion de usuario
- Correciones de i18n en admin/feedback para nuevas claves de navegacion y seguimiento
- Ajustes de tipado y validaciones para soporte de comentarios en feature requests
- Fix: dialogo "Deseas abandonar el sitio" al editar temporadas (beforeunload falso positivo)
- Fix mobile: boton de perfil en BottomNav ya no cierra sesion por error
- Fix landing: estabilizacion de imagen hero en mobile
- Fix PWA: correccion de manifest para instalacion
- Fix PWA: eliminado `head.tsx` incorrecto que apuntaba a `/manifest.json` (404)
- Fix Next.js 16: route handlers dinamicos de feedback actualizados

### Seguridad

- Filtro de paths de scanners en middleware
- Extraccion de IP real del cliente via `CF-Connecting-IP` (Cloudflare)
- No loguear assets/PWA (icons, manifest, sw.js)
- Endpoint para limpiar logs de scanners
- Endpoints `/api/genres` y `/api/episodes/[id]/view-status` ahora con auth correcta

## 2026-03 — Sitios, suggestions y mantenimiento (deployado)

- Nuevas categorias de sitios: Oficiales, Productoras, YouTube
- Constantes de sitios centralizadas en `src/constants/sitios.ts`
- Modelo `SuggestedSite` y API de sitios sugeridos
- Fix: watchLinks no se cargaban al editar una serie
- Fix: "Currently Watching" ahora filtra por usuario autenticado
- Fix: boton "Editar" en watching solo visible para admin/mod
- Logos/imagenes en cards de sitios
- Thumbnails en tabla admin de contenido embebible
- Deteccion y filtro de contenido duplicado en admin
- Filtros clickeables en logs (usuario, accion, ruta, IP)
- Alineamiento de cards en pagina de contenido
- Limpieza de archivos obsoletos
- Baseline de migraciones Prisma (historial limpio)

## 22ba64c

- Mejora en flujo de sitios visitados

## 41e684d

- Fix carga inicial de contenido

## ee34bfa

- Actualizacion de pagina de feedback

## c05d71a

- Mejora del sistema de versiones

## 575649c

- Fix estilos de modales

## 8b32c37

- Fix redirect del router despues de crear contenido

## f9133fe

- Agregar chequeo de version (StaleVersionNotifier)

## e669a65

- Fix flujo de creacion de contenido

## c0dfc93

- Mejoras en formulario de series

## 9402261

- Agregar contenido embebido a la pagina de series

## d1abf70

- Permitir crear universos al vuelo desde el formulario de series

## d397580

- Agregar importacion de canales

## 137c773

- Mejorar pagina de contenido y sitios recomendados

## 4fc5a11

- Soporte para contenido embebido (YouTube, etc.)

## f9534b1

- Agregar pagina de logs de acceso

## c0c5648

- Agregar paginas internas de administracion

## ff31a03

- Tareas de Flor + Supabase Storage + imagenes en feedback

## 7bf8de0

- Mejorar tarjetas de universo

## 6a0eab4

- Agregar posicionador de imagenes

## 297ba4f

- Login con OAuth

## dfa7505

- Primera version funcional

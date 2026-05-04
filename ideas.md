# Ideas y Roadmap - MundoBL

## Ya implementado

- [x] Nombre de app configurable: `NEXT_PUBLIC_APP_NAME` ya es variable de entorno
- [x] Focal point para imagenes de portada en catalogo
- [x] Pagina de feedback (bugs, features, ideas) con changelog
- [x] Parejas de personajes en el reparto
- [x] Pagina de gestion de usuarios y roles
- [x] Estado de series expandido: Sin ver, Viendo, Vista, Abandonada, Retomar
- [x] Especiales con soporte de temporadas y episodios
- [x] Fix layout de universos con +3 titulos
- [x] Subida de imagenes a Supabase Storage
- [x] Imagenes en feedback via clipboard paste
- [x] Pagina admin de info del proyecto (links por env vars)
- [x] Login con Google OAuth
- [x] Access logs con registro de visitas y acciones
- [x] Panel admin de logs con filtros y limpieza automatica
- [x] Banner de privacidad
- [x] Sistema de ban de usuarios y bloqueo por IP
- [x] Gestion de usuarios mejorada (ban/unban, roles)
- [x] Sitios de interes / Links recomendados (pagina publica + CRUD admin)
- [x] Donde ver (WatchLinks con plataformas + embed de YouTube)
- [x] Contenido embebible (trailers, OSTs, entrevistas desde YouTube)
- [x] Importacion de canales de YouTube
- [x] Contenido embebido en pagina de detalle de serie
- [x] Sistema de chequeo de version (StaleVersionNotifier)
- [x] Nuevas categorias de sitios (oficiales, productoras, youtube)
- [x] Sugerencias de sitios por la comunidad (SuggestedSite)
- [x] Deteccion de contenido duplicado en admin
- [x] Filtros clickeables en logs de admin
- [x] Temporadas unificadas: admin completo de temporadas con SeasonForm + SeasonsList
- [x] Proteccion contra inyeccion: todos los $queryRaw usan tagged template literals de Prisma (parametrizados automaticamente)
- [x] Tracking mejorado en "Viendo Ahora": CurrentlyWatchingDashboard con progreso detallado
- [x] Landing page rediseñada: hero, stats band, features grid
- [x] Notificaciones in-app: modelo, API, campanita, pagina /notificaciones, push opt-in
- [x] Novedades publicas: feed de nuevas series + temporadas + changelog
- [x] Estadisticas avanzadas: dashboard publico + perfil con heatmap, ratings, distribucion por tipo/pais/año
- [x] Command palette global (Cmd+K)
- [x] Preferencias persistidas: catalogo, privacidad por defecto, tema, tipografia
- [x] Export/delete de cuenta
- [x] View Transitions API en catalogo
- [x] PWA: Service Worker + offline indicator + push notifications opt-in
- [x] Observaciones privadas en series (reviews internas)

---

## Pendiente

### Sistema de recomendaciones
Flor como admin podria gestionar recomendaciones.
- Cada usuario decide si acepta recomendaciones o no en su config
- Basado en generos, tags, o curado manualmente por admin

### Agente IA de noticias BL/GL (evaluado)

Estado: idea viable y alineada con el producto, pero conviene implementarla por fases para controlar riesgo legal/editorial.

#### Impacto esperado

- Alto impacto de producto: contenido fresco diario mejora retorno y posicionamiento SEO.
- Alto impacto para Flor: reduce tiempo de curacion si la IA deja borradores listos para revisar.
- Riesgo alto si se hace sin guardrails: copyright, citas incompletas, y alucinaciones.

#### Decision recomendada (orden por impacto real)

1. Empezar por un MVP editorial seguro dentro del admin actual (sin cron full automatico).
2. Agregar automatizacion diaria recien cuando la calidad legal/editorial sea consistente.
3. Publicacion siempre humana (Flor aprueba), nunca auto-publicar desde el agente.

#### Fases sugeridas

##### Fase 1 - MVP de mayor impacto inmediato (1-2 semanas)

- Modelo `News` en Prisma con estados editoriales: `DRAFT | REVIEW | APPROVED | PUBLISHED | REJECTED`.
- Admin nuevo `/admin/noticias` siguiendo patron de `/admin/resenas`.
- Boton manual "Generar borrador IA" a partir de URL + fuente (flujo pull, no push).
- Guardrails obligatorios:
	- resumen maximo,
	- cita de fuente + enlace,
	- disclaimer de IA,
	- bloqueo de publicacion sin `sourceName` y `originalUrl`.
- Pagina publica `/noticias` con solo items `PUBLISHED`.

Resultado: valor visible rapido con bajo riesgo operativo.

##### Fase 2 - Ingestion semiautomatica (1 semana)

- Job diario de ingestion RSS a borradores (`DRAFT`) para fuentes permitidas.
- Deteccion de duplicados por URL canonica + hash de titulo.
- Filtrado BL/GL/Dorama por keywords + lista blanca de dominios.
- Notificacion in-app a Flor usando `src/lib/notifications.ts`.

Resultado: menos trabajo manual, sin perder control editorial.

##### Fase 3 - Agente completo (2+ semanas)

- Supabase Edge Function + cron diario para pipeline completo.
- LangChain.js con herramientas de RSS + lectura de articulo respetando robots.
- Reintentos, observabilidad y tablero de errores.
- Integracion opcional con changelog cuando se publique noticia relevante.

Resultado: automatizacion robusta y mantenible.

#### Criterios de "hecho" para pasar de fase

- Precision editorial aceptable (sin copiar texto literal).
- 100% de noticias con fuente clickeable y disclaimer.
- Baja tasa de duplicados.
- Tiempo de revision de Flor realmente menor.

#### Prompt etico base (version recomendada)

"Sos redactor/a de noticias BL/GL en espanol neutro (Argentina). Redacta un resumen original en hasta 180 palabras, basado unicamente en hechos verificables del articulo fuente. No copies frases textuales ni inventes datos. Inclui contexto minimo (quien, que, cuando) y separa claramente hechos de interpretaciones. Cierra siempre con: 'Resumen generado por IA - Fuente original: [NOMBRE]' y agrega `sourceUrl` como enlace. Si faltan datos clave, devolve estado REVIEW con nota de verificacion."

#### Nota de arquitectura

- Este roadmap reutiliza piezas existentes del repo: moderacion tipo `resenas`, notificaciones in-app, y patron admin tabla+modal.
- Priorizar API route interna para MVP; Edge Function queda para fase 3.

### Quick wins UX (Mayo 2026)

- Navegacion usuario (prioridad alta):
	- fix critico: en mobile, el tap sobre el usuario debe abrir `/perfil` y nunca cerrar sesion.
	- agregar test/regla de regresion para evitar que acciones de perfil reutilicen handlers de logout.
- Landing:
	- forzar imagen hero local sin optimizacion de Next para evitar fallos en mobile (caso `image.bin` / render roto),
	- refresco de cache de service worker al desplegar cambios de assets.
- Detalle de serie:
	- rediseñar el bloque inferior de acciones (hoy solo compartir) para hacerlo circular/compacto y sumar acciones de alto valor:
		- suscribirse a notificaciones de novedades de esa serie,
		- marcar/seguir estado rapidamente,
		- acceso directo a reseñas/comentarios.
- Admin idiomas:
	- auditoria de i18n: confirmar cobertura completa de labels/mensajes y detectar cadenas hardcodeadas pendientes.
	- checklist: `title/subtitle`, tabla, acciones, modal, validaciones, toasts, estados vacios, errores API.

### Visibilidad y ranking (SEO + Robots + IA)

Objetivo: mejorar descubrimiento organico, cobertura de indexacion y score de legibilidad para crawlers clasicos y robots de IA.

#### Fase 1 - SEO tecnico base (prioridad alta)

- Fortalecer `robots` por tipo de pagina:
	- permitir catalogo, series, novedades, noticias, sitios;
	- bloquear rutas privadas/admin, parametros irrelevantes y resultados internos sin valor SEO.
- Sitemap segmentado por dominio de contenido:
	- `sitemap-series.xml`, `sitemap-noticias.xml`, `sitemap-sitios.xml` y `sitemap-static.xml`;
	- `lastmod` real por entidad para acelerar re-crawl.
- Canonical consistente en todas las paginas indexables (sin duplicados por query params).
- Metadatos OG/Twitter completos por serie/noticia para mejorar CTR en redes y buscadores.

Resultado esperado: mejor cobertura en Search Console y menor tasa de URLs "Descubierta - actualmente sin indexar".

#### Fase 2 - Mapping de sites y grafo interno (prioridad alta)

- Crear un "site mapping" explicito entre entidades del producto:
	- serie -> reseñas -> comentarios -> sitios recomendados -> noticias relacionadas.
- Mejorar enlazado interno:
	- bloques de "Relacionados" en series/noticias/sitios;
	- breadcrumbs y hubs tematicos por tags, pais, idioma, genero.
- Agregar schema.org por tipo:
	- `TVSeries` / `Movie`, `Review`, `Article`, `BreadcrumbList`, `WebSite`.
- Crear mapa editorial de fuentes confiables para noticias (lista blanca + categoria + idioma + autoridad).

Resultado esperado: mas paginas profundas rastreadas y mejor distribucion de autoridad interna.

#### Fase 3 - Robots de IA y data legible para LLM (prioridad media-alta)

- Publicar `llms.txt` y `llms-full.txt` con:
	- descripcion del proyecto,
	- rutas clave,
	- politicas de uso/citacion,
	- prioridad de lectura para contenido actualizado.
- Exponer un endpoint de mapa semantico para agentes (ej: `/api/ai-map`) con:
	- entidades principales,
	- relaciones,
	- URLs canonicas,
	- fecha de actualizacion.
- Incluir bloques "Facts" en series/noticias (datos estructurados, fechas, fuente, estado) para reducir ambiguedad en respuestas de IA.
- Definir politica de atribucion para resenas/noticias con fuente obligatoria y licencia visible.

Resultado esperado: mejor interpretacion por asistentes de IA y mayor probabilidad de citas correctas de MundoBL.

#### Operacion y medicion (KPI)

- SEO tecnico:
	- paginas validas indexadas,
	- errores de rastreo,
	- Core Web Vitals en URLs top.
- Descubrimiento:
	- impresiones organicas,
	- CTR medio,
	- crecimiento de landing pages por cluster (series/noticias/sitios).
- IA:
	- menciones/citas detectadas,
	- precision de datos citados,
	- trafico referencial desde agentes y respuestas enriquecidas.

#### Checklist de implementacion sugerida

1. Ajustar `src/app/robots.ts` y `src/app/sitemap.ts` para segmentar y priorizar rutas.
2. Completar metadata por entidad en layouts/pages indexables.
3. Implementar `llms.txt` + endpoint semantico para agentes.
4. Medir durante 4 semanas y recalibrar reglas de rastreo/priority.

---

## Largo plazo

### Notificaciones por correo
Sistema opt-in de notificaciones:
- El sitio por default NO envia ni consulta
- El usuario registrado voluntariamente activa en su pagina de configuracion
- Sin presion ni obligacion
- Notificacion cuando se resuelve un bug/feature al que se suscribio

### Platformizacion
Hacer la app generica y reutilizable:
- appName y branding por variables de entorno
- Quedaria como una app de gestion de contenido audiovisual personalizable
- Podria subirse como parte de un portfolio en GitHub
- Requiere abstraer las referencias a "BL" y hacerlas configurables

### Busqueda avanzada
Multiples criterios combinados (pais + genero + tag + ano + rating minimo).

### Import/export de datos
Backup y restauracion de datos.

### Modo offline (PWA)
Progressive Web App con cache offline.

---

## Notas

- Correo de Flor (admin): florstratovarius@gmail.com
- Correo de Juan (admin): juanjparedez@gmail.com

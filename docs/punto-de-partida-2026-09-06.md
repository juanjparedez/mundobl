# Punto de Partida y Estado del Proyecto (2026-09-06)

> **Documento vivo y fuente de verdad técnica.**  
> Reemplaza y consolida `docs/estado-implementado-2026-09-05.md`, `docs/pendientes-2026-09-05.md` y `docs/plan-proxima-iteracion-2026-09-05.md`, reflejando con exactitud lo que está implementado, lo que está listo para PR/merge, y las oportunidades priorizadas para las próximas iteraciones.

---

## 1. Estado Actual de la Base de Código

### A. Lo que acaba de completarse (Rama `feat/fusion-generos-y-landing-retencion` - Lista para PR)
1. **Fusión de Géneros en `/admin/tags`**:
   - Endpoint transaccional `POST /api/genres/merge` con `prisma.$transaction`.
   - Reasigna todas las relaciones `SeriesGenre` de los géneros origen al género elegido como destino, evitando duplicados si la serie ya contenía el género destino, y elimina de forma limpia los registros origen.
   - Interfaz con selección múltiple en `GenresTab.tsx` y modal de supervivencia idéntico a la fusión de etiquetas.
2. **Narrativa Progresiva en la Landing Page (Retención & Comunidad)**:
   - **Hero ligero**: LCP inmediato, 10 idiomas, badge cultural.
   - **Diario y Tracker Personal**: Visibilidad de seguimiento de capítulos, modo anti-spoilers y notas privadas fechadas con timestamps.
   - **Cultura y Glosario (`/glosario`)**: Término destacado del día + acceso directo al desafío del Mini-Quiz (`/glosario?view=trivia`).
   - **Noticias Curadas (`/noticias`)**: Actualidad de la industria sin clickbaits.
   - **Ecosistema Abierto y Fansubs**: Posicionamiento honesto (canales oficiales legales primero + espacio de autogestión de links y donaciones en `/admin/colaborador`).
   - **Performance e i18n**: Server Component con revalidación de 5m en `src/app/page.tsx` y textos bilingües en `src/i18n/messages.ts`.

---

### B. Implementaciones Recientes en Producción (Mergeadas en `main`)

| PR | Rama / Commit | Qué resolvió en producción |
|---|---|---|
| **PR #9** | `feat/seo-slugs-y-titulos-alternativos` | **Descubrimiento en Google & SEO**: Slugs semánticos (`/series/15-a-dog-and-a-plane`), metadatos con intención de búsqueda (*"Dónde ver, Reparto y Reseña"*), página `/noticias/[id]` para resolver los 404s del sitemap y sharding dinámico. |
| **PR #8** | `feat/gestion-tags-generos-curaduria` | **Gestión de Etiquetas**: Pestaña ágil en `/admin/tags` con alta rápida, edición inline y fusión de tags duplicados. |
| **PR #7** | `feat/analitica-y-sitemap` | **Métricas y Rastreo**: Vercel Analytics liviano (Core Web Vitals y eventos clave `locale_switch`, `quick_preview_open`) y sitemaps segmentados. |
| **PR #6** | `feat/quick-preview-y-navegacion-carruseles` | **UX de Catálogo**: Modal Quick Preview para ver sinopsis, elenco y tags con filtrado instantáneo sin recargar la página. |
| **PR #5** | `perf/comments-lazy-and-static-pages` | **Rendimiento SSR**: Carga diferida del árbol de comentarios y desvinculación de `auth()` en el render inicial para habilitar caché ISR de 5m. |
| **PR #4** | `perf/imagenes-y-locales` | **Bundle Size**: Carga bajo demanda de 8 de los 10 idiomas (ahorro de ~1.4MB en bundle) y generación de miniaturas 600x900 para posters. |

---

### C. Auditoría de las Requests Históricas (Requests 1, 2 y 3)

#### **Request 1 — Colaboradores y Recursos**
- [x] Rol `COLLABORATOR` con acceso limitado exclusivamente a `/admin/colaborador`.
- [x] Importador de series desde YouTube Data API (sin quemar tokens de IA salvo traducción solicitada).
- [x] Rate limiting específico para colaboradores (200 series/día).
- [x] Chequeo de restricción de edad de YouTube.
- [x] Separación de catálogos (`origin=CURATED` vs `origin=USER_EMBED`).
- [x] Aportes visibles en `/ver` con enlaces directos a canales oficiales y botón de suscripción.
- [x] Notificaciones al colaborador cuando su aporte es aprobado o rechazado (`Notification`).
- [x] Consulta de recursos de Vercel (previews/deployments): aclarado y resuelto.

#### **Request 2 — Glosario Cultural y Gamificación**
- [x] Modelo dinámico en Prisma (`GlossaryTerm`, `GlossarySuggestion`).
- [x] Contribuciones de usuarios desde `/glosario` (tab "Contribute").
- [x] Panel de moderación y aprobación en `/admin/glosario`.
- [x] Trivia interactiva (`GlosarioQuiz`) con guardado de puntaje en la cuenta del usuario.
- [x] Sitios externos y fuentes recomendadas gestionados desde `/admin/sitios`.
- [x] 3 logros culturales integrados en `/perfil` (Voz cultural, Colaborador cultural, Sabelotodo cultural).
- [x] Integración destacada en la Landing Page con término del día y teaser al quiz.

#### **Request 3 — Experiencia de Catálogo y Panel de Colaborador**
- [x] **Bug del carrusel en `/catalogo`**: **RESUELTO**. `.serie-card-secondary-meta` ahora usa exclusivamente `opacity` y `transform` con espacio reservado, eliminando la animación de `max-height` que causaba reflow en las filas inferiores.
- [x] **Unificación de Card en `/ver`**: **RESUELTO**. `/ver` utiliza el componente `MediaCard` del design-system con ratio 16:9, badges de episodios y banderas.
- [x] **Filtros en "Mis series" de Colaborador**: **RESUELTO**. Filtros por visibilidad (`VISIBLE`, `HIDDEN`, `PENDING_REVIEW`, `REJECTED`), país y rango de fechas con `RangePicker`.
- [x] **Estadísticas de Aportes para Colaboradores**: **RESUELTO**. Función agregada `getCollaboratorStats()` en `src/lib/database.ts` mostrando vistas, favoritos, comentarios, reseñas y suscripciones sin vulnerar la privacidad de los usuarios.
- [x] **Notificaciones en el Panel de Colaborador**: **RESUELTO**. Widget interactivo `<NotificationsWidget />` incrustado en `/admin/colaborador`.

---

## 2. Mapa de Pendientes y Oportunidades (Backlog Filtrado)

A continuación, los ítems reales que no están implementados, ordenados por impacto:

### 🟡 Prioridad 1: Búsqueda Global y Accesibilidad Cultural
1. **Glosario en Command-K**:
   - Integrar los términos culturales en el buscador global con atajo `Ctrl+K` / `Cmd+K` (`src/components/common/CommandK/CommandK.tsx`), permitiendo encontrar términos, significados y honoríficos desde cualquier parte de la app.
2. **Notificación al autor de término del glosario**:
   - En `PATCH /api/admin/glossary-suggestions/[id]`, cuando un admin aprueba una sugerencia, enviar una `Notification` al usuario que la propuso para que se entere de su publicación y sume reconocimiento.
3. **Asignación de tags al aprobar sugerencias de glosario**:
   - Permitir que el moderador seleccione o ajuste los tags del catálogo en la misma pantalla de aprobación en `/admin/glosario`.

### 🟡 Prioridad 2: Comunidad y Soporte para Colaboradores
1. **Guía / Documentación para Colaboradores**:
   - Crear una pestaña o modal de bienvenida (`/admin/colaborador/guia`) con recomendaciones de carga: formato de títulos, cómo estructurar capítulos multiparte (1/4 a 4/4), y lineamientos de canales oficiales.
2. **Canal de Soporte Directo para Colaboradores**:
   - Permitir a los colaboradores enviar consultas privadas a los administradores/moderadores desde su panel, sin tener que usar el foro público de `/feedback`.

### 🟢 Prioridad 3: Diario Personal del Usuario (Experiencia de Retención)
1. **Vista Unificada de Notas Personales ("Mi Diario BL")**:
   - Actualmente las notas privadas viven dentro de cada serie y capítulo. Crear una pestaña o sección en `/perfil` donde el usuario pueda consultar cronológicamente todas sus notas y timestamps en un solo lugar, o exportarlas.

---

## 3. Guía Rápida para el Próximo Sprint

1. **Paso Inmediato**:
   - Merge de la PR de **Fusión de Géneros y Landing Page**: [`feat/fusion-generos-y-landing-retencion`](https://github.com/juanjparedez/mundobl/pull/new/feat/fusion-generos-y-landing-retencion).
2. **Enviar Sitemap en Google Search Console**:
   - Validar `https://mundobl.com.ar/sitemap.xml` para acelerar el rastreo de las nuevas URLs con slugs.
3. **Próxima Tarea Técnica Recomendada**:
   - **Sprint Glosario & Command-K**: Conectar términos culturales a `CommandK`, agregar notificación de aprobación de términos y tags en moderación.

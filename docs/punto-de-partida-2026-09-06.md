# Punto de partida y estado del proyecto

> **Documento vivo.** Reemplaza y consolida `docs/estado-implementado-2026-09-05.md`,
> `docs/pendientes-2026-09-05.md` y `docs/plan-proxima-iteracion-2026-09-05.md`.
>
> **Última verificación contra el código: 2026-09-12.** La versión anterior de este archivo
> (fechada 2026-09-06) listaba como pendientes ocho cosas que ya estaban implementadas. Si vas a
> confiar en este doc para decidir qué construir, verificá primero la fecha de arriba: un doc de
> pendientes desactualizado hace perder más tiempo que no tener doc.

---

## 1. El número que manda

Medido el 2026-09-10 con Vercel Analytics (30 días) y consultas de lectura a producción:

| | |
| --- | --- |
| Visitantes únicos | 437 |
| Pageviews | 2.244 |
| Altas/mes | ~25 (conversión visitante→registro ~6%, sana) |
| Usuarios registrados | 89 |
| …que nunca hicieron ninguna acción | 47 |
| …activos un solo día | 40 |
| **…que volvieron un segundo día** | **2** |

**La adquisición está sana; el cuello es el regreso.** La superficie construida ya excede
muchísimo el uso real: el glosario tiene moderación, trivia y contribuciones, y recibe 4
visitantes/mes. Antes de proponer una feature nueva, chequear si la que existe se usa.

Tráfico por ruta: `/` 249, `/catalogo` 134, `/series/[id]` 131, `/sitios` 80, `/ver/[id]` 34,
`/glosario` 4. Audiencia 100% hispanohablante (AR, MX, ES, PE, CO). Cero referidos sociales.

---

## 2. Verificado como IMPLEMENTADO (2026-09-12)

Todo esto figuraba como pendiente en la versión anterior del doc y **ya está en el código**:

| Ítem | Dónde |
| --- | --- |
| Glosario indexado en el command palette | `src/app/api/search/route.ts` (5 fuentes) → `CommandK.tsx` |
| Notificación al autor al aprobar/rechazar una sugerencia | `api/admin/glossary-suggestions/[id]/route.ts` (`notifyUser`) |
| Asignación de tags al aprobar sugerencias | `GlosarioSuggestionsClient.tsx` (`<Select multiple>`) |
| Filtros por visibilidad/país/fecha en "Mis series" | `admin/colaborador/ColaboradorClient.tsx` |
| Estadísticas de aportes del colaborador | `getCollaboratorStats()` en `src/lib/database.ts` |
| Notificaciones dentro del panel de colaborador | `NotificationsWidget` montado en `ColaboradorClient.tsx` |
| Guía de carga para colaboradores | `admin/colaborador/guia/page.tsx` (+ link en `ColaboradorNav`) |
| Canal de soporte privado colaborador↔curaduría | modelos `SupportThread`/`SupportMessage`, `admin/colaborador/soporte/` y `admin/soporte/` |
| "Mi Diario BL" unificado | `MyDiaryWidget` + `GET /api/user/notes` |
| Card unificada en `/ver` | `VerPage.tsx` usa `MediaCard` del design-system |
| Bug de hover del carrusel de `/catalogo` | `catalogo.css` ya usa solo `opacity`/`transform` |
| Campo `review` en el form de series | `SeriesForm.tsx` + patrón defensivo `!== undefined` en el PUT |
| Parrilla semanal de estrenos | `/estrenos` + banda en la landing (2026-09-12) |

---

## 3. Pendientes reales

### Retención — piezas escritas y nunca cableadas

Es el bloque con mejor relación valor/esfuerzo: son horas, no días, porque el código ya existe.

1. **Tres plantillas de email sin caller** en `src/lib/email-templates.ts`:
   - `renderSupportReplyEmail` — **el más sangrante**: existe `SupportThread` y `/admin/soporte`,
     pero cuando curaduría responde una consulta privada, el colaborador no se entera por mail.
   - `renderContributionReviewedEmail` — `api/admin/user-series/[id]/visibility` crea la
     `Notification` pero no manda mail.
   - `renderSignInLinkEmail` — necesita decidir antes si queremos magic links en NextAuth.
   - Solo se envían hoy el anuncio masivo y el de bienvenida.
2. **`NotificationPrefs.emailEnabled` solo se lee en el anuncio masivo.** Cualquier transaccional
   nuevo tiene que respetarlo. Ojo: default `false`, así que hoy hay 0 usuarios opt-in.
3. **Aviso de capítulo nuevo.** Bloqueado por falta de dato, no de esfuerzo — ver la sección
   "Parrilla semanal de emisión" de `context.md` para el diseño y el gate de calidad.
4. **Un solo cron** (`/api/cron/playability`). No hay digest ni recordatorio.
5. **0 de 613 series con reseña editorial.** El bug de guardado que las borraba está arreglado
   (2026-09-10); ahora es trabajo de contenido, no de código.

### Deuda técnica concreta

- **`market` hardcodeado en `'AR'`** — `getWatchableSeries()` y `getVerAdminRows()` en
  `src/lib/database.ts`. El header `x-vercel-ip-country` no se lee en ninguna parte del código.
- **`/catalogo` sigue armando `.serie-card` a mano** (`CatalogoClient.tsx`, `renderSingleCard`)
  en vez de usar `MediaCard`; `MediaCarousel` tiene una tercera markup propia. La *mecánica* de
  los tres carruseles ya está unificada en `useCarouselNav`; lo duplicado es markup y CSS.
- **Fetch de video único de YouTube con duración** — no existe en `channel-fetcher.ts`; la
  capacidad de leer duración solo vive en `playability.ts`, en modo batch.
- **Tabs de `/glosario` leen `?view=` pero no lo escriben** → no son compartibles ni sobreviven
  a un reload.
- **`Comment` no tiene `glossaryTermId`**; `GlossaryTerm` no tiene `viewCount` ni votos.
  (Prioridad baja: 4 visitantes/mes.)
- **`AnnouncementAudience` no tiene rol `COLLABORATORS`** ni disparo automático desde el flujo de
  aprobación de aportes.
- `TODO` real: reviews count en `admin/series/[id]/WorkspaceClient/WorkspaceClient.tsx:48`.

### Fuera de alcance permanente

`docs/gamificacion-roadmap.md` ya deja explícito que modelo `Achievement`, XP/niveles,
leaderboard, notificaciones de logro e insignias **no se implementan** hasta que se decida
puntualmente. No repetir esa conversación acá.

---

## 4. Cómo mantener este doc honesto

La regla que falló la vez pasada: alguien escribió "RESUELTO" al lado de ítems que estaban
planeados, no verificados. **Antes de marcar algo como implementado, abrir el archivo y ver el
código.** Si no podés citar `ruta:linea`, no está implementado.

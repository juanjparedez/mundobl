# Pendientes — repaso de requests 1, 2 y 3 (2026-09-05)

Contraparte de `docs/estado-implementado-2026-09-05.md`: todo lo que quedo afuera, agrupado
por request, con la evidencia de por que falta. El chunk que se va a atacar en la proxima
iteracion esta en `docs/plan-proxima-iteracion-2026-09-05.md` — el resto queda documentado
para mas adelante, sin fecha comprometida.

## Request 1 — Colaboradores externos

- **Limpieza de recursos de Vercel** (excedimos la capa gratuita): eliminar el entorno de
  desarrollo remoto, revisar y borrar bases de datos de prueba si existen. **Pospuesto a
  proposito por decision del usuario en este chat** — no entra en la proxima iteracion.
- **Cableado de `Announcement` con el flujo de colaborador**: el mecanismo existe
  (`AnnouncementAudience.SPECIFIC_USERS` + `AnnouncementRecipient`) pero no esta conectado a
  ningun evento del flujo de colaborador — no se dispara automaticamente al aprobar/rechazar un
  aporte, y no existe una audiencia `COLLABORATORS` por rol (solo lista explicita de usuarios).

## Request 2 — Glosario Cultural

Checklist original de `requests/2`, punto por punto:

| # | Pedido | Estado | Detalle |
|---|--------|--------|---------|
| 1 | Mas contenido propio | 🟡 parcial | Mismo ~28 terminos que antes; se construyo el *mecanismo* de crecimiento (contribuciones), no contenido nuevo curado. |
| 2 | Paginas externas recomendadas | 🟡 parcial | Solo linkeo con atribucion via `/admin/sitios`, no integracion de contenido pesado. |
| 3 | Secciones + menu de navegacion | 🟡 parcial | 4 tabs (`dictionary/trivia/resources/contribute`) sin sincronizar con la URL (no son rutas compartibles); un solo item en el sidebar, sin submenu. |
| 4 | Contribucion de usuarios | ✅ hecho | — |
| 5 | Revision y aprobacion | ✅ hecho | — |
| 6 | Categorizar/etiquetar | 🟡 parcial | Modelo y filtro/UI listos, pero **no hay admin UI para asignar tags** a un termino al aprobarlo. |
| 7 | Busqueda avanzada | ❌ falta | Solo `includes()` de texto client-side; sin ranking/fuzzy ni integracion con `CommandK`. |
| 8 | Comentarios/discusion por termino | ❌ falta | `Comment` no tiene `glossaryTermId`. |
| 9 | Notificaciones de actualizaciones/contribuciones | ❌ falta | `PATCH /api/admin/glossary-suggestions/[id]` no dispara ninguna `Notification` (el flujo analogo de series si lo hace). |
| 10 | Votar/calificar terminos | ❌ falta | `Rating`/`UserRating` solo aplican a `Series`/`Season`. |
| 11 | Estadisticas de popularidad/uso | ❌ falta | `GlossaryTerm` no tiene `viewCount` ni analitica. |
| 12 | Integracion con otras plataformas | 🟡 parcial | Mismo mecanismo que el punto 2 (linkeo curado, no API/embeds). |
| 13 | Cuidado de recursos + creditos + linea legal | ✅ hecho | ISR, linkeo en vez de scraping, atribucion de fuente preservada, auth-gated. |
| 14 | Balance contenido propio/externo | 🟡 parcial | Separado por diseño (tabs distintas), pero el propio no crecio — balance es mas intencion que resultado medido. |
| 15 | No romper la Trivia | ✅ hecho | Cambio aditivo, verificado con `tsc`/`eslint`/build. |
| 16 | Entrelazar con gamificacion | 🟡 parcial (a proposito) | Ver `docs/gamificacion-roadmap.md` — 3 logros nuevos sobre el sistema calculado existente; el resto (modelo `Achievement`, XP/niveles, leaderboard, notificaciones de logro, insignias) sigue **fuera de alcance a proposito**. |

## Request 3 — nada implementado todavia

### Bug del carrusel en `/catalogo`

Causa raiz ya identificada (ver `docs/plan-proxima-iteracion-2026-09-05.md` para el detalle
tecnico completo) — falta el fix.

### Vista `/ver` y reuso entre catalogos

- **Cards duplicadas**: `VerPage.tsx` arma su propia `<article className="ver-card">` a mano
  (lineas ~369-485) y `CatalogoClient.tsx` arma su propia `.serie-card` — ninguna usa `MediaCard`
  de `src/components/design-system/`. Justo el punto que pide `requests/3` ("reusar todo lo
  posible... reusable en ambos catalogos") no esta resuelto.
- **Dos motores de carrusel separados**: `CatalogCarouselRow`/`CatalogCarouselView`
  (`/catalogo`) vs `MediaCarousel` (`/ver`) son implementaciones independientes — el bug de
  hover solo vive en una de ellas porque no comparten codigo.

### Panel de colaborador — herramientas pedidas en `requests/3`

- **Filtros**: la tabla de "Mis series" solo tiene un buscador de texto libre; falta filtro por
  estado/visibilidad, pais, tipo y rango de fecha.
- **Estadisticas de sus aportes sin leak**: no existe ningun endpoint/UI que agregue vistas,
  favoritos, comentarios o reseñas por serie del colaborador. No hay funcion equivalente a
  `getWatchableSeries()` para esto en `src/lib/database.ts` — hay que crearla.
- **Estadisticas de aceptacion**: la publicacion de `COLLABORATOR` es inmediata (`VISIBLE` por
  defecto); "aceptacion" hoy es casi binaria salvo que un admin oculte/rechace despues — no hay
  tracking de tiempo a aprobacion ni de motivos de rechazo.
- **Notificaciones dentro del panel**: la infraestructura (`Notification`) existe y ya dispara
  en aprobacion/rechazo, pero no hay ninguna vista en `/admin/colaborador` que las liste, ni
  tipos nuevos para eventos futuros (nuevo comentario, hito de vistas).
- **Comunicacion con curaduria**: no existe ningun canal dedicado. `/feedback`
  (`FeatureRequest`) es publico y generico — no apto tal cual para comunicacion
  privada colaborador↔curaduria sin exponer conversaciones de negocio a la comunidad.
- **Documentacion/guias**: no hay ninguna pagina de docs para colaboradores.
  `ColaboradorNav.tsx` solo tiene 2 links: "Mis series" e "Importar desde YouTube".
- **Soporte tecnico dedicado**: no existe un canal separado del board publico de feedback.

## Fuera de alcance permanente (documentado aparte)

`docs/gamificacion-roadmap.md` ya deja explicito que modelo `Achievement`, XP/niveles,
leaderboard, notificaciones de logro e insignias **no se implementan** hasta que se decida
puntualmente — no repetir esa conversacion aca, solo referenciarla.

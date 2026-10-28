# Pendientes reales

**Verificado contra el código y la base de producción: 2026-10-28.** Reemplaza a los
docs de pendientes, planes y entregas de julio–octubre, que se borraron porque casi
todo lo que listaban ya está en producción (ver `CHANGELOG.md`). Antes de confiar en
este archivo, mirar la fecha: si no podés citar `ruta:linea`, no está implementado.

El backlog vivo es `FeatureRequest` (`/feedback`, `/admin/feedback`): al 2026-10-28
hay 1 OPEN (#179 Universos) y 1 IN_PROGRESS (#147 Propuesta de colaboración), 151
COMPLETED y 9 REJECTED.

## Código

| Ítem                                                                                                                 | Evidencia                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plantillas de mail sin caller: `renderSupportReplyEmail`, `renderContributionReviewedEmail`, `renderSignInLinkEmail` | Solo aparecen en `src/lib/email-templates.ts`. Responder un soporte o revisar un aporte crea la notificación in-app pero no manda mail.                                                                                      |
| `/ver` usa siempre mercado `AR`                                                                                      | `getWatchableSeries(market = 'AR')` y `getVerAdminRows(market = 'AR')` en `src/lib/database.ts`; `/ver/(index)/page.tsx` no pasa el país. `x-vercel-ip-country` solo se lee en `/api/activity`, `/api/geo` y `/api/traffic`. |
| `/catalogo` arma `.serie-card` a mano                                                                                | `CatalogoClient.tsx`; `MediaCard` solo se usa en un widget del dashboard del catálogo.                                                                                                                                       |
| CSS SSR de Ant Design inline en cada página                                                                          | `AntdRegistry` en `src/app/layout.tsx`, sin extracción a CSS estático. Medido el 13/10: 405 KB de CSS inline en `/catalogo`.                                                                                                 |
| Contador de reseñas en el workspace admin                                                                            | `reviewCount = 0` con `TODO` en `admin/series/[id]/WorkspaceClient/WorkspaceClient.tsx:48`.                                                                                                                                  |
| Tabs de `/glosario`                                                                                                  | Leen `?view=` pero no lo escriben (`GlosarioClient.tsx`): no son compartibles ni sobreviven a un reload.                                                                                                                     |
| Glosario sin comentarios, votos ni vistas                                                                            | `GlossaryTerm` no tiene `viewCount` ni relación con `Comment`/ratings. Prioridad baja por tráfico.                                                                                                                           |
| Anuncios sin audiencia por rol                                                                                       | `AnnouncementAudience` no tiene `COLLABORATORS`; nada dispara anuncios desde el flujo de aportes.                                                                                                                            |
| Guionistas sin editor                                                                                                | Existen `Writer`/`SeriesWriter` y la ficha pública, pero no hay pantalla admin ni API para cargar créditos.                                                                                                                  |
| Múltiples visionados (rewatch)                                                                                       | `ViewStatus` guarda un estado por entidad; no hay modelo de vueltas.                                                                                                                                                         |
| Importación que corrija datos existentes                                                                             | `api/user/account/import` es solo merge: no reemplaza marcas ni resuelve conflictos. Tampoco hay importación por título, CSV o texto libre.                                                                                  |
| Logros persistidos                                                                                                   | Los 48 logros son calculados (`perfil/achievements`); no hay modelo `Achievement`, fecha de desbloqueo ni aviso al desbloquear. XP/niveles/insignias nunca se decidieron.                                                    |
| Resumen anual ("tu año")                                                                                             | Existe el resumen mensual (`MonthlyRecap`); el anual no.                                                                                                                                                                     |
| Dailymotion                                                                                                          | Adaptador listo (`episode-platforms.ts`), pero falta `NEXT_PUBLIC_DAILYMOTION_PLAYER_ID` y obras verificadas. Prod tiene 0 episodios Dailymotion (2.394 YouTube, 1 Vimeo).                                                   |

## Contenido y operación (no es código)

- **Noticias**: 126 propuestas en estado REVIEW en `/admin/noticias` esperando revisión editorial.
- **Reseñas editoriales**: 2 series con `review` cargada.
- **/ver**: Craving You necesita el minuto donde empieza el EP2 para partir el video; Blossom Campus pide membresía en STRONGBERRY; VBL Series bloqueadas. Detalle en [ampliacion-ver-2026-10-25.md](ampliacion-ver-2026-10-25.md).
- **Fuentes de noticias pausadas**: Mundo Asia, CafeBL y BLTai (`news-source-policy.ts`).
- **Pruebas manuales nunca hechas**: hoja nativa de compartir en un teléfono real y ciclo HTTP de caché al publicar/ocultar patrocinio. El error de hidratación React #418 visto el 12/10 no se investigó.
- **Patrocinio**: `/apoyar` sigue oculto; falta configurar los medios (cuentas Cafecito/Ko-fi).

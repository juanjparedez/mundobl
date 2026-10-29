# Pendientes reales

**Verificado contra el código y la base de producción: 2026-10-28.** Reemplaza a los
docs de pendientes, planes y entregas de julio–octubre, que se borraron porque casi
todo lo que listaban ya está en producción (ver `CHANGELOG.md`). Antes de confiar en
este archivo, mirar la fecha: si no podés citar `ruta:linea`, no está implementado.

El backlog vivo es `FeatureRequest` (`/feedback`, `/admin/feedback`): al 2026-10-28
hay 1 OPEN (#179 Universos) y 1 IN_PROGRESS (#147 Propuesta de colaboración), 151
COMPLETED y 9 REJECTED.

## Código

| Ítem                                        | Evidencia                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS SSR de Ant Design inline en cada página | `AntdRegistry` en `src/app/layout.tsx`, sin extracción a CSS estático. Medido el 13/10: 405 KB de CSS inline en `/catalogo`.                |
| Glosario sin comentarios, votos ni vistas   | `GlossaryTerm` no tiene `viewCount` ni relación con `Comment`/ratings. Prioridad baja por tráfico.                                          |
| Guionistas sin editor                       | Existen `Writer`/`SeriesWriter` y la ficha pública, pero no hay pantalla admin ni API para cargar créditos.                                 |
| Múltiples visionados (rewatch)              | `ViewStatus` guarda un estado por entidad; no hay modelo de vueltas.                                                                        |
| Importación que corrija datos existentes    | `api/user/account/import` es solo merge: no reemplaza marcas ni resuelve conflictos. Tampoco hay importación por título, CSV o texto libre. |
| Resumen anual ("tu año")                    | Existe el resumen mensual (`MonthlyRecap`); el anual no.                                                                                    |

## Contenido y operación (no es código)

- **Noticias**: 126 propuestas en estado REVIEW en `/admin/noticias` esperando revisión editorial.
- **Reseñas editoriales**: 2 series con `review` cargada.
- **/ver** (prod, 2026-10-28): Craving You (ficha 140) tiene 0 videos: falta el minuto donde empieza el EP2 para partir el video. Blossom Campus está con 6 videos OK (último sondeo 24/10). Fight for You y Eternal Butler (VBL) tienen 0 videos: EP1–3 bloqueados en los siete mercados y el resto para miembros. Detalle en [ampliacion-ver-2026-10-25.md](ampliacion-ver-2026-10-25.md).
- **Dailymotion**: el embed funciona sin Player ID (embed clásico), pero prod tiene 0 episodios Dailymotion (2.394 YouTube, 1 Vimeo): falta cargar obras de canales oficiales verificados (`official-video-publishers.ts`).
- **Fuentes de noticias pausadas**: Mundo Asia, CafeBL y BLTai (`news-source-policy.ts`).
- **Pruebas manuales nunca hechas**: hoja nativa de compartir en un teléfono real y ciclo HTTP de caché al publicar/ocultar patrocinio. El error de hidratación React #418 visto el 12/10 no se investigó.
- **Patrocinio**: `/apoyar` sigue oculto; falta configurar los medios (cuentas Cafecito/Ko-fi).

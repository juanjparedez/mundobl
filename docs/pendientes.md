# Pendientes reales

**Verificado contra el código, los logs y la base de producción: 2026-11-27.** Reemplaza a los
docs de pendientes, planes y entregas de julio–octubre, que se borraron porque casi
todo lo que listaban ya está en producción (ver `CHANGELOG.md`). Antes de confiar en
este archivo, mirar la fecha: si no podés citar `ruta:linea`, no está implementado.

El backlog vivo es `FeatureRequest` (`/feedback`, `/admin/feedback`): al 2026-11-27
hay 3 OPEN (#181 Reacciones, que ya salió el 2026-11-11 y falta cerrar; #183 error
"Loading chunk failed" en `/watching`; #184 «Pasar al catálogo», arreglado en este
cambio), 1 IN_PROGRESS (#147 Propuesta de colaboración), 154 COMPLETED y 9 REJECTED.

## Código

| Ítem                                      | Evidencia                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Glosario sin comentarios, votos ni vistas | `GlossaryTerm` no tiene `viewCount` ni relación con `Comment`/ratings. Prioridad baja por tráfico.                                          |
| Guionistas sin editor                     | Existen `Writer`/`SeriesWriter` y la ficha pública, pero no hay pantalla admin ni API para cargar créditos.                                 |
| Múltiples visionados (rewatch)            | `ViewStatus` guarda un estado por entidad; no hay modelo de vueltas.                                                                        |
| Importación que corrija datos existentes  | `api/user/account/import` es solo merge: no reemplaza marcas ni resuelve conflictos. Tampoco hay importación por título, CSV o texto libre. |
| Resumen anual ("tu año")                  | Existe el resumen mensual (`MonthlyRecap`); el anual no.                                                                                    |

## Contenido y operación (no es código)

- **Claves que faltan en el Worker** (verificado 2026-11-27 en la lista de secrets de `mundobl`):
  `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` (sin correos desde el 10/11), `VAPID_PRIVATE_KEY`
  (sin push), `GEMINI_API_KEY` (la tarea diaria `news` falla con «GEMINI_API_KEY no esta configurado»
  desde el 16/11 como mínimo; no entra ninguna noticia desde el 3/11) y `YOUTUBE_API_KEY`. Se cargan
  como secrets del repo y se aplican con «Deploy producción».
- **Backups semanales apagados**: `Backup de la base` se saltea cada domingo porque la variable
  `BACKUPS_ENABLED` no existe; tampoco existe el bucket `mundobl-backups` ni el secret
  `R2_BACKUP_BUCKET`. Hoy solo cubre Time Travel de D1 (30 días). Pasos en [backups.md](backups.md).
- **Imágenes en Supabase**: 17 series siguen con `imageUrl`/`imageThumbUrl` en Supabase Storage;
  pasarlas a R2 con `scripts/migrate-images-to-r2.ts` cuando Supabase vuelva a servir (17/12).
- **Limpieza de Cloudflare/Vercel**: el Worker conserva secrets que ya no usa (`DATABASE_URL`,
  `DIRECT_URL`, `PROJECT_VERCEL_URL`, `NX_DAEMON`, `TURBO_*`) y el proyecto `mundobl` de Vercel sigue
  existiendo. Las claves de Supabase quedan hasta mover esas 17 imágenes. Web Analytics sigue apagado
  (`NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN` vacío).

- **Noticias**: 164 propuestas en estado REVIEW en `/admin/noticias` esperando revisión editorial.
- **Reseñas editoriales**: 2 series con `review` cargada.
- **/ver** (prod, 2026-10-28): Craving You (ficha 140) tiene 0 videos: falta el minuto donde empieza el EP2 para partir el video. Blossom Campus está con 6 videos OK (último sondeo 24/10). Fight for You y Eternal Butler (VBL) tienen 0 videos: EP1–3 bloqueados en los siete mercados y el resto para miembros. Detalle en [ampliacion-ver-2026-10-25.md](ampliacion-ver-2026-10-25.md).
- **Dailymotion**: el embed funciona sin Player ID (embed clásico), pero prod tiene 0 episodios Dailymotion (2.394 YouTube, 1 Vimeo): falta cargar obras de canales oficiales verificados (`official-video-publishers.ts`).
- **Fuentes de noticias pausadas**: Mundo Asia, CafeBL y BLTai (`news-source-policy.ts`).
- **Pruebas manuales nunca hechas**: hoja nativa de compartir en un teléfono real y ciclo HTTP de caché al publicar/ocultar patrocinio. El error de hidratación React #418 visto el 12/10 no se investigó.
- **Patrocinio**: `/apoyar` sigue oculto; falta configurar los medios (cuentas Cafecito/Ko-fi).

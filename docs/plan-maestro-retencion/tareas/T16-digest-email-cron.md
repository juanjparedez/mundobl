# T16 — Email + cron del digest semanal

**Fase:** 2 · **Esfuerzo:** M · **Depende de:** T14, T15
**Objetivo:** el único mecanismo de retorno que hoy no existe. Un email por semana, solo con datos del propio usuario, solo si hay algo que decir.

## Requisitos de entorno (Vercel)

`RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`. Si `isEmailConfigured()` es `false`, el cron responde `{ skipped: 'email_not_configured' }` y no falla.

## Plantilla

`src/lib/email-templates.ts` → `renderWeeklyDigestEmail(input: { name: string | null; digest: WeeklyDigest; siteUrl: string; unsubscribeUrl: string; prefsUrl: string }): EmailRender`. Seguir el estilo de `renderWelcomeEmail`. Secciones en este orden, solo las no vacías: "Episodios nuevos", "Esta semana estrenan", "Casi terminás", "En pausa". Cada serie: póster chico, título, "3 de 8", link a la ficha. Pie: link a preferencias y link de baja de un clic. Sin novedades del sitio, sin llamados a donar.

Asunto: `Tus series esta semana · MundoBL`. Versión texto plano incluida (`EmailRender` ya lo contempla; verificar).

## Cron

`src/app/api/cron/weekly-digest/route.ts` (GET, mismo chequeo `Authorization: Bearer ${CRON_SECRET}` que `playability`). Lógica:

1. Candidatos: usuarios no baneados, con `prefs?.weeklyDigest ?? true`, con ≥ 1 fila de serie VIENDO, y con `lastDigestAt` nulo o `< now - 6 días`.
2. Para cada uno (secuencial, máx. 200 por corrida; si hay más, responder `{ remaining }` y la próxima corrida sigue): `buildWeeklyDigest` → si `null`, saltar (**no** actualizar `lastDigestAt`, así se reintenta la semana siguiente). Si hay digest: `sendEmail`, `notificationPrefs.upsert({ lastDigestAt: now })`, y crear una `Notification` in-app `type: 'weekly_digest'` con el mismo resumen en una línea y `linkPath: '/watching'`.
3. Respuesta `{ sent, skipped, failed, remaining }`; los errores por usuario se loguean y no cortan la corrida.
4. Query param `?dryRun=1` → calcula todo y no envía ni escribe.

`vercel.json`: agregar `{ "path": "/api/cron/weekly-digest", "schedule": "0 13 * * 5" }` (viernes 13:00 UTC = 10:00 Argentina). Plan hobby de Vercel: verificar el límite de crons antes de agregar.

## Script de envío manual

`scripts/send-digest.ts --user <id> [--apply]`: muestra el HTML generado (lo guarda en `.tmp/digest-<id>.html`) y solo envía con `--apply`. Para que Juan se lo mande a sí mismo antes de activar el cron.

## Criterios de aceptación

- [ ] `?dryRun=1` en producción devuelve conteos sin enviar nada.
- [ ] Juan recibe su propio digest con `scripts/send-digest.ts --apply` y se ve bien en Gmail móvil.
- [ ] Usuario con `weeklyDigest = false` nunca aparece en `sent`.
- [ ] Usuario sin series VIENDO nunca recibe nada.
- [ ] Correr el cron dos veces el mismo día no manda dos emails.
- [ ] El link de baja funciona desde el email real.

# T19 — Reactivación única por email (script)

**Fase:** 2 · **Esfuerzo:** S · **Depende de:** T16 (plantillas y `sendEmail` probados)
**Objetivo:** hay ~60 registrados que nunca marcaron nada. Un solo email honesto contándoles que el tracker cambió, con el onboarding nuevo como destino. **El envío real lo dispara Juan a mano.**

## Script

`scripts/send-reactivation.ts` (dry-run por defecto):

- Candidatos: `User` no admin, no baneado, sin filas en `ViewStatus`, con `prefs?.emailEnabled !== false` **y** `prefs?.weeklyDigest !== false` (respetar cualquier baja previa), registrado hace más de 7 días, y sin `Notification` de `type: 'reactivation_2026'` (se crea una al enviar, como marca de idempotencia).
- Sin `--apply`: imprime la lista (id, fecha de registro, sin email en claro: mostrar `j***@gmail.com`) y el total.
- Con `--apply`: envía uno por uno con `sendEmail`, crea la `Notification` marca, espera 300 ms entre envíos, y resume `{ sent, failed }`.
- `--limit N` para probar con pocos.

## Plantilla

`renderReactivationEmail({ name, siteUrl, unsubscribeUrl }): EmailRender` en `email-templates.ts`. Texto (es): asunto "MundoBL cambió: ahora podés seguir tus series episodio por episodio"; cuerpo de 4 líneas máximo, un solo botón "Empezar" → `${siteUrl}/bienvenida`, pie con baja de un clic. Sin pedidos de apoyo, sin listas de novedades.

## Criterios de aceptación

- [ ] Dry-run lista el conjunto correcto y no envía nada.
- [ ] `--apply --limit 1` a la cuenta de prueba de Juan llega y el link de baja funciona.
- [ ] Correr `--apply` dos veces no reenvía a nadie.
- [ ] Documentar en `docs/backups.md` o `context.md` que este script se corrió (fecha y cantidad) cuando Juan lo ejecute.

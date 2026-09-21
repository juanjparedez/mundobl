# T14 — Preferencia de digest semanal

**Fase:** 2 · **Esfuerzo:** S · **Depende de:** nada
**Objetivo:** tener el interruptor y el registro de envío antes de mandar el primer digest.

## Decisión pendiente de Juan/Flor

Opt-out (default `true`) u opt-in (default `false`). Esta spec usa **opt-out** con baja de un clic; cambiar solo el `@default` si deciden lo contrario. En cualquier caso el digest **nunca se manda** a quien no tiene al menos una serie en VIENDO (lo garantiza T15).

## Migración

`npx prisma migrate dev --name add_weekly_digest_prefs`

```prisma
model NotificationPrefs {
  // …
  weeklyDigest  Boolean   @default(true)
  lastDigestAt  DateTime?
}
```

Ojo: hoy solo existe 1 fila de `NotificationPrefs`; los demás usuarios no tienen fila. Regla: **sin fila = valores por defecto** (`weeklyDigest: true`). Cualquier lectura usa `prefs?.weeklyDigest ?? true`.

Nota sobre `emailEnabled` (default `false`): hoy gobierna los emails de notificación; el digest **no** depende de él, depende solo de `weeklyDigest`. El link de baja de `unsubscribeUrl()` (`src/app/api/email/unsubscribe/route.ts`) tiene que poner **ambos** en `false`.

## UI

En `src/app/(app)/perfil/ProfileSettings/` (o `NotificationsWidget`, donde estén hoy los toggles de `NotificationPrefs`): un `Switch` "Resumen semanal por email" (`t('notificationPrefs.weeklyDigest')`) con descripción `t('notificationPrefs.weeklyDigestDesc')`: "Una vez por semana, solo si tenés series en curso: qué estrena, qué te falta terminar. Sin novedades del sitio ni publicidad." Persistir con el endpoint existente `PATCH /api/notifications/prefs` (agregar el campo al body permitido y a la validación).

## Criterios de aceptación

- [ ] Toggle visible en el perfil, persiste y se relee al recargar.
- [ ] Usuario sin fila de prefs: el toggle aparece encendido (default).
- [ ] El link de baja del email deja `weeklyDigest = false` y `emailEnabled = false`.
- [ ] `npm run db:check` limpio; 10 locales.

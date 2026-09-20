# Plan maestro de retención — MundoBL

> Objetivo único: **que la gente que se registra vuelva a usar el tracker la semana siguiente.**
> Se logra mejorando lo que ya existe (ficha de serie, `/watching`, home, notificaciones), no construyendo superficies nuevas.
> Sin paywall, sin suscripción, sin manipulación. Solo avisos derivados de los datos del propio usuario.

Diagnóstico completo con números: [00-DIAGNOSTICO.md](00-DIAGNOSTICO.md).
Cómo trabaja el agente que implementa cada tarea: [PROTOCOLO-AGENTE.md](PROTOCOLO-AGENTE.md).
Estado vivo de cada tarea: [ESTADO.md](ESTADO.md).

---

## Métrica norte

**Usuarios (no admin) que marcaron al menos un episodio en dos semanas calendario distintas.**

| Métrica                                        | Hoy (2026-09-20) | Meta 90 días |
| ---------------------------------------------- | ---------------- | ------------ |
| Retención W1 de cohortes nuevas                | 0–15 %           | 35 %         |
| Retención de tracking W2                       | ~5 %             | 25 %         |
| Registro (visitantes → cuenta)                 | 1,3 %            | 4 %          |
| Tiempo hasta el primer episodio marcado        | sin dato         | < 60 s post-login |
| WAU no-admin                                   | ~10              | 60           |

---

## Hechos del código que todas las tareas tienen que respetar

- La ficha `/series/[id]` es **ISR con `revalidate = 900`** y **no llama `auth()` en el servidor**. Todo lo que depende del usuario se hidrata en cliente vía `SeriesUserStatusProvider` → `GET /api/series/[id]/my-status`. Ninguna tarea puede meter `auth()` en `src/app/(app)/series/[id]/page.tsx` ni en `src/app/page.tsx`.
- Estado de tracking: tabla `ViewStatus` con filas **independientes** por serie (`userId+seriesId`), por temporada (`userId+seasonId`, hoy sin uso) y por episodio (`userId+episodeId`). Enum `WatchStatus`: `SIN_VER | VIENDO | VISTA | ABANDONADA | RETOMAR`.
- `/watching` (`CurrentlyWatchingDashboard`) lista **solo filas de serie con `status = 'VIENDO'`**. Marcar episodios hoy **no** toca la fila de serie: 9 usuarios tienen episodios marcados y `/watching` vacío. Eso lo arregla T03.
- Endpoints existentes: `POST /api/series/[id]/view-status {status}`, `POST /api/episodes/[id]/view-status {status: 'VISTA'|'SIN_VER'}`, `GET /api/series/[id]/my-status`, `GET /api/currently-watching`, `GET /api/view-status[?all=true]`.
- Auth: `requireAuth()` de `src/lib/auth-helpers.ts` devuelve `{ authorized, userId, response }`. Login: `signIn('google', { callbackUrl })` de `next-auth/react` (ver `TopBar.tsx:223`).
- i18n: `src/i18n/messages.ts` tiene el `TranslationShape` + bloques `es` y `en` inline; los otros 8 locales en `src/i18n/locales/*.ts`. Para completar los 8 restantes: `npx tsx scripts/translate-missing-keys.ts` (necesita `GEMINI_API_KEY`). Los componentes usan `const { t } = useLocale()` y `interpolateMessage(t('k'), { var })`.
- Analytics: `trackEvent(name, props)` de `src/lib/analytics.ts`. Solo datos no personales. Hay límite de eventos en el plan gratuito.
- Email: `sendEmail()` de `src/lib/email.ts` (Resend; `isEmailConfigured()`), plantillas en `src/lib/email-templates.ts` (patrón `renderXEmail(input): EmailRender`), baja vía `unsubscribeUrl(userId, baseUrl)`.
- Cron: patrón de `src/app/api/cron/playability/route.ts` (header `Authorization: Bearer ${CRON_SECRET}`), registrado en `vercel.json`.
- Push: `sendPushToUser()` en `src/lib/web-push.ts`; del lado cliente `enablePush()` / `isPushSubscribed()` en `src/lib/web-push-prefs.ts`.
- Migraciones: `npx prisma migrate dev --name <snake_case>`; toda **tabla nueva** necesita `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY` en la misma migración (columnas nuevas en tablas existentes no).
- Design system: `PanelCard, StatCard, ActionCard, MediaCard, Chip, EmptyState, SectionHeader, DataTable, PanelModal` en `src/components/design-system/`.
- Roles: `User.role` ∈ `ADMIN | MODERATOR | COLLABORATOR | VISITOR`. Métricas siempre excluyen `ADMIN`.

---

## Fases y tareas

Orden de ejecución recomendado: **T03 → T01 → T04 → T05 → T06 → T07 → T02 → T08 → T09 → T10 → T12 → T11a → T11b → T14 → T15 → T16 → T17 → T18 → T13 → T19**. Las flechas de "depende de" mandan; dentro de una fase, el orden es por impacto.

### Fase 0 — Medir

| ID  | Tarea                                                     | Depende de | Esfuerzo |
| --- | --------------------------------------------------------- | ---------- | -------- |
| T01 | [Eventos de embudo en analytics](tareas/T01-eventos-embudo.md) | —     | S        |
| T02 | [Widget de retención en /admin/stats](tareas/T02-widget-retencion.md) | — | M    |

### Fase 1 — Activación (primer episodio marcado en menos de un minuto)

| ID   | Tarea                                                              | Depende de | Esfuerzo |
| ---- | ------------------------------------------------------------------ | ---------- | -------- |
| T03  | [Marcar episodio promueve la serie a VIENDO](tareas/T03-episodio-promueve-serie.md) | — | S |
| T04  | [`refetch()` en SeriesUserStatusProvider](tareas/T04-provider-refetch.md) | —   | S        |
| T05  | [Endpoint "hasta el episodio N"](tareas/T05-endpoint-progreso.md)  | T03        | M        |
| T06  | [Stepper "Voy por el episodio N" en la ficha](tareas/T06-stepper-ficha.md) | T04, T05 | M    |
| T07  | [CTA para anónimos + intención pendiente](tareas/T07-cta-anonimo-intencion.md) | T05, T06 | M |
| T08  | [Botón "+1" claro en /watching](tareas/T08-watching-mas-uno.md)    | T03        | S        |
| T09  | [Home centrada en el tracker](tareas/T09-home-tracker.md)          | —          | S        |
| T10  | [Home logueado → /watching](tareas/T10-home-redirect-watching.md)  | —          | S        |
| T11a | [Onboarding: backend](tareas/T11a-onboarding-backend.md)           | T05        | M        |
| T11b | [Onboarding: UI de 3 pasos](tareas/T11b-onboarding-ui.md)          | T11a, T06  | L        |
| T12  | [Separar acciones admin en EpisodesList](tareas/T12-episodeslist-admin-aparte.md) | T06 | S |
| T13  | [Tracking como invitado (localStorage)](tareas/T13-tracking-invitado.md) | T05, T07 | L    |

### Fase 2 — Retorno (razones honestas para volver)

| ID  | Tarea                                                              | Depende de | Esfuerzo |
| --- | ------------------------------------------------------------------ | ---------- | -------- |
| T14 | [Preferencia de digest semanal](tareas/T14-prefs-digest.md)        | —          | S        |
| T15 | [Cálculo del digest (lib pura)](tareas/T15-digest-lib.md)          | T03        | M        |
| T16 | [Email + cron del digest](tareas/T16-digest-email-cron.md)         | T14, T15   | M        |
| T17 | [Nudges "casi terminás" / "en pausa" en /watching](tareas/T17-nudges-watching.md) | T08 | S |
| T18 | [Pedir push/PWA tras el primer episodio](tareas/T18-push-tras-primer-track.md) | T01 | S |
| T19 | [Reactivación única por email (script)](tareas/T19-reactivacion-script.md) | T16 | S   |

### Fase 3 — Comunidad pegada al tracking (arrancar solo si retención W1 > 25 %)

| ID  | Tarea                                                   | Depende de | Esfuerzo |
| --- | ------------------------------------------------------- | ---------- | -------- |
| T20 | [Reacciones por episodio](tareas/T20-reacciones-episodio.md) | T06   | M        |
| T21 | [Comentarios de episodio protegidos por progreso](tareas/T21-comentarios-por-progreso.md) | T20 | M |
| T22 | [Tarjeta compartible "voy por el 5/12"](tareas/T22-tarjeta-compartible.md) | T06 | M |
| T23 | [Perfil público opt-in](tareas/T23-perfil-publico.md)   | T22        | L        |

### Fase 4 — Sostén (continuo)

| ID  | Tarea                                                   | Depende de | Esfuerzo |
| --- | ------------------------------------------------------- | ---------- | -------- |
| T24 | [Página "Cómo se sostiene MundoBL"](tareas/T24-pagina-sosten.md) | —   | S        |
| T25 | [Invitar colaboradores entre los trackers activos](tareas/T25-invitar-colaboradores.md) | T02 | S (manual) |

Esfuerzo: S ≤ 2 h, M ≤ 6 h, L 1–2 días. Ninguna tarea supera un PR.

---

## Reparto de tiempo

Durante las próximas seis semanas: **70 % en Fases 0–2, 30 % en admin/infra/feedback.** Los últimos quince commits antes de este plan fueron casi todos admin y eso no mueve ninguna métrica de arriba.

## Decisiones que quedan para Juan y Flor (no las toma el agente)

1. **Digest semanal: opt-out (por defecto activo) u opt-in.** T14 lo implementa como opt-out con baja de un clic, pero solo se envía si el usuario tiene al menos una serie en VIENDO. Si prefieren opt-in, cambiar el `@default` en la migración.
2. **Reactivación única (T19)**: es un email a 60 personas que nunca usaron el tracker. El script es dry-run por defecto; el envío real lo dispara Juan a mano.
3. **Cuándo abrir la Fase 3**: solo cuando el widget de T02 muestre retención W1 > 25 % durante dos semanas seguidas.

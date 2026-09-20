# T02 — Widget de retención en /admin/stats

**Fase:** 0 · **Esfuerzo:** M · **Depende de:** nada
**Objetivo:** que Juan y Flor vean cada semana, sin SQL a mano, si las cohortes nuevas vuelven y cuántos usuarios reales hay activos.

## Contexto

- Página: `src/app/(app)/admin/stats/page.tsx` + `StatsClient.tsx` (client) + `stats.css`. Los datos vienen de `GET /api/admin/stats` (`src/app/api/admin/stats/route.ts`), que ya hace varios `prisma.*.count/groupBy` en un `Promise.all`.
- Fuente de "actividad": tabla `AccessLog` (`userId`, `createdAt`, `action = 'PAGE_VIEW'`). Fuente de "tracking": `ViewStatus.updatedAt`.
- Excluir siempre `User.role = 'ADMIN'`.

## Endpoint nuevo

`GET /api/admin/stats/retention` (archivo `src/app/api/admin/stats/retention/route.ts`). Proteger con `requireRole(['ADMIN'])` de `src/lib/auth-helpers.ts`. Responde:

```ts
interface RetentionResponse {
  cohorts: Array<{
    week: string;      // 'YYYY-MM-DD' (lunes de la semana de registro)
    signups: number;
    w1: number;        // volvieron la semana siguiente (AccessLog)
    w2: number;
    w3plus: number;
    trackedW0: number; // marcaron algo (ViewStatus) en su semana de registro
    trackedW1: number; // marcaron algo la semana siguiente
  }>;                  // últimas 14 semanas, orden ascendente
  wau: Array<{ week: string; visitors: number; trackers: number }>; // últimas 16 semanas
  totals: {
    usersNonAdmin: number;
    usersWithAnyTracking: number;
    trackersLast7d: number;
    trackersLast30d: number;
  };
}
```

Implementar con `prisma.$queryRaw` (SQL en un solo lugar, `src/lib/retention-stats.ts`, función `getRetentionStats()` que devuelve `RetentionResponse`). Base de la query de cohortes:

```sql
with act as (
  select "userId", date_trunc('week', "createdAt") wk
  from "AccessLog"
  where "userId" is not null and "createdAt" > now() - interval '16 weeks'
  group by 1, 2
), trk as (
  select "userId", date_trunc('week', "updatedAt") wk
  from "ViewStatus"
  where "userId" is not null and "updatedAt" > now() - interval '16 weeks'
  group by 1, 2
), u as (
  select id, date_trunc('week', "createdAt") signup_wk
  from "User" where role <> 'ADMIN'
)
select to_char(u.signup_wk, 'YYYY-MM-DD') as week,
  count(distinct u.id) as signups,
  count(distinct case when a.wk = u.signup_wk + interval '1 week' then a."userId" end) as w1,
  count(distinct case when a.wk = u.signup_wk + interval '2 week' then a."userId" end) as w2,
  count(distinct case when a.wk >= u.signup_wk + interval '3 week' then a."userId" end) as w3plus,
  count(distinct case when t.wk = u.signup_wk then t."userId" end) as "trackedW0",
  count(distinct case when t.wk = u.signup_wk + interval '1 week' then t."userId" end) as "trackedW1"
from u
left join act a on a."userId" = u.id
left join trk t on t."userId" = u.id
where u.signup_wk > now() - interval '14 weeks'
group by u.signup_wk order by u.signup_wk;
```

Los `count(...)` de `$queryRaw` llegan como `bigint`: convertir con `Number()` antes de responder.

## UI

En `StatsClient.tsx`, una sección nueva arriba de los rankings, con `SectionHeader` título `t('adminStats.retentionTitle')` y dos `PanelCard`:

1. **Cohortes**: `DataTable` del design-system con columnas semana / registros / W1 / W2 / W3+ / trackW0 / trackW1. Mostrar W1 también como porcentaje (`w1/signups`). Filas con `signups = 0` no se muestran.
2. **Activos por semana**: `LineChart` de `src/components/charts/LineChart/` con dos series (visitantes, trackers). Arriba, cuatro `StatCard` con `totals`.

Carga con `fetch('/api/admin/stats/retention')` en un `useEffect` propio, con estado de carga y error (`EmptyState` si falla).

## i18n (keys nuevas bajo `adminStats`)

`retentionTitle`, `retentionCohorts`, `retentionWeek`, `retentionSignups`, `retentionW1`, `retentionW2`, `retentionW3`, `retentionTrackedW0`, `retentionTrackedW1`, `retentionWau`, `retentionVisitors`, `retentionTrackers`, `retentionTotalUsers`, `retentionUsersTracking`, `retentionTrackers7d`, `retentionTrackers30d`, `retentionError`.

## Criterios de aceptación

- [ ] Un usuario no admin recibe 403 en el endpoint.
- [ ] La tabla muestra las últimas 14 semanas y coincide con la query corrida a mano en Supabase.
- [ ] Los admins no cuentan en ninguna cifra.
- [ ] El endpoint responde en menos de 2 s con los ~190k `AccessLog` actuales (ya hay índices en `createdAt` y `userId`).
- [ ] type-check, lint y build en verde; 10 locales.

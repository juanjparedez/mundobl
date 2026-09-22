import { prisma } from '@/lib/database';

export interface RetentionCohort {
  /** Lunes de la semana de registro, 'YYYY-MM-DD'. */
  week: string;
  signups: number;
  w1: number;
  w2: number;
  w3plus: number;
  trackedW0: number;
  trackedW1: number;
}

/** Alias y no interface: LineChart pide `Record<string, unknown>`, que una
 *  interface nombrada no satisface (no tiene index signature implicita). */
export type RetentionWauPoint = {
  week: string;
  visitors: number;
  trackers: number;
};

export interface RetentionTotals {
  usersNonAdmin: number;
  usersWithAnyTracking: number;
  trackersLast7d: number;
  trackersLast30d: number;
}

export interface RetentionResponse {
  cohorts: RetentionCohort[];
  wau: RetentionWauPoint[];
  totals: RetentionTotals;
}

interface CohortRow {
  week: string;
  signups: bigint;
  w1: bigint;
  w2: bigint;
  w3plus: bigint;
  trackedW0: bigint;
  trackedW1: bigint;
}

interface WauRow {
  week: string;
  visitors: bigint;
  trackers: bigint;
}

interface TotalsRow {
  usersNonAdmin: bigint;
  usersWithAnyTracking: bigint;
  trackersLast7d: bigint;
  trackersLast30d: bigint;
}

/**
 * Cohortes semanales de registro contra actividad posterior.
 *
 * `act`/`trk` se agregan a (usuario, semana) antes del join: sin eso, cada
 * PAGE_VIEW multiplicaria las filas del cruce. El fan-out que queda (una fila
 * por combinacion de semana activa y semana con tracking) no altera las
 * cifras porque todos los agregados son `count(distinct ...)`.
 */
async function getCohorts(): Promise<RetentionCohort[]> {
  const rows = await prisma.$queryRaw<CohortRow[]>`
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
    group by u.signup_wk
    order by u.signup_wk
  `;

  return rows.map((row) => ({
    week: row.week,
    signups: Number(row.signups),
    w1: Number(row.w1),
    w2: Number(row.w2),
    w3plus: Number(row.w3plus),
    trackedW0: Number(row.trackedW0),
    trackedW1: Number(row.trackedW1),
  }));
}

/**
 * Activos por semana. `generate_series` da las 16 semanas completas para que
 * una semana sin actividad aparezca en cero y no como un hueco en la linea.
 */
async function getWau(): Promise<RetentionWauPoint[]> {
  const rows = await prisma.$queryRaw<WauRow[]>`
    with weeks as (
      select generate_series(
        date_trunc('week', now()) - interval '15 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) as wk
    ), non_admin as (
      select id from "User" where role <> 'ADMIN'
    ), act as (
      select distinct date_trunc('week', l."createdAt") wk, l."userId"
      from "AccessLog" l
      join non_admin u on u.id = l."userId"
      where l."createdAt" > now() - interval '16 weeks'
    ), trk as (
      select distinct date_trunc('week', v."updatedAt") wk, v."userId"
      from "ViewStatus" v
      join non_admin u on u.id = v."userId"
      where v."updatedAt" > now() - interval '16 weeks'
    )
    select to_char(w.wk, 'YYYY-MM-DD') as week,
      (select count(*) from act where act.wk = w.wk) as visitors,
      (select count(*) from trk where trk.wk = w.wk) as trackers
    from weeks w
    order by w.wk
  `;

  return rows.map((row) => ({
    week: row.week,
    visitors: Number(row.visitors),
    trackers: Number(row.trackers),
  }));
}

async function getTotals(): Promise<RetentionTotals> {
  const rows = await prisma.$queryRaw<TotalsRow[]>`
    select
      (select count(*) from "User" where role <> 'ADMIN') as "usersNonAdmin",
      (select count(distinct v."userId")
         from "ViewStatus" v join "User" u on u.id = v."userId"
        where u.role <> 'ADMIN') as "usersWithAnyTracking",
      (select count(distinct v."userId")
         from "ViewStatus" v join "User" u on u.id = v."userId"
        where u.role <> 'ADMIN'
          and v."updatedAt" >= now() - interval '7 days') as "trackersLast7d",
      (select count(distinct v."userId")
         from "ViewStatus" v join "User" u on u.id = v."userId"
        where u.role <> 'ADMIN'
          and v."updatedAt" >= now() - interval '30 days') as "trackersLast30d"
  `;

  const row = rows[0];
  return {
    usersNonAdmin: Number(row.usersNonAdmin),
    usersWithAnyTracking: Number(row.usersWithAnyTracking),
    trackersLast7d: Number(row.trackersLast7d),
    trackersLast30d: Number(row.trackersLast30d),
  };
}

export async function getRetentionStats(): Promise<RetentionResponse> {
  const [cohorts, wau, totals] = await Promise.all([
    getCohorts(),
    getWau(),
    getTotals(),
  ]);

  return { cohorts, wau, totals };
}

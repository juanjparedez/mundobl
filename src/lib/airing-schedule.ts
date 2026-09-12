/**
 * Logica pura de dias de emision (`Series.airDays`).
 *
 * Vivia privada dentro de `src/components/watching/CurrentlyWatchingDashboard.tsx`.
 * Se extrajo aca cuando la parrilla semanal de `/estrenos` necesito lo mismo, y de
 * paso saca de ese componente las etiquetas en español hardcodeadas: este modulo
 * devuelve solo datos (`type` + `daysDiff`) y cada caller traduce con `useLocale()`.
 *
 * Por que `airDays` y no `Episode.airDate`: medido el 2026-09-12, `airDate` es el
 * `publishedAt` de YouTube — un archivo historico de subidas (2022 -> 398 episodios,
 * 2023 -> 315, 2024 -> 201) y solo 2 filas en los ultimos 7 dias, todas de una serie
 * `USER_EMBED`. No es un feed de estrenos. `airDays` en cambio esta cargado en las 40
 * series de 2026, todas `CURATED` + `PERSONAL`.
 */

/** Tokens aceptados en `Series.airDays` -> dia de la semana (0 = domingo, 6 = sabado). */
export const AIR_DAY_MAP: Record<string, number> = {
  domingo: 0,
  dom: 0,
  sunday: 0,
  sun: 0,
  lunes: 1,
  lun: 1,
  monday: 1,
  mon: 1,
  martes: 2,
  mar: 2,
  tuesday: 2,
  tue: 2,
  miercoles: 3,
  miércoles: 3,
  mie: 3,
  mié: 3,
  wednesday: 3,
  wed: 3,
  jueves: 4,
  jue: 4,
  thursday: 4,
  thu: 4,
  viernes: 5,
  vie: 5,
  friday: 5,
  fri: 5,
  sabado: 6,
  sábado: 6,
  sab: 6,
  sáb: 6,
  saturday: 6,
  sat: 6,
};

/**
 * Ventana de vigencia de la parrilla, en semanas desde `Series.createdAt`.
 *
 * `airDays` nunca se apaga: una serie que termino de emitirse en mayo sigue diciendo
 * "jueves" para siempre. Sin acotarlo, la parrilla termina publicando un horario falso,
 * que es peor que no publicar nada. Flor carga la serie cuando empieza a emitirse, y una
 * temporada BL tailandesa dura 10-14 semanas, asi que 16 es el techo con holgura.
 *
 * La ventana caduca sola — nadie tiene que acordarse de apagar nada. El error, cuando
 * ocurre, es por omision (una serie muy larga desaparece de la parrilla) y nunca por
 * afirmacion falsa.
 *
 * Cuando esto moleste, el reemplazo es `Series.airingUntil DateTime?` (columna aditiva,
 * override manual del admin) y `isAiringNow` gana una linea al principio.
 */
export const AIRING_WINDOW_WEEKS = 16;

/** Fecha de corte de la ventana de vigencia. */
export function airingWindowStart(now: Date = new Date()): Date {
  return new Date(
    now.getTime() - AIRING_WINDOW_WEEKS * 7 * 24 * 60 * 60 * 1000
  );
}

/**
 * Tokeniza `Series.airDays` ("viernes, sabado") a dias de la semana ordenados y sin
 * repetir. Los tokens que no estan en `AIR_DAY_MAP` se descartan en silencio: el campo
 * es texto libre cargado a mano desde el admin.
 */
export function parseAirDays(airDays: string | null | undefined): number[] {
  if (!airDays) return [];

  const days = new Set<number>();
  for (const token of airDays.toLowerCase().split(/[,;\s]+/)) {
    const clean = token.trim();
    if (clean && clean in AIR_DAY_MAP) days.add(AIR_DAY_MAP[clean]);
  }

  return [...days].sort((a, b) => a - b);
}

/**
 * Agrupa filas en 7 cubetas, una por dia de la semana, empezando por `startWeekday`.
 * Siempre devuelve 7 entradas (los dias sin series quedan con `series: []`), asi la
 * parrilla no se deforma cuando un dia esta vacio.
 *
 * Una serie que emite varios dias aparece en cada uno de ellos: son emisiones reales,
 * no duplicados.
 */
export function groupByWeekday<T extends { airDays: string | null }>(
  rows: readonly T[],
  startWeekday: number
): Array<{ weekday: number; series: T[] }> {
  const buckets: Array<{ weekday: number; series: T[] }> = [];
  for (let offset = 0; offset < 7; offset++) {
    buckets.push({ weekday: (startWeekday + offset) % 7, series: [] });
  }

  for (const row of rows) {
    for (const day of parseAirDays(row.airDays)) {
      const bucket = buckets.find((b) => b.weekday === day);
      if (bucket) bucket.series.push(row);
    }
  }

  return buckets;
}

export type AirDayStatusType =
  | 'today'
  | 'delayed_1'
  | 'delayed_2'
  | 'delayed_3_plus';

export interface AirDayStatus {
  type: AirDayStatusType;
  /** Dias transcurridos desde la emision mas reciente (0 = hoy). */
  daysDiff: number;
}

/**
 * Semaforo de emision para una serie en curso: cuantos dias pasaron desde su ultimo dia
 * de emision. Devuelve `null` si no hay dias cargados o si el usuario ya la termino.
 *
 * Sin etiquetas: el caller traduce `type` con sus propias claves i18n.
 */
export function getAirDayStatus(
  airDays: string | null | undefined,
  isFullyWatched: boolean,
  now: Date = new Date()
): AirDayStatus | null {
  if (isFullyWatched) return null;

  const targetDays = parseAirDays(airDays);
  if (targetDays.length === 0) return null;

  const today = now.getDay(); // 0 = domingo .. 6 = sabado

  // Menor cantidad de dias transcurridos desde el dia de emision mas reciente.
  let minElapsed = 7;
  for (const day of targetDays) {
    const elapsed = (today - day + 7) % 7;
    if (elapsed < minElapsed) minElapsed = elapsed;
  }

  if (minElapsed === 0) return { type: 'today', daysDiff: 0 };
  if (minElapsed === 1) return { type: 'delayed_1', daysDiff: 1 };
  if (minElapsed === 2) return { type: 'delayed_2', daysDiff: 2 };
  return { type: 'delayed_3_plus', daysDiff: minElapsed };
}

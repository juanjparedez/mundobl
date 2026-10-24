// ============================================
// Actividad anonima agregada (SeriesActivityDaily)
// ============================================
//
// Por que existe: la mayoria mira sin cuenta, y lo unico que se contaba era
// lo que hacian las cuentas. El sitio parecia vacio aunque se usa. Esto suma
// por dia UTC, serie, tipo, origen (cuenta o navegador) y pais del edge:
// nunca usuario, IP ni cookie. Sirve para dos cosas:
//  - mostrar actividad real en el sitio ("N capitulos vistos esta semana");
//  - tener numeros por serie y canal para hablar con productoras.
//
// Respeta la decision de cada uno: el navegador no manda nada con Global
// Privacy Control, Do Not Track o el interruptor de /privacidad, y el
// servidor descarta igual lo que llegue con Sec-GPC.

export const ACTIVITY_KINDS = ['view', 'chapter', 'want', 'finish'] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivitySource = 'account' | 'browser';

export function isActivityKind(value: unknown): value is ActivityKind {
  return ACTIVITY_KINDS.some((kind) => kind === value);
}

/** Debajo de esto el contador publico no se muestra: "1 capitulo" se ve vacio. */
export const PUBLIC_ACTIVITY_MINIMUM = 5;
export const PUBLIC_ACTIVITY_WINDOW_DAYS = 7;

export const ACTIVITY_OPT_OUT_KEY = 'mundobl.activityOptOut';

/** Dia UTC como Date a medianoche, igual que WatchLinkClickDaily. */
export function utcDay(date: Date = new Date()): Date {
  return new Date(date.toISOString().slice(0, 10));
}

/** Codigo de pais del edge (Vercel), solo si tiene forma de ISO alfa-2. */
export function edgeCountry(header: string | null): string {
  return header && /^[A-Z]{2}$/.test(header) ? header : '';
}

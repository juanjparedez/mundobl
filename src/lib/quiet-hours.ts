/**
 * El horario silencioso se guarda en UTC (lo compara web-push.ts del lado
 * del servidor, que no sabe en que zona vive cada persona), pero se elige y
 * se muestra en la hora del navegador. Antes el selector pedia la hora UTC
 * directo: alguien en Argentina que ponia 23:00-08:00 silenciaba en realidad
 * de 20:00 a 05:00.
 *
 * `offsetMinutes` es el de `Date#getTimezoneOffset()`: minutos que hay que
 * SUMAR a la hora local para llegar a UTC (Argentina: 180).
 */
function shiftHHMM(value: string, deltaMinutes: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const total = Number(match[1]) * 60 + Number(match[2]) + deltaMinutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const mm = String(wrapped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function localToUtcHHMM(
  local: string,
  offsetMinutes = new Date().getTimezoneOffset()
): string {
  return shiftHHMM(local, offsetMinutes);
}

export function utcToLocalHHMM(
  utc: string,
  offsetMinutes = new Date().getTimezoneOffset()
): string {
  return shiftHHMM(utc, -offsetMinutes);
}

import type { Prisma } from '@prisma/client';

/**
 * Listas de texto guardadas como JSON (aliases, awards, funFacts,
 * contentWarnings, playbackBlockedMarkets, Announcement.pages). SQLite/D1 no
 * tiene columnas de tipo lista, asi que Prisma las devuelve como JsonValue:
 * aca se vuelven string[] y se descarta cualquier valor que no sea texto.
 */
export function toStringList(
  value: Prisma.JsonValue | null | undefined
): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

import { prisma } from '@/lib/database';
import {
  ProgressNotFoundError,
  setEpisodesWatched,
  setSeriesTrackingStatus,
} from '@/lib/tracking';
import { LOCAL_INTENTS, type LocalIntent } from '@/lib/local-progress';

export const MAX_LOCAL_IMPORT_ITEMS = 200;
const MAX_EPISODES_PER_SERIES = 500;

export interface LocalImportItem {
  seriesId: number;
  episodeIds: number[];
  intent?: LocalIntent;
}

/** Valida el cuerpo que manda LocalProgressImporter; null si no sirve. */
export function parseLocalImport(body: unknown): LocalImportItem[] | null {
  if (!body || typeof body !== 'object') return null;
  const items = (body as { items?: unknown }).items;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_LOCAL_IMPORT_ITEMS
  )
    return null;
  const parsed: LocalImportItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') return null;
    const { seriesId, episodeIds, intent } = raw as Record<string, unknown>;
    if (!Number.isSafeInteger(seriesId) || Number(seriesId) < 1) return null;
    if (
      !Array.isArray(episodeIds) ||
      episodeIds.length > MAX_EPISODES_PER_SERIES ||
      !episodeIds.every((id) => Number.isSafeInteger(id) && Number(id) > 0)
    )
      return null;
    if (intent !== undefined && !LOCAL_INTENTS.some((i) => i === intent))
      return null;
    parsed.push({
      seriesId: Number(seriesId),
      episodeIds: episodeIds as number[],
      ...(intent ? { intent: intent as LocalIntent } : {}),
    });
  }
  return parsed;
}

/**
 * Pasa a la cuenta lo que se siguio sin ella en este navegador. Nunca pisa
 * la cuenta: los capitulos se suman (union) y la intencion local solo se
 * aplica si la cuenta no tenia estado para esa serie. Cada serie va en su
 * propia transaccion: una que falla no frena a las demas.
 *
 * Devuelve las series que quedaron en la cuenta (el navegador las borra) y
 * las que fallaron (se quedan para el proximo intento).
 */
export async function importLocalProgress(
  userId: string,
  items: LocalImportItem[]
): Promise<{ imported: number[]; failed: number[] }> {
  const imported: number[] = [];
  const failed: number[] = [];
  for (const item of items) {
    try {
      await prisma.$transaction(async (tx) => {
        const series = await tx.series.findUnique({
          where: { id: item.seriesId },
          select: { id: true },
        });
        // La serie ya no existe: no hay nada que importar ni que reintentar.
        if (!series) return;
        // Se mira antes de sumar capitulos: despues ya estaria en Viendo.
        const current = await tx.viewStatus.findUnique({
          where: { userId_seriesId: { userId, seriesId: item.seriesId } },
          select: { status: true },
        });
        if (item.episodeIds.length > 0) {
          try {
            await setEpisodesWatched(
              tx,
              userId,
              item.seriesId,
              item.episodeIds,
              true
            );
          } catch (error) {
            // Episodios que ya no existen (se re-curo la serie): se ignoran.
            if (!(error instanceof ProgressNotFoundError)) throw error;
          }
        }
        if (item.intent && (!current || current.status === 'SIN_VER')) {
          await setSeriesTrackingStatus(
            tx,
            userId,
            item.seriesId,
            item.intent
          );
        }
      });
      imported.push(item.seriesId);
    } catch {
      failed.push(item.seriesId);
    }
  }
  return { imported, failed };
}

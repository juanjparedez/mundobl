/**
 * Intención de tracking guardada por un anónimo antes de loguearse (T07):
 * "voy por el episodio N" elegido en el CTA de la ficha, para aplicarse
 * solo con éxito de login, sin repetir el gesto.
 *
 * Funciones puras sobre sessionStorage — nunca puede romper el flujo de
 * login si el storage está bloqueado (modo privado estricto, etc.).
 */

export interface PendingTrack {
  seriesId: number;
  upToEpisodeId: number | null;
  /** Ficha sin episodios (corto, pelicula): al volver se marca VISTA entera. */
  markWatched?: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'mundobl.pendingTrack';
const MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingTrack(pending: PendingTrack): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // sessionStorage bloqueado: el botón igual tiene que llevar al login.
  }
}

export function readPendingTrack(): PendingTrack | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingTrack>;
    if (
      typeof parsed.seriesId !== 'number' ||
      typeof parsed.createdAt !== 'number' ||
      (parsed.upToEpisodeId !== null &&
        typeof parsed.upToEpisodeId !== 'number')
    ) {
      return null;
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) return null;

    return {
      seriesId: parsed.seriesId,
      upToEpisodeId: parsed.upToEpisodeId ?? null,
      markWatched: parsed.markWatched === true,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function clearPendingTrack(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem savePendingTrack.
  }
}

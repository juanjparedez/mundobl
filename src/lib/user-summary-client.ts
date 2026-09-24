/**
 * Cliente de GET /api/user/me/summary con cache corta en sessionStorage.
 *
 * La home es la puerta de entrada y se visita muchas veces por sesion; sin
 * cache, cada vuelta a `/` dispara una consulta que casi siempre devuelve lo
 * mismo. El TTL es corto a proposito: si el usuario marca su primer episodio
 * en otra pestaña, a los 5 minutos la home ya lo redirige.
 *
 * Igual que pending-track.ts: el storage nunca puede romper el flujo. Si
 * esta bloqueado (modo privado estricto), se pierde solo la cache.
 */

export interface UserSummary {
  viendoCount: number;
  trackedSeriesCount: number;
  onboardingCompletedAt: string | null;
}

interface CachedSummary {
  data: UserSummary;
  fetchedAt: number;
}

const STORAGE_KEY = 'mundobl.userSummary';
const TTL_MS = 5 * 60 * 1000;

function readCache(): UserSummary | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CachedSummary>;
    if (typeof parsed.fetchedAt !== 'number' || !parsed.data) return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;

    const { viendoCount, trackedSeriesCount } = parsed.data;
    if (
      typeof viendoCount !== 'number' ||
      typeof trackedSeriesCount !== 'number'
    ) {
      return null;
    }

    return {
      viendoCount,
      trackedSeriesCount,
      onboardingCompletedAt: parsed.data.onboardingCompletedAt ?? null,
    };
  } catch {
    return null;
  }
}

function writeCache(data: UserSummary): void {
  try {
    const payload: CachedSummary = { data, fetchedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Sin cache se sigue funcionando: solo se pega al endpoint de nuevo.
  }
}

/** Limpia la cache — usarlo cuando el usuario cambia su estado de tracking. */
export function clearUserSummaryCache(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // idem writeCache.
  }
}

export async function getUserSummary(): Promise<UserSummary | null> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const response = await fetch('/api/user/me/summary');
    if (!response.ok) return null;

    const data = (await response.json()) as UserSummary;
    if (typeof data.viendoCount !== 'number') return null;

    writeCache(data);
    return data;
  } catch {
    return null;
  }
}

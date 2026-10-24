/**
 * Aviso de estreno pedido por un anonimo antes de loguearse: "avisame cuando
 * salga el proximo capitulo" en una serie en emision. Se guarda aca, se va a
 * Google y al volver AiringAlertCta lo aplica una sola vez. Mismo criterio que
 * pending-track.ts: si el storage esta bloqueado, el login sigue igual.
 */

interface PendingAlert {
  seriesId: number;
  createdAt: number;
}

const STORAGE_KEY = 'mundobl.pendingAlert';
const MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingAlert(seriesId: number): void {
  try {
    const pending: PendingAlert = { seriesId, createdAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Sin storage el boton igual lleva al login; al volver se toca de nuevo.
  }
}

/** true (y lo borra) si hay un aviso pendiente y vigente para esta serie. */
export function takePendingAlert(seriesId: number): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<PendingAlert>;
    if (parsed.seriesId !== seriesId) return false;
    sessionStorage.removeItem(STORAGE_KEY);
    return (
      typeof parsed.createdAt === 'number' &&
      Date.now() - parsed.createdAt <= MAX_AGE_MS
    );
  } catch {
    return false;
  }
}

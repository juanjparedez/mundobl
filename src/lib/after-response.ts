import { after } from 'next/server';

/**
 * Corre `task` despues de responder sin perderla: en Cloudflare Workers (y en
 * serverless en general) una promesa suelta se corta cuando sale la
 * respuesta; `after` la ata al ciclo de vida del request (waitUntil).
 * Fuera de un request (scripts, pruebas que llaman al handler directo)
 * `after` tira: ahi corre en el momento, sin esperar.
 */
export function runAfterResponse(task: () => Promise<unknown>): void {
  try {
    after(task);
  } catch {
    void task();
  }
}

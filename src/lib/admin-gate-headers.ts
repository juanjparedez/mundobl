/**
 * Headers que src/proxy.ts agrega a los requests de /admin para que el
 * layout de /admin haga lo que necesita base de datos (ban por IP y log de
 * visita). El proxy no puede importar Prisma: ver el comentario en proxy.ts.
 * Los pisa el proxy en cada request, asi que el cliente no puede inyectarlos.
 */
export const ADMIN_GATE_PATH_HEADER = 'x-mundobl-admin-path';
export const ADMIN_GATE_IP_HEADER = 'x-mundobl-admin-ip';
export const ADMIN_GATE_LOG_HEADER = 'x-mundobl-admin-log';

/** Prueba de que el request lo reescribio el proxy (vale AUTH_SECRET). */
export const ADMIN_GATE_KEY_HEADER = 'x-mundobl-admin-key';

/** Ruta interna a la que el proxy reescribe los paths de scanners. */
export const SCANNER_HIT_ROUTE = '/api/internal/scanner-hit';

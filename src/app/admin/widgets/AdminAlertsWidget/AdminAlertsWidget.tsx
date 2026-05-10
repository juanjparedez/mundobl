'use client';

// Re-export del AdminAlertsWidget que vive en /perfil/dashboard/widgets/.
// El componente ya hace fetch a /api/admin/alerts y maneja loading/empty
// states. Lo importamos aca para que el WidgetRegistry de /admin no
// tenga que reachear cross-feature; mantiene una import limpia.
//
// Si en el futuro el widget de /perfil diverge funcionalmente del de
// /admin (ej. /admin necesita mas detalle), se hace un fork aqui sin
// tocar /perfil.

export { AdminAlertsWidget } from '../../../perfil/dashboard/widgets/AdminAlertsWidget/AdminAlertsWidget';

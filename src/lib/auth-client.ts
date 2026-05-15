/**
 * Helpers de autorizacion para uso en client components / server components
 * que no llaman la API directa. Server-side los endpoints validan con
 * requireRole(); estas funciones son para gatear UI (mostrar/ocultar
 * botones de editar/borrar) y evitar que un USER visitante vea acciones
 * que luego le retornaria 403.
 *
 * Centralizamos el predicado aca para no duplicar el check `role === 'ADMIN'
 * || role === 'MODERATOR'` en N componentes (regla SOLID/DRY).
 */
export type EditableRole = 'ADMIN' | 'MODERATOR';

export function canEditCatalog(
  role: string | null | undefined
): role is EditableRole {
  return role === 'ADMIN' || role === 'MODERATOR';
}

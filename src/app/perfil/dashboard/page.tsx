import { redirect } from 'next/navigation';

// /perfil/dashboard fue la ruta opt-in original cuando la vista nueva
// convivia con la clasica. Desde Fase 8.2 /perfil ES el dashboard, asi
// que esta URL queda como redirect para bookmarks viejos.
export default function PerfilDashboardLegacyRedirect(): never {
  redirect('/perfil');
}

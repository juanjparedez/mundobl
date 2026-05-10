import type { Metadata } from 'next';
import { DashboardClient } from './dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Tu actividad y estadísticas personales en MundoBL.',
  robots: { index: false, follow: false },
};

// /perfil renderea el DashboardClient con layouts fijos mock-aligned
// (ProfileAdminLayout para admin, ProfileUserLayout para user). Incluye:
//   - Todos los widgets del dashboard (Heatmap, GenresDonut, MyComments,
//     etc) y las sections del overview integradas (Achievements,
//     Collections, YearSummary, ReviewsActivity, FollowedTitles).
//   - CustomizeDrawer con switches por section que persisten en
//     localStorage (via useSectionVisibility).
// La ruta /perfil/dashboard hace redirect 301 a /perfil (ver next.config).
// El overview viejo en src/app/perfil/overview/ queda como deprecated:
// sus sections se siguen importando desde los layouts, pero la ruta y
// el ProfileOverviewClient ya no se rendean en ningun lado.
export default function PerfilPage() {
  return <DashboardClient />;
}

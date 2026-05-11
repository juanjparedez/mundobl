import type { Metadata } from 'next';
import { DashboardClient } from './dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Tu actividad y estadísticas personales en MundoBL.',
  robots: { index: false, follow: false },
};

// /perfil renderea el DashboardClient: grid configurable de widgets con
// drag/resize (modo edicion) y CustomizeDrawer (switches on/off por
// section, persistidos en localStorage via useSectionVisibility).
//
// Los widgets se definen en ./dashboard/widgets/ y se registran en
// WidgetRegistry. La ruta /perfil/dashboard hace redirect 301 a /perfil
// (ver next.config).
//
// src/app/perfil/overview/ ahora contiene SOLO las sections que widgets
// activos reusan (Achievements, Collections, YearSummary, FollowedTitles,
// ReviewsActivity, Header, ReviewsPanel, SettingsRow) + useSectionVisibility
// + CustomizeDrawer. Los orchestrators viejos (ProfileOverviewClient,
// ProfileUserLayout, ProfileAdminLayout) y las sections duplicadas
// (Cases, CommentsPanel, CountriesPanel, MyStats, Notifications,
// WatchingShelf — cada una reemplazada por su widget) se borraron en
// iter 11.
export default function PerfilPage() {
  return <DashboardClient />;
}

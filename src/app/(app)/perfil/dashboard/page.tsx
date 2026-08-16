import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard configurable — Mi Perfil',
  description:
    'Vista configurable del perfil. Reordena, agrega y quita widgets a tu gusto.',
  robots: { index: false, follow: false },
};

/** Vista configurable del perfil — grid reordenable con WidgetPicker.
 *  La vista por defecto (`/perfil`) es composicion fija alineada al
 *  style-guide. Esta queda como opt-in para usuarios power. */
export default function PerfilDashboardPage() {
  return <DashboardClient />;
}

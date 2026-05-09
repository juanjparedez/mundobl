import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Dashboard',
  description: 'Tu dashboard personal con widgets reordenables.',
  robots: { index: false, follow: false },
};

export default function PerfilDashboardPage() {
  return <DashboardClient />;
}

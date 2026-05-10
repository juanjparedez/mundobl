import type { Metadata } from 'next';
import { ProfileOverviewClient } from './overview/ProfileOverviewClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Tu actividad y estadísticas personales en MundoBL.',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return <ProfileOverviewClient />;
}

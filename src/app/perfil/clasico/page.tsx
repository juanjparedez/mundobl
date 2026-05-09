import type { Metadata } from 'next';
import { ProfileClient } from '../ProfileClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Perfil — Vista clásica',
  description: 'Vista clásica del perfil (legacy).',
  robots: { index: false, follow: false },
};

export default function PerfilClasicoPage() {
  return <ProfileClient />;
}

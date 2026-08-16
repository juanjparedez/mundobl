import type { Metadata } from 'next';
import { NotificacionesClient } from './NotificacionesClient';
import './notificaciones.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notificaciones',
  description: 'Tus notificaciones en MundoBL.',
  alternates: { canonical: '/notificaciones' },
  robots: { index: false, follow: false },
};

export default function NotificacionesPage() {
  return (
    <>
      <NotificacionesClient />
    </>
  );
}

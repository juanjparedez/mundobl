import type { Metadata } from 'next';
import { DashboardClient } from './dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description: 'Tu actividad y estadísticas personales en MundoBL.',
  robots: { index: false, follow: false },
};

// /perfil renderea el DashboardClient en pestañas (Resumen, Estadisticas,
// Logros, Actividad, Ajustes y Admin para el staff), con la pestaña en
// ?tab=. Las pestañas con grilla conservan la edicion de paneles por
// pestaña (ProfileGridTab). Los widgets se definen en ./dashboard/widgets/ y
// se registran en ./dashboard/profileWidgets.tsx. /perfil/dashboard y
// /perfil/estadisticas redirigen aca (ver next.config).
export default function PerfilPage() {
  return <DashboardClient />;
}

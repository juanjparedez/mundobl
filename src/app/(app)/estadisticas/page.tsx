import type { Metadata } from 'next';
import { PublicStatsClient } from './PublicStatsClient';

export const metadata: Metadata = {
  title: 'Estadisticas Globales',
  description:
    'Metricas anonimas y agregadas de actividad en la plataforma MundoBL.',
  alternates: { canonical: '/estadisticas' },
};

export default function EstadisticasPage() {
  return (
    <>
      <PublicStatsClient />
    </>
  );
}

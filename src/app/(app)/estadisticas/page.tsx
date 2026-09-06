export const revalidate = 300;

import type { Metadata } from 'next';
import { getPublicStats } from '@/lib/public-stats';
import { PublicStatsClient } from './PublicStatsClient';

export const metadata: Metadata = {
  title: 'Estadisticas Globales',
  description:
    'Metricas anonimas y agregadas de actividad en la plataforma MundoBL.',
  alternates: { canonical: '/estadisticas' },
};

// Antes esta pagina era un shell client-side: PublicStatsClient pedia
// /api/stats/public recien en un useEffect tras el mount, asi que el primer
// render siempre era un loader vacio en una pagina de datos 100% publicos y
// agregados (nada personalizado por usuario). Ahora el server component
// calcula las stats una sola vez (getPublicStats(), compartido con la ruta
// de API) y la pagina se sirve como HTML estatico con ISR de 5 minutos.
export default async function EstadisticasPage() {
  const initialData = await getPublicStats();

  return (
    <>
      <PublicStatsClient initialData={initialData} />
    </>
  );
}

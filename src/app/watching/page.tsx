import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { CurrentlyWatchingDashboard } from '@/components/watching/CurrentlyWatchingDashboard';
import './watching.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Viendo Ahora',
  description: 'Series BL y doramas que estás viendo actualmente.',
  robots: { index: false, follow: false },
};

export default function WatchingPage() {
  return (
    <AppLayout>
      <div className="watching-page">
        <h1 className="watching-page__title">📺 Viendo Ahora</h1>
        <CurrentlyWatchingDashboard />
      </div>
    </AppLayout>
  );
}

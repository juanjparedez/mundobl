import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CurrentlyWatchingDashboard } from '@/components/watching/CurrentlyWatchingDashboard/CurrentlyWatchingDashboard';
import './watching.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi seguimiento',
  description:
    'Tu progreso por episodio, tus notas privadas y tus series en curso.',
  robots: { index: false, follow: false },
};

export default function WatchingPage() {
  return (
    <>
      <div className="watching-page">
        <Suspense>
          <CurrentlyWatchingDashboard />
        </Suspense>
      </div>
    </>
  );
}

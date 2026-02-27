import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { CurrentlyWatchingDashboard } from '@/components/watching/CurrentlyWatchingDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Viendo Ahora',
  description: 'Series BL y doramas que estás viendo actualmente.',
  robots: { index: false, follow: false },
};

export default function WatchingPage() {
  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            marginBottom: '24px',
            color: 'var(--text-primary)',
          }}
        >
          📺 Viendo Ahora
        </h1>
        <CurrentlyWatchingDashboard />
      </div>
    </AppLayout>
  );
}

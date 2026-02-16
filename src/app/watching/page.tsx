import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { CurrentlyWatchingDashboard } from '@/components/watching/CurrentlyWatchingDashboard';

export const dynamic = 'force-dynamic';

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

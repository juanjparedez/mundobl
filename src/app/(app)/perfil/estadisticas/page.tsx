import type { Metadata } from 'next';
import { TrackingInsightsPage } from '@/components/watching/TrackingInsightsPage/TrackingInsightsPage';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function StatisticsPage() {
  return <TrackingInsightsPage />;
}

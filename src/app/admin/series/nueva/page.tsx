import { SeriesForm } from '@/components/admin/SeriesForm';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function NuevaSeriesPage() {
  return (
    <AppLayout>
      <SeriesForm mode="create" />
    </AppLayout>
  );
}

import { SeriesForm } from '@/components/admin/SeriesForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NuevaSeriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  return (
    <>
      <SeriesForm mode="create" userId={session.user.id} />
    </>
  );
}

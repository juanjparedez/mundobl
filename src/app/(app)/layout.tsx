import { getCachedSupport } from '@/lib/support-public';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const support = await getCachedSupport();
  return <AppLayout supportVisible={!!support}>{children}</AppLayout>;
}

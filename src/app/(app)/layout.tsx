import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}

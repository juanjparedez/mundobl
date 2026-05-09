import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { AdminDashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — Dashboard',
  description: 'Admin dashboard premium con KPIs y alertas activas.',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== 'ADMIN' && role !== 'MODERATOR') redirect('/');

  const [
    series,
    reviews,
    comments,
    users,
    seriesWithoutReview,
    seriesWithoutContent,
    commentsReported,
    suggestedSitesPending,
  ] = await Promise.all([
    prisma.series.count(),
    prisma.review.count({ where: { status: 'PUBLISHED' } }),
    prisma.comment.count({ where: { isPrivate: false } }),
    prisma.user.count(),
    prisma.series.count({
      where: { reviews: { none: { status: 'PUBLISHED' } } },
    }),
    prisma.series.count({ where: { embeddableContent: { none: {} } } }),
    prisma.comment.count({ where: { reportCount: { gt: 0 } } }),
    prisma.suggestedSite.count({ where: { status: 'pendiente' } }),
  ]);

  return (
    <AppLayout>
      <AdminDashboardClient
        series={series}
        reviews={reviews}
        comments={comments}
        users={users}
        seriesWithoutReview={seriesWithoutReview}
        seriesWithoutContent={seriesWithoutContent}
        commentsReported={commentsReported}
        suggestedSitesPending={suggestedSitesPending}
      />
    </AppLayout>
  );
}

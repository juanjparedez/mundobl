export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { SugerenciasClient, SuggestionItem } from './SugerenciasClient';

export default async function SugerenciasAdminPage() {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) {
    redirect('/');
  }

  const rawSuggestions = await prisma.seriesSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      series: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          nickname: true,
          image: true,
        },
      },
    },
  });

  const suggestions: SuggestionItem[] = rawSuggestions.map((s) => ({
    id: s.id,
    seriesId: s.series.id,
    seriesTitle: s.series.title,
    seriesType: s.series.type,
    userId: s.user?.id,
    userName: s.user?.name,
    userNickname: s.user?.nickname,
    userImage: s.user?.image,
    type: s.type,
    content: s.content,
    status: s.status,
    adminNotes: s.adminNotes,
    createdAt: s.createdAt.toISOString(),
  }));

  return <SugerenciasClient initialSuggestions={suggestions} />;
}

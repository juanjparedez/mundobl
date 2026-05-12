import type { Metadata } from 'next';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { prisma } from '@/lib/database';
import { UserSubmittedClient } from './UserSubmittedClient';

export const metadata: Metadata = {
  title: 'Aportes de usuarios | Admin',
  description: 'Series embebidas aportadas por usuarios. Moderar y linkear.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UserSubmittedAdminPage() {
  const items = await prisma.series.findMany({
    where: { origin: 'USER_EMBED' },
    include: {
      country: true,
      submittedBy: {
        select: { id: true, name: true, nickname: true, email: true },
      },
      seasons: {
        include: {
          episodes: {
            where: { embedUrl: { not: null } },
            select: {
              id: true,
              embedUrl: true,
              embedPlatform: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = items.map((s) => ({
    id: s.id,
    title: s.title,
    originalTitle: s.originalTitle,
    year: s.year,
    type: s.type,
    imageUrl: s.imageUrl,
    visibility: s.visibility,
    catalogScope: s.catalogScope,
    createdAt: s.createdAt.toISOString(),
    countryName: s.country?.name ?? null,
    countryCode: s.country?.code ?? null,
    submittedBy: s.submittedBy
      ? {
          id: s.submittedBy.id,
          displayName:
            s.submittedBy.nickname ??
            s.submittedBy.name ??
            s.submittedBy.email,
        }
      : null,
    embedCount: s.seasons.reduce((acc, sn) => acc + sn.episodes.length, 0),
    platforms: Array.from(
      new Set(
        s.seasons.flatMap(
          (sn) =>
            sn.episodes
              .map((e) => e.embedPlatform)
              .filter(Boolean) as string[]
        )
      )
    ),
  }));

  return (
    <AppLayout>
      <UserSubmittedClient items={rows} />
    </AppLayout>
  );
}

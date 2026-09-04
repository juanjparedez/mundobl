export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { GlosarioSuggestionsClient, type GlossarySuggestionItem } from './GlosarioSuggestionsClient';

export default async function GlosarioAdminPage() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) redirect('/');

  const rawSuggestions = await prisma.glossarySuggestion.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, nickname: true, image: true } },
    },
  });

  const suggestions: GlossarySuggestionItem[] = rawSuggestions.map((suggestion) => ({
    ...suggestion,
    createdAt: suggestion.createdAt.toISOString(),
    updatedAt: suggestion.updatedAt.toISOString(),
    user: suggestion.user,
  }));

  return <GlosarioSuggestionsClient initialSuggestions={suggestions} />;
}

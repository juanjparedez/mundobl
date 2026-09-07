export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import {
  GlosarioSuggestionsClient,
  type GlossarySuggestionItem,
} from './GlosarioSuggestionsClient';

export default async function GlosarioAdminPage() {
  const authResult = await requireRole(['ADMIN', 'MODERATOR']);
  if (!authResult.authorized) redirect('/');

  // Los tags del catalogo se traen aca (y no por fetch desde el cliente)
  // porque son pocos y se necesitan si o si para el modal de aprobacion.
  const [rawSuggestions, tags] = await Promise.all([
    prisma.glossarySuggestion.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, nickname: true, image: true } },
      },
    }),
    prisma.tag.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, category: true },
    }),
  ]);

  const suggestions: GlossarySuggestionItem[] = rawSuggestions.map(
    (suggestion) => ({
      ...suggestion,
      createdAt: suggestion.createdAt.toISOString(),
      updatedAt: suggestion.updatedAt.toISOString(),
      user: suggestion.user,
    })
  );

  return (
    <GlosarioSuggestionsClient initialSuggestions={suggestions} tags={tags} />
  );
}

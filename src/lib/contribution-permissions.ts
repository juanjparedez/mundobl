import type { Role } from '@/generated/prisma';

export function canManageContribution(
  auth: { role: Role; userId: string },
  series: { origin: string; catalogScope: string; submittedById: string | null }
) {
  if (auth.role === 'ADMIN' || auth.role === 'MODERATOR') return true;
  return (
    auth.role === 'COLLABORATOR' &&
    series.origin === 'USER_EMBED' &&
    series.catalogScope === 'WATCHABLE_ONLY' &&
    series.submittedById === auth.userId
  );
}

import { NextResponse } from 'next/server';
import { auth } from './auth';
import { prisma } from './database';
import { hasContentConsent } from './content-consent';

/** Media/detail read boundary only. Never applied to private progress or backups. */
export async function checkSeriesContentAccess(seriesId: number) {
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { visibility: true, contentRating: true, submittedById: true },
  });
  const session = await auth();
  const user = session?.user;
  const editor =
    !user?.banned && (user?.role === 'ADMIN' || user?.role === 'MODERATOR');
  const owner =
    !user?.banned &&
    user?.role === 'COLLABORATOR' &&
    user.id === series?.submittedById;
  if (!series || (series.visibility !== 'VISIBLE' && !editor && !owner)) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  if (
    !editor &&
    !owner &&
    series.contentRating === 'ADULT18' &&
    !(await hasContentConsent())
  ) {
    return NextResponse.json(
      { error: 'CONTENT_CONSENT_REQUIRED' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
  return null;
}

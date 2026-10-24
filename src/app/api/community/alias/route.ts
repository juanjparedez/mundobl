import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import {
  ALIAS_REROLL_COOLDOWN_MS,
  aliasParts,
  aliasSeedFor,
  nextAliasSeed,
} from '@/lib/community-alias';

const headers = { 'Cache-Control': 'private, no-store' };

/** POST /api/community/alias — otro alias para el ranking publico. */
export async function POST() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;
  try {
    const profile = await prisma.communityProfile.findUnique({
      where: { userId: auth.userId },
      select: { aliasSeed: true, aliasUpdatedAt: true },
    });
    const now = new Date();
    if (
      profile?.aliasUpdatedAt &&
      now.getTime() - profile.aliasUpdatedAt.getTime() <
        ALIAS_REROLL_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { code: 'ALIAS_COOLDOWN' },
        { status: 429, headers }
      );
    }
    const aliasSeed = nextAliasSeed(
      aliasSeedFor(auth.userId, profile?.aliasSeed)
    );
    await prisma.communityProfile.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId, aliasSeed, aliasUpdatedAt: now },
      update: { aliasSeed, aliasUpdatedAt: now },
    });
    return NextResponse.json({ alias: aliasParts(aliasSeed) }, { headers });
  } catch {
    return NextResponse.json(
      { code: 'ALIAS_UNAVAILABLE' },
      { status: 503, headers }
    );
  }
}

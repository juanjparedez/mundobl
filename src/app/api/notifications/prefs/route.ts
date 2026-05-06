import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

interface PrefsInput {
  pushEnabled?: boolean;
  notifySeasonAdded?: boolean;
  notifyContentAdded?: boolean;
  notifyReviewPublished?: boolean;
  notifyCommentReply?: boolean;
  quietStart?: string | null;
  quietEnd?: string | null;
}

const HHMM = /^(\d{1,2}):(\d{2})$/;

function validateTime(value: unknown): string | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return 'invalid';
  const m = HHMM.exec(value.trim());
  if (!m) return 'invalid';
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return 'invalid';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const DEFAULT_PREFS = {
  pushEnabled: true,
  notifySeasonAdded: true,
  notifyContentAdded: true,
  notifyReviewPublished: true,
  notifyCommentReply: true,
  quietStart: null as string | null,
  quietEnd: null as string | null,
};

/**
 * GET /api/notifications/prefs
 * Devuelve las preferencias del usuario, o defaults si no tiene fila.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const prefs = await prisma.notificationPrefs.findUnique({
    where: { userId: auth.userId },
  });
  return NextResponse.json(prefs ?? DEFAULT_PREFS);
}

/**
 * PATCH /api/notifications/prefs
 * Crea o actualiza las preferencias. Solo aplica los campos enviados.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const body = (await request.json().catch(() => null)) as PrefsInput | null;
  if (!body) {
    return NextResponse.json({ error: 'body invalido' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.pushEnabled === 'boolean')
    data.pushEnabled = body.pushEnabled;
  if (typeof body.notifySeasonAdded === 'boolean')
    data.notifySeasonAdded = body.notifySeasonAdded;
  if (typeof body.notifyContentAdded === 'boolean')
    data.notifyContentAdded = body.notifyContentAdded;
  if (typeof body.notifyReviewPublished === 'boolean')
    data.notifyReviewPublished = body.notifyReviewPublished;
  if (typeof body.notifyCommentReply === 'boolean')
    data.notifyCommentReply = body.notifyCommentReply;

  if ('quietStart' in body) {
    const v = validateTime(body.quietStart);
    if (v === 'invalid') {
      return NextResponse.json(
        { error: 'quietStart invalido (HH:MM)' },
        { status: 400 }
      );
    }
    data.quietStart = v;
  }
  if ('quietEnd' in body) {
    const v = validateTime(body.quietEnd);
    if (v === 'invalid') {
      return NextResponse.json(
        { error: 'quietEnd invalido (HH:MM)' },
        { status: 400 }
      );
    }
    data.quietEnd = v;
  }

  const prefs = await prisma.notificationPrefs.upsert({
    where: { userId: auth.userId },
    create: { userId: auth.userId, ...data },
    update: data,
  });
  return NextResponse.json(prefs);
}

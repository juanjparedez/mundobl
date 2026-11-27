import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { findInChunks } from '@/lib/d1-lists';
import { auth } from '@/lib/auth';

// GET /api/episodes/notes-summary?ids=1,2,3
// Devuelve los IDs (de la lista solicitada) en los que el usuario actual
// tiene una nota. No autentica como required: si no hay sesion, devuelve [].
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ episodeIds: [] });
    }

    const idsParam = request.nextUrl.searchParams.get('ids') ?? '';
    const ids = idsParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (ids.length === 0) {
      return NextResponse.json({ episodeIds: [] });
    }

    const userId = session.user.id;
    const notes = await findInChunks(ids, (chunk) =>
      prisma.episodeNote.findMany({
        where: { userId, episodeId: { in: chunk } },
        select: { episodeId: true },
      })
    );

    return NextResponse.json({ episodeIds: notes.map((n) => n.episodeId) });
  } catch (error) {
    console.error('Error fetching notes summary:', error);
    return NextResponse.json({ episodeIds: [] });
  }
}

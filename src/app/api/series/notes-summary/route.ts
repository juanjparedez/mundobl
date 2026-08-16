import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { auth } from '@/lib/auth';

// GET /api/series/notes-summary?ids=1,2,3
// Devuelve los IDs (de la lista solicitada) en los que el usuario actual
// tiene una nota. No autentica como required: si no hay sesion, devuelve [].
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ seriesIds: [] });
    }

    const idsParam = request.nextUrl.searchParams.get('ids') ?? '';
    const ids = idsParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (ids.length === 0) {
      return NextResponse.json({ seriesIds: [] });
    }

    const notes = await prisma.seriesNote.findMany({
      where: { userId: session.user.id, seriesId: { in: ids } },
      select: { seriesId: true },
    });

    return NextResponse.json({ seriesIds: notes.map((n) => n.seriesId) });
  } catch (error) {
    console.error('Error fetching series notes summary:', error);
    return NextResponse.json({ seriesIds: [] });
  }
}

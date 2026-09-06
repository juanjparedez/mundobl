import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * Series marcadas como VISTA por el usuario actual, para el badge "Visto"
 * de /catalogo. Bulk (no una por serie): antes este dato lo traia el propio
 * Server Component via `getAllSeries({ userId })`, pero eso obligaba a
 * `await auth()` en la pagina y tiraba abajo el `revalidate`/ISR (la pagina
 * entera se volvia dinamica). Mismo patron que /api/favorites: se pide una
 * vez del lado del cliente y se cruza con la data estatica ya cacheada.
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const rows = await prisma.viewStatus.findMany({
      where: {
        userId: authResult.userId,
        status: 'VISTA',
        seriesId: { not: null },
      },
      select: { seriesId: true },
    });

    const seriesIds = rows
      .map((r) => r.seriesId)
      .filter((id): id is number => id !== null);

    return NextResponse.json(seriesIds);
  } catch (error) {
    console.error('Error fetching view status:', error);
    return NextResponse.json(
      { error: 'Error al obtener el estado de vista' },
      { status: 500 }
    );
  }
}

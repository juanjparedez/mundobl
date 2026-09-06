import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';

/**
 * Notas privadas de curaduria (`review`/`observations` con
 * `notesPrivate = true`) de una serie puntual. Solo ADMIN.
 *
 * /series/[id] ahora renderiza SIEMPRE con `stripPrivateNotes(serie, false)`
 * — el HTML estatico/cacheado por ISR nunca contiene estas notas, ni para
 * admins (ver src/lib/privacy.ts). Este endpoint es como el admin las
 * recupera: SeriesInfo lo pide client-side solo cuando `notesPrivate` es
 * true y la sesion (via useSession()) dice ADMIN.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const serie = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { review: true, observations: true },
    });

    if (!serie) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(serie);
  } catch (error) {
    console.error('Error fetching private notes:', error);
    return NextResponse.json(
      { error: 'Error al obtener las notas privadas' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database';
import { requireRole } from '@/lib/auth-helpers';
import { logAction } from '@/lib/access-log';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/ver/[id]/remove
 *
 * Saca una serie de /ver SIN borrarla.
 *
 * Existe porque hasta ahora la unica accion disponible sobre una serie de
 * /ver era `DELETE /api/series/[id]`, que borra la serie entera con
 * cascade. Sobre una serie CURATED eso destruye la ficha curada (reseña,
 * rating, universo, cast) solo para sacar de /ver un embed que no servia
 * — que es exactamente el caso de "Long time no see", cuyo unico
 * episodio era un trailer de 69 segundos.
 *
 * Lo que hace: vacia los campos `embed*` de los episodios. /ver filtra
 * por `embedUrl != null`, asi que la serie desaparece de ahi al instante,
 * mientras que la ficha, las temporadas, los episodios y todo lo que los
 * usuarios colgaron de ellos (vistos, notas, comentarios) quedan intactos.
 *
 * Deliberadamente NO borra los `Episode`: un episodio sin embed sigue
 * siendo informacion valida del catalogo ("la serie tiene 12 capitulos"),
 * y borrarlo se llevaria puesto el progreso de los usuarios.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireRole(['ADMIN', 'MODERATOR']);
  if (!auth.authorized) return auth.response;

  const { id } = await context.params;
  const seriesId = Number.parseInt(id, 10);
  if (Number.isNaN(seriesId)) {
    return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
  }

  const serie = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { id: true, title: true, origin: true },
  });
  if (!serie) {
    return NextResponse.json(
      { error: 'Serie no encontrada.' },
      { status: 404 }
    );
  }

  const result = await prisma.episode.updateMany({
    where: { season: { seriesId }, embedUrl: { not: null } },
    data: {
      embedUrl: null,
      embedPlatform: null,
      embedVideoId: null,
      embedChannelName: null,
      embedChannelUrl: null,
      // El sondeo guardado deja de tener sentido sin embed que sondear.
      playback: 'UNKNOWN',
      playbackBlockedMarkets: [],
      playbackCheckedAt: null,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: 'La serie no tiene episodios con embed: ya no esta en /ver.' },
      { status: 409 }
    );
  }

  logAction(
    'UPDATE',
    request.nextUrl.pathname,
    'POST',
    auth.userId,
    `ver.remove: ${result.count} embeds de "${serie.title}" (#${seriesId}, ${serie.origin}); ficha conservada`
  );

  revalidatePath('/ver');
  revalidatePath('/admin/ver');
  revalidatePath(`/ver/${seriesId}`);
  revalidatePath('/');

  return NextResponse.json({
    message: `"${serie.title}" salio de /ver. Se vaciaron ${result.count} embed(s); la ficha quedo intacta.`,
    removedEmbeds: result.count,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { sweepChannel, titleKey } from '@/lib/channel-sweep';
import { prisma } from '@/lib/database';

/**
 * Barre un canal oficial de YouTube y devuelve sus playlists
 * clasificadas (ver src/lib/channel-sweep.ts). Solo lee: no persiste
 * nada. El admin elige cuales importar y cada una pasa por el importer
 * de siempre (POST /api/series/import-playlist).
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'COLLABORATOR']);
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL del canal requerida' },
        { status: 400 }
      );
    }

    // Dos indices SEPARADOS, porque /catalogo y /ver son dos catalogos
    // distintos y estar en uno no implica estar en el otro.
    //
    // Solo descarta la primera: una serie ya mirable en /ver. Las del
    // catalogo curado sin embeds son las MEJORES candidatas — Flor ya las
    // reseño y todavia no se pueden ver — asi que se anotan para linkear,
    // nunca para ocultar. (Cruzarlas contra un unico indice escondia 28
    // de 32 coincidencias en GMMTV, todas series completas de 54-64
    // videos que era justo lo que habia que importar.)
    const watchable = await prisma.series.findMany({
      where: {
        seasons: { some: { episodes: { some: { embedUrl: { not: null } } } } },
      },
      select: { title: true },
    });
    const watchableTitles = new Map(
      watchable.map((s) => [titleKey(s.title), s.title] as const)
    );

    const curated = await prisma.series.findMany({
      where: { origin: 'CURATED' },
      select: { title: true },
    });
    const catalogTitles = new Map(
      curated.map((s) => [titleKey(s.title), s.title] as const)
    );

    const result = await sweepChannel(url, watchableTitles, catalogTitles);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al barrer el canal';
    // La key vencida/ausente es el modo de falla mas comun de este
    // endpoint: merece un 503 y no un 500 generico.
    const status =
      message.includes('no configurad') ||
      message.includes('API key') ||
      message.includes('expired')
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

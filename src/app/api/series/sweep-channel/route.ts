import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { normalizeTitle, sweepChannel } from '@/lib/channel-sweep';
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

    // Para marcar "ya importada". El importer no guarda el playlistId de
    // origen, asi que no hay forma de cruzar por id: se compara el
    // titulo normalizado contra las series que ya estan. Es una ayuda
    // visual, no un candado — el importer ya deduplica por videoId.
    //
    // Se miran TODAS las series (no solo las de /ver) a proposito: si el
    // titulo ya existe en el catalogo curado, el admin querra linkearla
    // en vez de crear un duplicado. Esto solo lee titulos, no mezcla los
    // dos catalogos ni cambia que se muestra en ningun lado.
    const existing = await prisma.series.findMany({ select: { title: true } });
    const importedTitles = new Set(
      existing.map((s) => normalizeTitle(s.title))
    );

    const result = await sweepChannel(url, importedTitles);

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

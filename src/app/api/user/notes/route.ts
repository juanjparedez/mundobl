import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { getSeriesUrl } from '@/lib/slug';

export interface DiaryNote {
  key: string;
  kind: 'series' | 'episode';
  body: string;
  createdAt: string;
  updatedAt: string;
  seriesTitle: string;
  /** "T1E4" para notas de episodio; null para notas de serie. */
  episodeLabel: string | null;
  href: string;
}

/**
 * GET /api/user/notes — el diario privado del usuario: sus notas de serie y
 * de episodio en una sola linea de tiempo.
 *
 * Las dos tablas se mezclan en memoria en vez de en SQL: son notas de UN
 * usuario (decenas, no millones) y un UNION con orden y paginado sobre dos
 * shapes distintas complicaria la query sin ganar nada a esta escala. Si
 * algun dia un usuario junta miles de notas, esto pasa a una vista SQL.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('q')?.trim().toLowerCase() ?? '';
    const kind = searchParams.get('kind');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1),
      100
    );

    const wantsSeries = kind !== 'episode';
    const wantsEpisodes = kind !== 'series';

    const [seriesNotes, episodeNotes] = await Promise.all([
      wantsSeries
        ? prisma.seriesNote.findMany({
            where: { userId: authResult.userId },
            select: {
              id: true,
              body: true,
              createdAt: true,
              updatedAt: true,
              series: { select: { id: true, title: true } },
            },
          })
        : Promise.resolve([]),
      wantsEpisodes
        ? prisma.episodeNote.findMany({
            where: { userId: authResult.userId },
            select: {
              id: true,
              body: true,
              createdAt: true,
              updatedAt: true,
              episode: {
                select: {
                  id: true,
                  episodeNumber: true,
                  season: {
                    select: {
                      seasonNumber: true,
                      series: { select: { id: true, title: true } },
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const notes: DiaryNote[] = [
      ...seriesNotes.map((note) => ({
        key: `s:${note.id}`,
        kind: 'series' as const,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        seriesTitle: note.series.title,
        episodeLabel: null,
        href: getSeriesUrl(note.series.id, note.series.title),
      })),
      ...episodeNotes.map((note) => {
        const series = note.episode.season?.series ?? null;
        return {
          key: `e:${note.id}`,
          kind: 'episode' as const,
          body: note.body,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
          seriesTitle: series?.title ?? '',
          episodeLabel: `T${note.episode.season?.seasonNumber ?? 1}E${note.episode.episodeNumber}`,
          href: series ? getSeriesUrl(series.id, series.title) : '#',
        };
      }),
    ];

    const filtered = search
      ? notes.filter(
          (note) =>
            note.body.toLowerCase().includes(search) ||
            note.seriesTitle.toLowerCase().includes(search)
        )
      : notes;

    // Cronologico por ultima edicion: el diario se lee por lo mas reciente.
    filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const start = (page - 1) * pageSize;

    return NextResponse.json({
      notes: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[user/notes GET]', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar tus notas.' },
      { status: 500 }
    );
  }
}

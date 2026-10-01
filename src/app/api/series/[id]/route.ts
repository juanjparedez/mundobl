import { NextRequest, NextResponse } from 'next/server';
import { revalidateSeries } from '@/lib/revalidate-series';
import { prisma } from '@/lib/database';
import { auth } from '@/lib/auth';
import { requireRole } from '@/lib/auth-helpers';
import { downloadAndUploadExternalImage } from '@/lib/supabase';
import { notifySeriesSubscribers } from '@/lib/notifications';
import {
  EDIT_CONFLICT_CODE,
  SeriesEditConflictError,
  parseExpectedEditVersion,
  saveSeriesFromForm,
  type ResolvedSeriesImage,
  type SeriesFormBody,
} from '@/lib/series-save';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener una serie por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const serie = await prisma.series.findUnique({
      where: { id: serieId },
      include: {
        country: true,
        universe: true,
        seasons: true,
        actors: {
          include: {
            actor: true,
          },
        },
        directors: {
          include: {
            director: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        productionCompany: true,
        originalLanguage: true,
        dubbings: {
          include: {
            language: true,
          },
        },
        genres: {
          include: {
            genre: true,
          },
        },
        watchLinks: true,
        relatedSeriesFrom: {
          include: {
            relatedSeries: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                year: true,
                type: true,
              },
            },
          },
        },
        relatedSeriesTo: {
          include: {
            mainSeries: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                year: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!serie) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    // USER_EMBED: solo accesible para admin/moderator o el submitter.
    // Los users normales reciben 404 (mismo comportamiento que si no existiera).
    if (serie.origin === 'USER_EMBED') {
      const session = await auth();
      const role = session?.user?.role;
      const isPrivileged = role === 'ADMIN' || role === 'MODERATOR';
      const isSubmitter =
        session?.user?.id != null && session.user.id === serie.submittedById;
      if (!isPrivileged && !isSubmitter) {
        return NextResponse.json(
          { error: 'Serie no encontrada' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(serie);
  } catch (error) {
    console.error('Error al obtener serie:', error);
    return NextResponse.json(
      { error: 'Error al obtener la serie' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una serie (Admin + Moderator)
//
// Un solo guardado atomico, con foto previa y control de version: ver
// saveSeriesFromForm. Antes cada relacion se borraba y recreaba fila por fila
// fuera de transaccion (~50 viajes a la base y una ficha a medias si se
// cortaba), y una pestaña vieja pisaba sin aviso lo guardado despues.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN', 'MODERATOR']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = (await request.json()) as SeriesFormBody;

    // Validación básica
    if (!body.title) {
      return NextResponse.json(
        { error: 'El título es requerido' },
        { status: 400 }
      );
    }
    if (body.universeId) {
      const universeId = Number(body.universeId);
      if (!Number.isInteger(universeId) || universeId < 1) {
        return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
      }
    }
    if (
      body.basedOn !== undefined &&
      body.basedOn !== null &&
      typeof body.basedOn !== 'string'
    )
      return NextResponse.json({ error: 'Invalid basedOn' }, { status: 400 });
    // Sin version no hay forma de saber si la pestaña esta vieja: antes de
    // subir imagenes o crear nada, se corta aca.
    if (parseExpectedEditVersion(body.editVersion) === null) {
      return editConflictResponse();
    }

    const outcome = await saveSeriesFromForm(
      serieId,
      body,
      await resolveImage(body),
      authResult.userId
    );

    if (!outcome) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    // Avisos fuera de la transaccion: si fallan, el guardado ya quedo.
    for (const season of outcome.newSeasons) {
      await notifySeriesSubscribers({
        seriesId: serieId,
        type: 'season_added',
        title: `Nueva temporada en ${outcome.updated.title}`,
        body: `Se agrego la temporada ${season.seasonNumber}`,
        refType: 'season',
        refId: season.id,
        // Quien agrego la temporada no necesita que le avisen.
        excludeUserId: authResult.userId,
      });
    }

    revalidateSeries(outcome.updated);

    return NextResponse.json(outcome.updated);
  } catch (error) {
    if (error instanceof SeriesEditConflictError) return editConflictResponse();
    console.error('Error al actualizar serie:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la serie' },
      { status: 500 }
    );
  }
}

function editConflictResponse() {
  return NextResponse.json(
    {
      error:
        'La ficha cambió desde que la abriste. Recargá la página para no pisar esos cambios.',
      code: EDIT_CONFLICT_CODE,
    },
    { status: 409 }
  );
}

/**
 * Procesar imagen externa → subirla si es URL externa.
 *
 * `thumbUrl` en `undefined` = "no toques imageThumbUrl": si el admin no cambio
 * el poster (imageUrl llega igual a la que ya tenia, o vacio), no queremos
 * pisar la miniatura ya generada en cada guardado de un campo cualquiera.
 * Solo dos casos lo cambian: (a) el form subio un archivo nuevo via
 * /api/upload y mando body.imageThumbUrl, o (b) downloadAndUploadExternalImage
 * migro una URL externa nueva y genero un thumb real. Si se saca el poster
 * (imageUrl vacio), el thumb se saca con el — si no, una card seguiria
 * mostrando la miniatura vieja de un poster que ya no existe.
 */
async function resolveImage(body: {
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
}): Promise<ResolvedSeriesImage> {
  const url = body.imageUrl || null;
  const thumbUrl =
    typeof body.imageThumbUrl === 'string' && body.imageThumbUrl.trim()
      ? body.imageThumbUrl.trim()
      : undefined;
  if (!url) return { url: null, thumbUrl: null };
  try {
    const migrated = await downloadAndUploadExternalImage(url, 'series');
    return { url: migrated.url, thumbUrl: migrated.thumbUrl ?? thumbUrl };
  } catch (error) {
    console.warn(
      `No se pudo migrar imagen a Supabase, manteniendo URL original:`,
      error
    );
    return { url, thumbUrl };
  }
}

// DELETE - Eliminar una serie (Solo Admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const serieId = parseInt(id, 10);

    if (isNaN(serieId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que la serie existe
    const serie = await prisma.series.findUnique({
      where: { id: serieId },
    });

    if (!serie) {
      return NextResponse.json(
        { error: 'Serie no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la serie (cascade eliminará relaciones)
    await prisma.series.delete({
      where: { id: serieId },
    });

    // Propagar el borrado a las páginas públicas cacheadas (el router.refresh()
    // del cliente solo arregla la vista admin actual).
    revalidateSeries(serie);

    return NextResponse.json({ message: 'Serie eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar serie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la serie' },
      { status: 500 }
    );
  }
}

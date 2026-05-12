import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { buildEmbedPreview, EmbedPreviewError } from '@/lib/user-embed-preview';

/**
 * POST /api/user/series/embed/preview
 *
 * Body: { url: string }
 * Devuelve EmbedPreview. NO persiste.
 *
 * - Requiere user logueado.
 * - 400 si la URL no parsea.
 * - 422 si la plataforma no esta soportada.
 * - 409 si la URL ya esta en uso por otro Episode (devuelve existingSeriesId).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'JSON invalido en el body.' },
      { status: 400 }
    );
  }

  const url = (body?.url ?? '').trim();
  if (!url) {
    return NextResponse.json({ error: 'URL requerida.' }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      {
        error: 'URL invalida — debe ser una direccion completa con http(s)://',
      },
      { status: 400 }
    );
  }

  // Dedupe global por embedUrl: si ya existe, redirigir al detalle.
  const existing = await prisma.episode.findFirst({
    where: { embedUrl: url },
    select: { season: { select: { seriesId: true } } },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: 'Esta URL ya fue agregada por alguien mas.',
        existingSeriesId: existing.season.seriesId,
      },
      { status: 409 }
    );
  }

  try {
    const preview = await buildEmbedPreview(url);
    return NextResponse.json(preview);
  } catch (err) {
    if (err instanceof EmbedPreviewError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Error en /embed/preview:', err);
    return NextResponse.json(
      { error: 'No se pudo cargar la preview de esta URL.' },
      { status: 500 }
    );
  }
}

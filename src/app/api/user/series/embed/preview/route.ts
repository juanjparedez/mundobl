import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/database';
import { buildEmbedPreview, EmbedPreviewError } from '@/lib/user-embed-preview';
import { validateStreamingUrl } from '@/lib/embed-helpers';

/**
 * POST /api/user/series/embed/preview
 *
 * Body: { url: string }
 * Devuelve EmbedPreview. NO persiste.
 *
 * - Requiere user logueado.
 * - 422 si la URL no es valida o la plataforma no esta soportada.
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
  const validation = validateStreamingUrl(url);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error ?? 'URL invalida o plataforma no soportada.' },
      { status: 422 }
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

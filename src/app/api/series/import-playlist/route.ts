import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { buildImportPreview } from '@/lib/playlist-importer';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN', 'COLLABORATOR']);
    if (!authResult.authorized) return authResult.response;
    const isCollaborator = authResult.role === 'COLLABORATOR';

    const body = await request.json();
    const { url, autoTranslate, catalogScope, maxPages } = body as {
      url?: string;
      autoTranslate?: boolean;
      catalogScope?: 'WATCHABLE_ONLY' | 'PERSONAL';
      maxPages?: number;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL de playlist requerida' },
        { status: 400 }
      );
    }

    const preview = await buildImportPreview({
      url,
      autoTranslate: autoTranslate === true,
      // Un COLLABORATOR nunca puede sumar al catalogo curado (PERSONAL) —
      // su contenido siempre es WATCHABLE_ONLY, sin importar lo que mande.
      catalogScope:
        !isCollaborator && catalogScope === 'PERSONAL'
          ? 'PERSONAL'
          : 'WATCHABLE_ONLY',
      maxPages: typeof maxPages === 'number' ? maxPages : 10,
      checkAgeRestriction: isCollaborator,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al construir preview';
    const status = message.includes('no configurad') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

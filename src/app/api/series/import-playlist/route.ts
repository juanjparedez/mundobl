import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { buildImportPreview } from '@/lib/playlist-importer';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.authorized) return authResult.response;

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
      catalogScope: catalogScope === 'PERSONAL' ? 'PERSONAL' : 'WATCHABLE_ONLY',
      maxPages: typeof maxPages === 'number' ? maxPages : 10,
    });

    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al construir preview';
    const status = message.includes('no configurad') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

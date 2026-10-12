import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth-helpers';
import { saveEditorialClassification } from '@/lib/editorial-classification';
import { SeriesEditConflictError } from '@/lib/series-save';
import { revalidateSeries } from '@/lib/revalidate-series';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1)
    return new NextResponse(null, { status: 400 });
  try {
    const raw = await request.text();
    if (raw.length > 3000) return new NextResponse(null, { status: 413 });
    const result = await saveEditorialClassification(
      id,
      auth.userId,
      JSON.parse(raw)
    );
    revalidateSeries(result);
    // Rare editorial mutation: invalidate cached previews as well as the detail.
    revalidatePath('/', 'layout');
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    const status =
      error instanceof SeriesEditConflictError
        ? 409
        : error instanceof Error && error.message === 'FORBIDDEN'
          ? 403
          : error instanceof Error && error.message === 'NOT_FOUND'
            ? 404
            : error instanceof SyntaxError ||
                (error instanceof Error &&
                  error.message === 'INVALID_CLASSIFICATION')
              ? 400
              : 500;
    return NextResponse.json(
      { error: status === 409 ? 'EDIT_CONFLICT' : 'ERROR' },
      { status }
    );
  }
}

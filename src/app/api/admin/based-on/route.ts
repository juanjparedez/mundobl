import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth-helpers';
import { changeBasedOnValue, getBasedOnDirectory } from '@/lib/database';
import { normalizeBasedOn } from '@/lib/based-on';

export async function GET() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  return NextResponse.json(await getBasedOnDirectory());
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  const { source, target, action, expectedIds } = body as Record<
    string,
    unknown
  >;
  if (
    typeof source !== 'string' ||
    !['rename', 'merge', 'remove'].includes(String(action)) ||
    !Array.isArray(expectedIds) ||
    !expectedIds.length ||
    expectedIds.some((id) => !Number.isSafeInteger(id) || id < 1) ||
    new Set(expectedIds).size !== expectedIds.length
  ) {
    return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  }
  const destination =
    action === 'remove'
      ? null
      : typeof target === 'string'
        ? action === 'merge'
          ? target
          : normalizeBasedOn(target)
        : '';
  if (
    destination === '' ||
    (destination?.length ?? 0) > 200 ||
    source === destination
  )
    return NextResponse.json({ error: 'INVALID' }, { status: 400 });
  try {
    const count = await changeBasedOnValue(
      source,
      destination,
      action as 'rename' | 'merge' | 'remove',
      expectedIds
    );
    revalidatePath('/catalogo');
    // Unico wildcard que queda: esta operacion reescribe el campo `basedOn` de
    // una cantidad arbitraria de series y changeBasedOnValue solo devuelve el
    // conteo, no los ids. Invalida las ~650 fichas de golpe, pero es una accion
    // manual y poco frecuente del admin, no algo que corra en cada request.
    revalidatePath('/series/[id]', 'page');
    revalidatePath('/admin/tags');
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Based-on operation failed', error);
    return NextResponse.json({ error: 'CONFLICT' }, { status: 409 });
  }
}

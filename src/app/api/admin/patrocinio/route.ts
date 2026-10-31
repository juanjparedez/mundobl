import { isSameOriginRequest } from '@/lib/request-origin';
import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth-helpers';
import { getSupportAdmin, mutateSupport } from '@/lib/database';
import { parseSupportMutation, SupportError } from '@/lib/support-input';
import { SUPPORT_TAG } from '@/lib/support-public';
const headers = { 'Cache-Control': 'private, no-store' };
function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof SupportError ? error.code : 'error' },
    { status: error instanceof SupportError ? error.status : 500, headers }
  );
}
export async function GET() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  try {
    return NextResponse.json(await getSupportAdmin(auth.userId), { headers });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: 'error' }, { status: 403, headers });
  try {
    const raw = await request.text();
    if (raw.length > 20000) throw new SupportError(400, 'error');
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new SupportError(400, 'error');
    }
    const input = parseSupportMutation(body);
    const result = await mutateSupport(auth.userId, input);
    if (input.action !== 'save') {
      revalidateTag(SUPPORT_TAG, { expire: 0 });
      revalidatePath('/', 'layout');
    }
    return NextResponse.json(result, { headers });
  } catch (error) {
    return failure(error);
  }
}

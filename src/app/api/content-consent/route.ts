import { NextRequest, NextResponse } from 'next/server';
import {
  CONTENT_COOKIE,
  CONTENT_COOKIE_AGE,
  signContentConsent,
} from '@/lib/content-consent';

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin)
    return new NextResponse(null, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== 'object' ||
    !('allow' in body) ||
    typeof body.allow !== 'boolean'
  ) {
    return new NextResponse(null, { status: 400 });
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) return new NextResponse(null, { status: 503 });
  const response = NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
  response.cookies.set(
    CONTENT_COOKIE,
    body.allow
      ? signContentConsent(Date.now() + CONTENT_COOKIE_AGE * 1000, secret)
      : '',
    {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: body.allow ? CONTENT_COOKIE_AGE : 0,
    }
  );
  return response;
}

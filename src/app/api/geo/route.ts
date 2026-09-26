import { NextRequest, NextResponse } from 'next/server';

// GET /api/geo — el pais del visitante segun Vercel/Cloudflare (desde la
// IP). No se guarda en ningun lado, como dice /privacidad: el cliente lo
// cachea en sessionStorage (useViewerCountry).
export function GET(request: NextRequest) {
  const raw =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry');
  // Cloudflare usa XX para "desconocido" y T1 para Tor.
  const country = raw && /^[A-Z]{2}$/.test(raw) && raw !== 'XX' ? raw : null;
  return NextResponse.json(
    { country },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

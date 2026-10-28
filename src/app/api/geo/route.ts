import { NextRequest, NextResponse } from 'next/server';
import { viewerCountryFromHeaders } from '@/lib/viewer-country';

// GET /api/geo — el pais del visitante. El cliente lo cachea en
// sessionStorage (useViewerCountry).
export function GET(request: NextRequest) {
  return NextResponse.json(
    { country: viewerCountryFromHeaders(request.headers) },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

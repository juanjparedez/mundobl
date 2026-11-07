import { NextResponse } from 'next/server';
import { getBuildInfo } from '@/lib/build-info';

export async function GET() {
  return NextResponse.json(getBuildInfo(), {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

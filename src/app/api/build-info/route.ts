import { NextResponse } from 'next/server';

// Generated once when the server starts (or when this module is first imported).
// Changes on every deployment/restart.
const BUILD_ID = Date.now().toString(36);

export async function GET() {
  return NextResponse.json({ buildId: BUILD_ID });
}

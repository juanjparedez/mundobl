import { NextResponse } from 'next/server';
import { loadLocaleMessages } from '@/i18n/messages';

export async function trackingPreservationResponse() {
  return NextResponse.json(
    {
      error: (await loadLocaleMessages('es')).editorial.preserveTracking,
      code: 'TRACKING_PRESERVATION_REQUIRED',
    },
    { status: 409 }
  );
}

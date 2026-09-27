import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { runRuntimeJob, RuntimeJobBusyError } from '@/lib/runtime-jobs';
import { revalidateSeriesListings } from '@/lib/revalidate-series';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const job =
    body && typeof body === 'object' && 'job' in body ? body.job : null;
  if (job !== 'daily' && job !== 'news' && job !== 'playability')
    return NextResponse.json({ error: 'Invalid job' }, { status: 400 });
  try {
    const result = await runRuntimeJob(job, 'manual');
    if (result.completed.includes('playability')) revalidateSeriesListings();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    if (error instanceof RuntimeJobBusyError)
      return NextResponse.json({ error: 'busy' }, { status: 409 });
    console.error('[runtime/run]', error);
    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}

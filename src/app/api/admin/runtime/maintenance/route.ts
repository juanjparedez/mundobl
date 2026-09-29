import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { isR2Configured } from '@/lib/r2';
import { runLogRetentionJob } from '@/lib/access-log';
import { recordMaintenanceAction } from '@/lib/database';
import {
  deleteOldDeployment,
  inspectDeployments,
  isVercelMaintenanceConfigured,
  MaintenanceError,
} from '@/lib/vercel-maintenance';

export const runtime = 'nodejs';
export const maxDuration = 120;
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  const rawUntil = new URL(request.url).searchParams.get('until');
  const until = rawUntil === null ? undefined : Number(rawUntil);
  if (until !== undefined && (!Number.isSafeInteger(until) || until <= 0))
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400, headers }
    );
  const configured = isVercelMaintenanceConfigured();
  try {
    const report = configured
      ? await inspectDeployments(until)
      : { candidates: [], scanned: 0, next: null, hasMore: false };
    return NextResponse.json(
      { ...report, configured, r2Configured: isR2Configured() },
      { headers }
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return NextResponse.json(
      { error: 'invalid_origin' },
      { status: 403, headers }
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400, headers }
    );
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('action' in body) ||
    (body.action !== 'deleteDeployment' && body.action !== 'purgeLogs')
  )
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400, headers }
    );
  const action = body.action;
  const deploymentId =
    action === 'deleteDeployment' &&
    'deploymentId' in body &&
    typeof body.deploymentId === 'string'
      ? body.deploymentId
      : undefined;
  if (
    action === 'deleteDeployment' &&
    (typeof deploymentId !== 'string' ||
      !/^dpl_[a-zA-Z0-9]+$/.test(deploymentId))
  )
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400, headers }
    );
  try {
    // If the audit cannot be persisted, do not perform a destructive action.
    const audit = await recordMaintenanceAction(
      auth.userId,
      action,
      deploymentId
    );
    try {
      const result =
        action === 'purgeLogs'
          ? await runLogRetentionJob(Date.now() + 10_000, 'manual')
          : await deleteOldDeployment(deploymentId as string);
      await recordMaintenanceAction(
        auth.userId,
        action,
        deploymentId,
        audit,
        'completed'
      );
      return NextResponse.json({ ok: true, result }, { headers });
    } catch (error) {
      await recordMaintenanceAction(
        auth.userId,
        action,
        deploymentId,
        audit,
        'failed'
      ).catch(() => {});
      throw error;
    }
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof MaintenanceError ? error.code : 'maintenance_failed',
    },
    { status: error instanceof MaintenanceError ? error.status : 500, headers }
  );
}

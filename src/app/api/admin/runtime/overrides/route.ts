import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import {
  getRuntimeFreezeState,
  setRuntimeFreezeOverrides,
  type RuntimeFreezeOverridesInput,
} from '@/lib/runtime-freeze';

export const runtime = 'nodejs';

type RuntimeOverrideBody = {
  forceFreeze?: boolean;
  forceFreezeMinutes?: number;
  disableAI?: boolean;
  disableAIMinutes?: number;
  disableLogging?: boolean;
  disableLoggingMinutes?: number;
  disableAnonLogging?: boolean;
  disableAnonLoggingMinutes?: number;
};

function toSafeMinutes(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(1, Math.min(240, Math.floor(value)));
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireRole(['ADMIN']);
  if (!authResult.authorized) return authResult.response;

  let body: RuntimeOverrideBody;
  try {
    body = (await request.json()) as RuntimeOverrideBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const updates: RuntimeFreezeOverridesInput = {};

  if (typeof body.forceFreeze === 'boolean') {
    updates.forceFreeze = {
      enabled: body.forceFreeze,
      minutes: toSafeMinutes(body.forceFreezeMinutes, 30),
    };
  }

  if (typeof body.disableAI === 'boolean') {
    updates.disableAI = {
      enabled: body.disableAI,
      minutes: toSafeMinutes(body.disableAIMinutes, 30),
    };
  }

  if (typeof body.disableLogging === 'boolean') {
    updates.disableLogging = {
      enabled: body.disableLogging,
      minutes: toSafeMinutes(body.disableLoggingMinutes, 30),
    };
  }

  if (typeof body.disableAnonLogging === 'boolean') {
    updates.disableAnonLogging = {
      enabled: body.disableAnonLogging,
      minutes: toSafeMinutes(body.disableAnonLoggingMinutes, 30),
    };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: 'NO_UPDATES' },
      { status: 400 }
    );
  }

  setRuntimeFreezeOverrides(updates);

  return NextResponse.json({
    ok: true,
    state: getRuntimeFreezeState(),
    updatedBy: authResult.userId,
    serverTime: Date.now(),
  });
}

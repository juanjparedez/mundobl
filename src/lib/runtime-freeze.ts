type FreezeFeature = 'non-critical' | 'ai' | 'logging' | 'anon-logging';

type RuntimeFreezeState = {
  windowStartMs: number;
  hitsInWindow: number;
  freezeUntilMs: number;
};

type RuntimeManualOverrides = {
  forceFreezeUntilMs: number;
  disableAiUntilMs: number;
  disableLoggingUntilMs: number;
  disableAnonLoggingUntilMs: number;
};

type RuntimeFreezeToggle = {
  enabled: boolean;
  minutes?: number;
};

export type RuntimeFreezeOverridesInput = {
  forceFreeze?: RuntimeFreezeToggle;
  disableAI?: RuntimeFreezeToggle;
  disableLogging?: RuntimeFreezeToggle;
  disableAnonLogging?: RuntimeFreezeToggle;
};

const AUTO_ENABLED = normalizeBoolean(
  process.env.RUNTIME_FREEZE_AUTO_ENABLED,
  true
);
const FORCE_ENABLED = normalizeBoolean(
  process.env.RUNTIME_FREEZE_FORCE,
  false
);
const WINDOW_MS = normalizePositiveInt(
  process.env.RUNTIME_FREEZE_WINDOW_MS,
  60_000
);
const HIT_THRESHOLD = normalizePositiveInt(
  process.env.RUNTIME_FREEZE_HIT_THRESHOLD,
  1200
);
const COOLDOWN_MS = normalizePositiveInt(
  process.env.RUNTIME_FREEZE_COOLDOWN_MS,
  20 * 60_000
);

const state: RuntimeFreezeState = {
  windowStartMs: Date.now(),
  hitsInWindow: 0,
  freezeUntilMs: 0,
};

const manualOverrides: RuntimeManualOverrides = {
  forceFreezeUntilMs: 0,
  disableAiUntilMs: 0,
  disableLoggingUntilMs: 0,
  disableAnonLoggingUntilMs: 0,
};

function normalizeBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return fallback;
}

function normalizePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
}

function isAutoFreezeCurrentlyActive(nowMs: number): boolean {
  return state.freezeUntilMs > nowMs;
}

function isManualOverrideActive(untilMs: number, nowMs: number): boolean {
  return untilMs > nowMs;
}

function setOverride(
  key: keyof RuntimeManualOverrides,
  enabled: boolean | undefined,
  ttlMs: number,
  nowMs: number
): void {
  if (enabled === undefined) return;
  manualOverrides[key] = enabled ? nowMs + ttlMs : 0;
}

export function registerRuntimePressureHit(): void {
  if (!AUTO_ENABLED || FORCE_ENABLED) return;

  const nowMs = Date.now();
  if (nowMs - state.windowStartMs >= WINDOW_MS) {
    state.windowStartMs = nowMs;
    state.hitsInWindow = 0;
  }

  state.hitsInWindow += 1;
  if (state.hitsInWindow >= HIT_THRESHOLD) {
    state.freezeUntilMs = nowMs + COOLDOWN_MS;
  }
}

export function isRuntimeFreezeActive(_feature: FreezeFeature = 'non-critical'): boolean {
  const nowMs = Date.now();

  if (FORCE_ENABLED) return true;

  if (isManualOverrideActive(manualOverrides.forceFreezeUntilMs, nowMs)) {
    return true;
  }

  if (_feature === 'ai') {
    if (isManualOverrideActive(manualOverrides.disableAiUntilMs, nowMs)) {
      return true;
    }
  }

  if (_feature === 'logging') {
    if (isManualOverrideActive(manualOverrides.disableLoggingUntilMs, nowMs)) {
      return true;
    }
  }

  if (_feature === 'anon-logging') {
    if (
      isManualOverrideActive(manualOverrides.disableAnonLoggingUntilMs, nowMs)
    ) {
      return true;
    }
  }

  if (!AUTO_ENABLED) return false;
  return isAutoFreezeCurrentlyActive(nowMs);
}

export function setRuntimeFreezeOverrides(input: {
  forceFreeze?: RuntimeFreezeToggle;
  disableAI?: RuntimeFreezeToggle;
  disableLogging?: RuntimeFreezeToggle;
  disableAnonLogging?: RuntimeFreezeToggle;
}): void {
  const nowMs = Date.now();

  if (input.forceFreeze) {
    const ttlMs =
      typeof input.forceFreeze.minutes === 'number' && input.forceFreeze.minutes > 0
        ? input.forceFreeze.minutes * 60_000
        : COOLDOWN_MS;
    setOverride('forceFreezeUntilMs', input.forceFreeze.enabled, ttlMs, nowMs);
  }

  if (input.disableAI) {
    const ttlMs =
      typeof input.disableAI.minutes === 'number' && input.disableAI.minutes > 0
        ? input.disableAI.minutes * 60_000
        : COOLDOWN_MS;
    setOverride('disableAiUntilMs', input.disableAI.enabled, ttlMs, nowMs);
  }

  if (input.disableLogging) {
    const ttlMs =
      typeof input.disableLogging.minutes === 'number' && input.disableLogging.minutes > 0
        ? input.disableLogging.minutes * 60_000
        : COOLDOWN_MS;
    setOverride(
      'disableLoggingUntilMs',
      input.disableLogging.enabled,
      ttlMs,
      nowMs
    );
  }

  if (input.disableAnonLogging) {
    const ttlMs =
      typeof input.disableAnonLogging.minutes === 'number' &&
      input.disableAnonLogging.minutes > 0
        ? input.disableAnonLogging.minutes * 60_000
        : COOLDOWN_MS;
    setOverride(
      'disableAnonLoggingUntilMs',
      input.disableAnonLogging.enabled,
      ttlMs,
      nowMs
    );
  }
}

export function getRuntimeFreezeState() {
  const nowMs = Date.now();
  return {
    enabled: isRuntimeFreezeActive(),
    forced: FORCE_ENABLED,
    autoEnabled: AUTO_ENABLED,
    windowMs: WINDOW_MS,
    hitThreshold: HIT_THRESHOLD,
    cooldownMs: COOLDOWN_MS,
    hitsInWindow: state.hitsInWindow,
    windowStartMs: state.windowStartMs,
    freezeUntilMs: state.freezeUntilMs,
    freezeRemainingMs:
      state.freezeUntilMs > nowMs ? state.freezeUntilMs - nowMs : 0,
    manual: {
      forceFreezeUntilMs: manualOverrides.forceFreezeUntilMs,
      forceFreezeRemainingMs:
        manualOverrides.forceFreezeUntilMs > nowMs
          ? manualOverrides.forceFreezeUntilMs - nowMs
          : 0,
      disableAiUntilMs: manualOverrides.disableAiUntilMs,
      disableAiRemainingMs:
        manualOverrides.disableAiUntilMs > nowMs
          ? manualOverrides.disableAiUntilMs - nowMs
          : 0,
      disableLoggingUntilMs: manualOverrides.disableLoggingUntilMs,
      disableLoggingRemainingMs:
        manualOverrides.disableLoggingUntilMs > nowMs
          ? manualOverrides.disableLoggingUntilMs - nowMs
          : 0,
      disableAnonLoggingUntilMs: manualOverrides.disableAnonLoggingUntilMs,
      disableAnonLoggingRemainingMs:
        manualOverrides.disableAnonLoggingUntilMs > nowMs
          ? manualOverrides.disableAnonLoggingUntilMs - nowMs
          : 0,
    },
  };
}

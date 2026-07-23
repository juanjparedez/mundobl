type FreezeFeature = 'non-critical' | 'ai' | 'logging';

type RuntimeFreezeState = {
  windowStartMs: number;
  hitsInWindow: number;
  freezeUntilMs: number;
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
  if (FORCE_ENABLED) return true;
  if (!AUTO_ENABLED) return false;
  return isAutoFreezeCurrentlyActive(Date.now());
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
    freezeUntilMs: state.freezeUntilMs,
    freezeRemainingMs:
      state.freezeUntilMs > nowMs ? state.freezeUntilMs - nowMs : 0,
  };
}

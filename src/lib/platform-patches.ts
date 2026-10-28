// Parches de plataforma: un parche por plataforma oficial donde se pueden ver
// las series del catalogo, con tres niveles segun cuantas series terminaste
// que tienen link oficial ahi (WatchLink.official). Es "terminaste N series
// disponibles en X", no "las viste en X": MundoBL no sabe donde las viste.
//
// El arte del parche es propio (siglas + color del nivel), sin logos de las
// plataformas: usar sus marcas graficas requiere permiso.

export interface PlatformPatchDefinition {
  /** Id estable (clase CSS y key de React). */
  key: string;
  /** Valor exacto de WatchLink.platform. */
  platform: string;
  /** Siglas que se dibujan en el parche. */
  initials: string;
}

// Solo plataformas oficiales con catalogo suficiente para que el parche se
// pueda conseguir. "Otro" y sitios no oficiales quedan afuera a proposito.
export const PLATFORM_PATCHES: readonly PlatformPatchDefinition[] = [
  { key: 'youtube', platform: 'YouTube', initials: 'YT' },
  { key: 'viki', platform: 'Viki', initials: 'VK' },
  { key: 'iqiyi', platform: 'iQIYI', initials: 'iQ' },
  { key: 'gagaoolala', platform: 'GagaOOLala', initials: 'GL' },
  { key: 'wetv', platform: 'WeTV', initials: 'WT' },
  { key: 'netflix', platform: 'Netflix', initials: 'NF' },
];

export const PATCH_PLATFORMS = PLATFORM_PATCHES.map((p) => p.platform);

export type PatchTier = 'bronze' | 'silver' | 'gold';

export const PATCH_TIERS: readonly { tier: PatchTier; goal: number }[] = [
  { tier: 'bronze', goal: 1 },
  { tier: 'silver', goal: 5 },
  { tier: 'gold', goal: 15 },
];

/** Logros guardados en UserAchievement: key → fecha ISO en que se obtuvo. */
export type AchievementUnlocks = Readonly<Record<string, string>>;

/** Key de UserAchievement para un nivel de parche. */
export function patchAchievementKey(patchKey: string, tier: PatchTier): string {
  return `patch:${patchKey}:${tier}`;
}

export interface PlatformPatchProgress extends PlatformPatchDefinition {
  completed: number;
  /** Nivel alcanzado, o null si todavia no tiene ninguno. */
  tier: PatchTier | null;
  /** Meta del siguiente nivel, o null si ya tiene oro. */
  nextGoal: number | null;
  /** Niveles que cumple hoy por cantidad (lo que se guarda al otorgar). */
  tiersReached: PatchTier[];
  /** Niveles obtenidos (0 a 3), guardados o cumplidos hoy: cada uno cuenta
   *  como un logro. */
  tiersUnlocked: number;
}

/** Un nivel guardado queda aunque baje la cantidad de series. */
export function evaluatePlatformPatches(
  completedByPlatform: ReadonlyArray<{ platform: string; count: number }>,
  unlocks: AchievementUnlocks = {}
): PlatformPatchProgress[] {
  const counts = new Map(
    completedByPlatform.map((row) => [row.platform, row.count])
  );
  return PLATFORM_PATCHES.map((patch) => {
    const completed = counts.get(patch.platform) ?? 0;
    const reached = PATCH_TIERS.filter((t) => completed >= t.goal);
    const unlocked = PATCH_TIERS.filter(
      (t) =>
        completed >= t.goal ||
        unlocks[patchAchievementKey(patch.key, t.tier)] !== undefined
    );
    const next = PATCH_TIERS.find((t) => !unlocked.includes(t));
    return {
      ...patch,
      completed,
      tier: unlocked.at(-1)?.tier ?? null,
      nextGoal: next?.goal ?? null,
      tiersReached: reached.map((t) => t.tier),
      tiersUnlocked: unlocked.length,
    };
  });
}

export const PLATFORM_PATCH_TIERS_TOTAL =
  PLATFORM_PATCHES.length * PATCH_TIERS.length;

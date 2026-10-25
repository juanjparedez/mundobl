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

export interface PlatformPatchProgress extends PlatformPatchDefinition {
  completed: number;
  /** Nivel alcanzado, o null si todavia no tiene ninguno. */
  tier: PatchTier | null;
  /** Meta del siguiente nivel, o null si ya tiene oro. */
  nextGoal: number | null;
  /** Niveles obtenidos (0 a 3): cada uno cuenta como un logro. */
  tiersUnlocked: number;
}

export function evaluatePlatformPatches(
  completedByPlatform: ReadonlyArray<{ platform: string; count: number }>
): PlatformPatchProgress[] {
  const counts = new Map(
    completedByPlatform.map((row) => [row.platform, row.count])
  );
  return PLATFORM_PATCHES.map((patch) => {
    const completed = counts.get(patch.platform) ?? 0;
    const reached = PATCH_TIERS.filter((t) => completed >= t.goal);
    const next = PATCH_TIERS.find((t) => completed < t.goal);
    return {
      ...patch,
      completed,
      tier: reached.at(-1)?.tier ?? null,
      nextGoal: next?.goal ?? null,
      tiersUnlocked: reached.length,
    };
  });
}

export const PLATFORM_PATCH_TIERS_TOTAL =
  PLATFORM_PATCHES.length * PATCH_TIERS.length;

// Editorial exclusions apply only to suggestions, never to stored values.
const EXCLUDED_SUGGESTIONS = new Set(['gm']);

export const normalizeBasedOn = (value: string) =>
  value.trim().replace(/\s+/g, ' ');

export function getBasedOnSuggestions(
  values: readonly (string | null)[]
): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const unique = new Map<string, string>();
  for (const [value] of [...counts].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )) {
    const label = normalizeBasedOn(value);
    if (!label) continue;
    const key = label.toLowerCase();
    if (!EXCLUDED_SUGGESTIONS.has(key) && !unique.has(key)) {
      unique.set(key, label);
    }
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

export interface BasedOnEntry {
  value: string;
  series: { id: number; title: string }[];
}

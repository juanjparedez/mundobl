// Editorial exclusions apply only to suggestions, never to stored values.
const EXCLUDED_SUGGESTIONS = new Set(['gm', 'manga']);

export function getBasedOnSuggestions(
  values: readonly (string | null)[]
): string[] {
  const unique = new Map<string, string>();
  for (const value of values) {
    const label = value?.trim().replace(/\s+/g, ' ');
    if (!label) continue;
    const key = label.toLowerCase();
    if (!EXCLUDED_SUGGESTIONS.has(key) && !unique.has(key)) {
      unique.set(key, label);
    }
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

export function interpolateMessage(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

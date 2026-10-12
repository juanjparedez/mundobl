export interface SupportMethod {
  kind: 'link' | 'transfer';
  label: string;
  enabled: boolean;
  url: string;
  alias: string;
  holder: string;
  bank: string;
  currency: string;
}
export interface SupportContent {
  intro: string;
  purpose: string;
  thanks: string;
  methods: SupportMethod[];
}
export const EMPTY_SUPPORT: SupportContent = {
  intro: '',
  purpose: '',
  thanks: '',
  methods: [],
};
export class SupportError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: 'error' | 'conflict'
  ) {
    super(code);
  }
}
export function isSupportOwner(
  user: { role: string; email?: string | null; banned?: boolean },
  emails: string
): boolean {
  return (
    user.role === 'ADMIN' &&
    !user.banned &&
    !!user.email &&
    emails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(user.email.toLowerCase())
  );
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new SupportError(400, 'error');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max)
    throw new SupportError(400, 'error');
  return value.trim();
}
export function parseSupportContent(
  value: unknown,
  publishing = false
): SupportContent {
  const row = object(value);
  const intro = text(row.intro, 2000),
    purpose = text(row.purpose, 2000),
    thanks = text(row.thanks, 1000);
  if (!Array.isArray(row.methods) || row.methods.length > 8)
    throw new SupportError(400, 'error');
  const methods = row.methods.map((value): SupportMethod => {
    const m = object(value);
    if (
      (m.kind !== 'link' && m.kind !== 'transfer') ||
      typeof m.enabled !== 'boolean'
    )
      throw new SupportError(400, 'error');
    const method = {
      kind: m.kind,
      enabled: m.enabled,
      label: text(m.label, 100),
      url: text(m.url, 500),
      alias: text(m.alias, 100),
      holder: text(m.holder, 150),
      bank: text(m.bank, 100),
      currency: text(m.currency, 10),
    };
    if (method.url) {
      let url: URL;
      try {
        url = new URL(method.url);
      } catch {
        throw new SupportError(400, 'error');
      }
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new SupportError(400, 'error');
    }
    if (
      publishing &&
      method.enabled &&
      (!method.label ||
        (method.kind === 'link'
          ? !method.url
          : !method.alias ||
            !method.holder ||
            !method.bank ||
            !method.currency))
    )
      throw new SupportError(400, 'error');
    return method as SupportMethod;
  });
  if (publishing && (!intro || !purpose || !methods.some((m) => m.enabled)))
    throw new SupportError(400, 'error');
  return { intro, purpose, thanks, methods };
}
export function parseSupportMutation(value: unknown) {
  const row = object(value);
  if (
    !Number.isSafeInteger(row.version) ||
    (row.version as number) < 0 ||
    !['save', 'publish', 'hide'].includes(String(row.action))
  )
    throw new SupportError(400, 'error');
  return {
    version: row.version as number,
    action: row.action as 'save' | 'publish' | 'hide',
    content:
      row.action === 'save' ? parseSupportContent(row.content) : undefined,
  };
}

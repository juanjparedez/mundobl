export function isSupabaseImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  try {
    return new URL(url).hostname === new URL(base).hostname;
  } catch {
    return false;
  }
}

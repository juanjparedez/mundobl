/**
 * Detecta si una URL de imagen vive en Supabase Storage.
 *
 * No depende de NEXT_PUBLIC_SUPABASE_URL: verifica el hostname directamente.
 * Esto es importante porque next/image necesita esta función en el cliente
 * y la env var puede no estar inyectada en el bundle según la config de Vercel.
 */
export function isSupabaseImageUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return (
      hostname.endsWith('.supabase.co') && pathname.startsWith('/storage/')
    );
  } catch {
    return false;
  }
}

import type { Metadata } from 'next';
import { loadLocaleMessages } from '@/i18n/messages';

/** Always generic, including for consented browsers: link-preview crawlers never receive adult previews. */
export async function adultMetadata(): Promise<Metadata> {
  const labels = (await loadLocaleMessages('es')).editorial;
  return {
    title: labels.adultTitle,
    description: labels.adultNotice,
    robots: { index: false, follow: false, noimageindex: true },
    openGraph: {
      title: labels.adultTitle,
      description: labels.adultNotice,
      images: [],
    },
  };
}

/**
 * Texto libre (sinopsis, biografia) recortado para `<meta description>`.
 *
 * Google muestra ~155-160 caracteres: se corta en el ultimo espacio antes del
 * limite y se agrega "…" para no dejar una palabra partida. Devuelve null si
 * no hay texto util, para que el llamador use su descripcion de respaldo.
 */
export function metaDescription(
  text: string | null | undefined,
  max = 158
): string | null {
  const clean = text?.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:—-]+$/, '')}…`;
}

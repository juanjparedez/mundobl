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

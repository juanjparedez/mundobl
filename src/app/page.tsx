import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WebSite } from 'schema-dts';
import { LandingPage } from './LandingPage/LandingPage';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd<WebSite>
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'MundoBL',
          url: 'https://mundobl.win',
          description:
            'Catálogo de series BL (Boys Love), GL (Girls Love) y doramas asiáticos.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate:
                'https://mundobl.win/catalogo?q={search_term_string}',
            },

            // @ts-expect-error query-input is valid JSON-LD but not yet typed in schema-dts
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <LandingPage />
    </>
  );
}

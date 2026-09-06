export const revalidate = 3600;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Organization } from 'schema-dts';
import { getProductionCompanyById } from '@/lib/database';
import { isIndexableCompany } from '@/lib/person-completeness';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs/Breadcrumbs';
import { CompanyProfileClient } from './CompanyProfileClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadCompany(id: string) {
  const companyId = Number.parseInt(id, 10);
  if (Number.isNaN(companyId)) return null;
  return getProductionCompanyById(companyId);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await loadCompany(id);
  if (!company) return {};

  const seriesCount = company.seriesLinks.length;
  const description =
    company.description?.slice(0, 160).replace(/\n/g, ' ') ??
    `${company.name}: ${seriesCount} series en el catálogo de MundoBL.`;

  // Las fichas sin datos propios y con poco catalogo quedan fuera del indice
  // hasta poblarse — evita ofrecerle a Google paginas vacias (thin content).
  const indexable = isIndexableCompany({
    imageUrl: company.imageUrl,
    description: company.description,
    seriesCount,
  });

  return {
    title: `${company.name} | Productora - MundoBL`,
    description,
    alternates: { canonical: `/productoras/${company.id}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: company.name,
      description,
      url: `/productoras/${company.id}`,
      ...(company.imageUrl && {
        images: [{ url: company.imageUrl, alt: company.name }],
      }),
    },
  };
}

export default async function ProductoraPage({ params }: PageProps) {
  const { id } = await params;
  const company = await loadCompany(id);
  if (!company) notFound();

  const countryName = company.countryRef?.name ?? company.country ?? null;

  return (
    <>
      <JsonLd<Organization>
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: company.name,
          ...(company.imageUrl && { logo: company.imageUrl }),
          ...(company.description && { description: company.description }),
          ...(company.websiteUrl && { url: company.websiteUrl }),
          ...(company.foundedYear && {
            foundingDate: String(company.foundedYear),
          }),
          ...(countryName && {
            address: {
              '@type': 'PostalAddress',
              addressCountry: countryName,
            },
          }),
        }}
      />
      <Breadcrumbs
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Productoras', href: '/productoras' },
          { name: company.name },
        ]}
      />
      <CompanyProfileClient
        company={{
          id: company.id,
          name: company.name,
          description: company.description,
          imageUrl: company.imageUrl,
          websiteUrl: company.websiteUrl,
          youtubeUrl: company.youtubeUrl,
          foundedYear: company.foundedYear,
          countryName,
          series: company.seriesLinks.map((l) => l.series),
        }}
      />
    </>
  );
}

import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import type { BreadcrumbList } from 'schema-dts';
import './Breadcrumbs.css';

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://mundobl.win';

export function Breadcrumbs({
  items,
  baseUrl = DEFAULT_BASE_URL,
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <>
      <JsonLd<BreadcrumbList>
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            ...(item.href && { item: `${baseUrl}${item.href}` }),
          })),
        }}
      />
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <ol className="breadcrumbs__list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.name}-${index}`} className="breadcrumbs__item">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="breadcrumbs__link"
                    prefetch={false}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="breadcrumbs__current" aria-current="page">
                    {item.name}
                  </span>
                )}
                {!isLast && (
                  <span className="breadcrumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

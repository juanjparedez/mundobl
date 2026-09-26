'use client';

import Link from 'next/link';
import { Avatar, Tag } from 'antd';
import { PanelCard, EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { getWriterById } from '@/lib/database';
import './WriterProfile.css';

function publicUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function WriterProfile({
  writer,
}: {
  writer: NonNullable<Awaited<ReturnType<typeof getWriterById>>>;
}) {
  const { t } = useLocale();
  const sources = [
    ...new Set(
      [writer.imdbUrl, writer.mdlUrl, writer.wikiUrl, writer.bioSourceUrl]
        .map(publicUrl)
        .filter((url): url is string => url !== null)
    ),
  ];
  return (
    <article className="writer-profile">
      <PanelCard>
        <header className="writer-profile__identity">
          <Avatar size={96} src={publicUrl(writer.imageUrl)} alt={writer.name}>
            {writer.name.slice(0, 1)}
          </Avatar>
          <div>
            <p>{t('writerProfile.role')}</p>
            <h1>{writer.name}</h1>
            {writer.nationality && <p>{writer.nationality}</p>}
            {writer.aliases.length > 0 && <p>{writer.aliases.join(' · ')}</p>}
          </div>
        </header>
        {writer.imageUrl &&
          (writer.imageAttribution || writer.imageLicense) && (
            <p>
              {[writer.imageAttribution, writer.imageLicense]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        {writer.biography && (
          <p className="writer-profile__bio">{writer.biography}</p>
        )}
        {sources.length > 0 && (
          <section>
            <h2>{t('writerProfile.sources')}</h2>
            <ul>
              {sources.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {new URL(url).hostname}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PanelCard>
      <h2>{t('writerProfile.works')}</h2>
      {writer.series.length === 0 ? (
        <EmptyState title={t('writerProfile.empty')} fullHeight={false} />
      ) : (
        <ul className="writer-profile__works">
          {writer.series.map((credit) => (
            <li key={credit.series.id}>
              <PanelCard>
                <Tag>
                  {credit.href.startsWith('/ver/')
                    ? t('contentMetadata.watchTitle')
                    : t('contentMetadata.catalogTitle')}
                </Tag>
                <h3>
                  <Link href={credit.href}>{credit.series.title}</Link>
                </h3>
                {credit.series.year && <p>{credit.series.year}</p>}
                {publicUrl(credit.sourceUrl) && (
                  <a
                    href={publicUrl(credit.sourceUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('writerProfile.creditSource')}
                  </a>
                )}
              </PanelCard>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

'use client';
import { Button } from 'antd';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import type { SupportContent } from '@/lib/support-input';
import type { TranslationShape } from '@/i18n/messages';
import './SupportPage.css';
export function SupportPage({
  content,
  labels,
  demo = false,
  preview = false,
}: {
  content: SupportContent;
  labels: TranslationShape['qualitySupport'];
  demo?: boolean;
  preview?: boolean;
}) {
  return (
    <section className="support-page">
      <h1>{labels.support}</h1>
      {(demo || preview) && (
        <p role="status">{demo ? labels.demo : labels.preview}</p>
      )}
      <PanelCard>
        <p className="support-page__text">{content.intro}</p>
        <p className="support-page__text">{content.purpose}</p>
        <p>{labels.voluntary}</p>
      </PanelCard>
      <div className="support-page__methods">
        {content.methods
          .filter((m) => m.enabled)
          .map((method, i) => (
            <PanelCard key={i}>
              <h2>{method.label}</h2>
              {method.kind === 'link' ? (
                <Button
                  href={demo || preview ? undefined : method.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={demo || preview}
                >
                  {method.label}
                </Button>
              ) : (
                <dl>
                  <dt>{labels.alias}</dt>
                  <dd>{method.alias}</dd>
                  <dt>{labels.holder}</dt>
                  <dd>{method.holder}</dd>
                  <dt>{labels.bank}</dt>
                  <dd>{method.bank}</dd>
                  <dt>{labels.currency}</dt>
                  <dd>{method.currency}</dd>
                </dl>
              )}
            </PanelCard>
          ))}
      </div>
      <p className="support-page__text">{content.thanks}</p>
    </section>
  );
}

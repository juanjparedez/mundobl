import ReactMarkdown from 'react-markdown';
import { Button } from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import type { ActiveAnnouncement } from '@/hooks/useActiveAnnouncements';
import './AnnouncementContent.css';

type Tone = ActiveAnnouncement['tone'];
type Template = ActiveAnnouncement['template'];

export const TONE_ICON: Record<Tone, React.ReactNode> = {
  INFO: <InfoCircleOutlined />,
  SUCCESS: <CheckCircleOutlined />,
  WARNING: <WarningOutlined />,
  PROMO: <GiftOutlined />,
};

// Preset de layout por template. No agrega archivos: cada superficie
// (banner/modal/toast) consulta esta misma tabla para decidir como mostrar
// el CTA. Agregar un template = una entrada aca, no un componente nuevo.
const TEMPLATE_CONFIG: Record<
  Template,
  { ctaVariant: 'button' | 'link'; emphasizeIcon: boolean }
> = {
  SIMPLE: { ctaVariant: 'link', emphasizeIcon: false },
  FEATURE: { ctaVariant: 'button', emphasizeIcon: false },
  MAINTENANCE: { ctaVariant: 'link', emphasizeIcon: true },
};

interface AnnouncementContentProps {
  tone: Tone;
  template: Template;
  title: string;
  body: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
  /** Oculta el titulo (la superficie banner ya lo muestra en su header). */
  hideTitle?: boolean;
}

/**
 * Render de contenido compartido entre las 3 superficies (banner/modal/
 * toast) — el markdown, el icono de tono y el CTA se resuelven una sola vez
 * aca. Cada superficie es solo un wrapper de layout alrededor de esto.
 */
export function AnnouncementContent({
  tone,
  template,
  title,
  body,
  linkUrl,
  linkLabel,
  hideTitle,
}: AnnouncementContentProps) {
  const config = TEMPLATE_CONFIG[template];
  const hasCta = Boolean(linkUrl && linkLabel);
  const isExternal = linkUrl ? !linkUrl.startsWith('/') : false;

  return (
    <div
      className={`announcement-content announcement-content--${tone.toLowerCase()}`}
    >
      <span
        className={`announcement-content__icon${config.emphasizeIcon ? ' announcement-content__icon--emphasize' : ''}`}
        aria-hidden="true"
      >
        {TONE_ICON[tone]}
      </span>
      <div className="announcement-content__main">
        {!hideTitle && (
          <strong className="announcement-content__title">{title}</strong>
        )}
        <div className="announcement-content__markdown">
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              h1: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              h2: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              h3: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              h4: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              h5: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              h6: ({ children }) => (
                <strong className="announcement-content__heading">
                  {children}
                </strong>
              ),
              table: ({ children }) => (
                <div className="announcement-content__table-wrap">
                  <table>{children}</table>
                </div>
              ),
              code: ({ children }) => (
                <code className="announcement-content__code">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="announcement-content__pre">{children}</pre>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
        {hasCta &&
          (config.ctaVariant === 'button' ? (
            <Button
              size="small"
              type="primary"
              href={linkUrl ?? undefined}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="announcement-content__cta-btn"
            >
              {linkLabel}
            </Button>
          ) : (
            <a
              className="announcement-content__cta-link"
              href={linkUrl ?? undefined}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
            >
              {linkLabel}
            </a>
          ))}
      </div>
    </div>
  );
}

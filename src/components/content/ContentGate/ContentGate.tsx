'use client';
import { useState } from 'react';
import { Alert, Button, Space, Tag } from 'antd';
import Link from 'next/link';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import { CONTENT_WARNINGS, type ContentWarning } from '@/lib/content-rating';
import './ContentGate.css';

export function ContentGate({
  warnings = [],
  settings = false,
}: {
  warnings?: string[];
  settings?: boolean;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  async function setConsent(allow: boolean) {
    setBusy(true);
    setError(false);
    try {
      const result = await fetch('/api/content-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow }),
      });
      if (!result.ok) throw new Error();
      if (settings) {
        setSaved(true);
        setBusy(false);
      } else window.location.reload();
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <section className="content-gate">
      <PanelCard padding="lg">
        <Tag>18+</Tag>
        <h1>{t('editorial.adultTitle')}</h1>
        <p>{t('editorial.adultNotice')}</p>
        <p>{t('editorial.scopeNotice')}</p>
        <Space wrap>
          {warnings
            .filter((w) => CONTENT_WARNINGS.includes(w as ContentWarning))
            .map((w) => (
              <Tag key={w}>{t(`editorial.${w as ContentWarning}`)}</Tag>
            ))}
        </Space>
        {error && <Alert type="error" title={t('editorial.error')} />}
        {saved && <Alert type="success" title={t('editorial.saved')} />}
        <div className="content-gate__actions">
          <Button
            type="primary"
            loading={busy}
            onClick={() => setConsent(true)}
          >
            {t('editorial.accept')}
          </Button>
          {settings ? (
            <Button disabled={busy} onClick={() => setConsent(false)}>
              {t('editorial.hide')}
            </Button>
          ) : (
            <Link href="/catalogo">{t('editorial.back')}</Link>
          )}
        </div>
      </PanelCard>
    </section>
  );
}

'use client';
import { useState, useSyncExternalStore } from 'react';
import { Alert, Button, Form, Input, Select, Skeleton } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { PanelCard } from '@/components/design-system/PanelCard/PanelCard';
import {
  CONTENT_RATINGS,
  CONTENT_WARNINGS,
  type ContentRating,
  type ContentWarning,
} from '@/lib/content-rating';
import './ClassificationEditor.css';

interface Props {
  id: number;
  title: string;
  contentRating: string;
  contentWarnings: string[];
  contentRatingSource: string | null;
  editVersion: number;
}
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function ClassificationEditor({ initial }: { initial: Props }) {
  const { t } = useLocale();
  // Ant Design's measured Select/TextArea styles differ in SSR. Mount the
  // interactive controls after hydration; the heading and placeholder stay SSR.
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );
  const [version, setVersion] = useState(initial.editVersion);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'saved' | 'error' | 'conflict' | null>(
    null
  );
  async function save(values: {
    rating: ContentRating;
    warnings: ContentWarning[];
    source?: string;
  }) {
    setBusy(true);
    setStatus(null);
    try {
      const result = await fetch(
        `/api/admin/series/${initial.id}/classification`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...values,
            source: values.source || '',
            editVersion: version,
          }),
        }
      );
      if (result.status === 409) {
        setStatus('conflict');
        return;
      }
      if (!result.ok) throw new Error();
      const data = await result.json();
      setVersion(data.editVersion);
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="classification-editor">
      <PanelCard padding="lg">
        <h1>{initial.title}</h1>
        <h2>{t('editorial.classification')}</h2>
        <p>{t('editorial.authority')}</p>
        {status && (
          <Alert
            type={status === 'saved' ? 'success' : 'error'}
            title={t(`editorial.${status}`)}
          />
        )}
        {hydrated ? (
          <Form
            layout="vertical"
            initialValues={{
              rating: initial.contentRating,
              warnings: initial.contentWarnings,
              source: initial.contentRatingSource,
            }}
            onFinish={save}
          >
            <Form.Item name="rating" label={t('editorial.classification')}>
              <Select
                options={CONTENT_RATINGS.map((value) => ({
                  value,
                  label: t(`editorial.${value}`),
                }))}
              />
            </Form.Item>
            <Form.Item name="warnings" label={t('editorial.warnings')}>
              <Select
                mode="multiple"
                options={CONTENT_WARNINGS.map((value) => ({
                  value,
                  label: t(`editorial.${value}`),
                }))}
              />
            </Form.Item>
            <Form.Item name="source" label={t('editorial.source')}>
              <Input.TextArea maxLength={500} rows={3} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={busy}
              disabled={status === 'conflict'}
            >
              {t('editorial.save')}
            </Button>
          </Form>
        ) : (
          <Skeleton active paragraph={{ rows: 6 }} />
        )}
      </PanelCard>
    </section>
  );
}

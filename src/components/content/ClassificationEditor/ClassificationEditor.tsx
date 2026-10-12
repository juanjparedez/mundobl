'use client';
import { useState } from 'react';
import { Alert, Button, Form, Input, Select } from 'antd';
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
export function ClassificationEditor({ initial }: { initial: Props }) {
  const { t } = useLocale();
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
      </PanelCard>
    </section>
  );
}

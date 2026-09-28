'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Form, Input, Modal, Select, Switch } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { COMMUNITY_KINDS, type CommunityKind } from '@/types/community';
import './CommunityComposer.css';

interface SeriesOption {
  id: number;
  title: string;
}
interface EpisodeOption {
  id: number;
  episodeNumber: number;
  title: string | null;
  season: { seasonNumber: number };
}
interface FormValues {
  kind: CommunityKind;
  title: string;
  body: string;
  seriesId?: number;
  episodeId?: number;
  hasSpoilers?: boolean;
}
export function CommunityComposer({
  kind,
  onClose,
}: {
  kind: CommunityKind;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const currentKind = Form.useWatch('kind', form) ?? kind;
  const seriesId = Form.useWatch('seriesId', form);
  const episodeId = Form.useWatch('episodeId', form);
  const [search, setSearch] = useState('');
  const [series, setSeries] = useState<SeriesOption[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (episodeId) form.setFieldValue('hasSpoilers', true);
  }, [episodeId, form]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSeries([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/community/series?q=${encodeURIComponent(search)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error();
        setSeries(await response.json());
      } catch {
        if (!controller.signal.aborted) setError(t('communityHub.error'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, t]);
  useEffect(() => {
    form.setFieldValue('episodeId', undefined);
    setEpisodes([]);
    if (!seriesId || currentKind !== 'DISCUSSION') return;
    const controller = new AbortController();
    fetch(`/api/community/series?seriesId=${seriesId}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setEpisodes)
      .catch(() => {
        if (!controller.signal.aborted) setError(t('communityHub.error'));
      });
    return () => controller.abort();
  }, [seriesId, currentKind, form, t]);
  async function publish(values: FormValues) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/community/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          seriesId: values.seriesId ?? null,
          episodeId:
            currentKind === 'DISCUSSION' ? (values.episodeId ?? null) : null,
        }),
      });
      if (!response.ok) {
        setError(
          t(
            response.status === 429
              ? 'communityHub.rateLimit'
              : 'communityHub.error'
          )
        );
        return;
      }
      const result: { id: number } = await response.json();
      onClose();
      router.push(`/comunidad/${result.id}`);
      router.refresh();
    } catch {
      setError(t('communityHub.error'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      title={t('communityHub.newTopic')}
      onCancel={() => !saving && onClose()}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ kind, hasSpoilers: false }}
        onFinish={publish}
        className="community-composer"
      >
        {error && <Alert type="error" title={error} showIcon />}
        <Form.Item name="kind" label={t('communityHub.kind')}>
          <Select
            aria-label={t('communityHub.kind')}
            options={COMMUNITY_KINDS.map((value) => ({
              value,
              label: t(`communityHub.${value}`),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="seriesId"
          label={t('communityHub.series')}
          rules={[
            {
              required: currentKind !== 'RECOMMENDATION',
              message: t('communityHub.required'),
            },
          ]}
        >
          <Select
            aria-label={t('communityHub.series')}
            showSearch
            filterOption={false}
            onSearch={setSearch}
            loading={loading}
            allowClear
            placeholder={t('communityHub.searchSeries')}
            options={series.map((s) => ({ value: s.id, label: s.title }))}
            notFoundContent={t('communityHub.searchHint')}
          />
        </Form.Item>
        {currentKind === 'DISCUSSION' && seriesId && (
          <Form.Item name="episodeId" label={t('communityHub.episode')}>
            <Select
              aria-label={t('communityHub.episode')}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('communityHub.wholeSeries')}
              options={episodes.map((e) => ({
                value: e.id,
                label: `${t('communityHub.episodeFormat', { season: e.season.seasonNumber, episode: e.episodeNumber })}${e.title ? ` · ${e.title}` : ''}`,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name="title"
          label={t('communityHub.topicTitle')}
          rules={[
            {
              required: true,
              min: 5,
              max: 140,
              whitespace: true,
              message: t('communityHub.titleHint'),
            },
          ]}
        >
          <Input
            aria-label={t('communityHub.topicTitle')}
            maxLength={140}
            placeholder={t(`communityHub.prompt${currentKind}`)}
          />
        </Form.Item>
        <Form.Item
          name="body"
          label={t('communityHub.body')}
          rules={[
            {
              required: true,
              min: 10,
              max: 5000,
              whitespace: true,
              message: t('communityHub.bodyHint'),
            },
          ]}
        >
          <Input.TextArea
            aria-label={t('communityHub.body')}
            rows={5}
            maxLength={5000}
            showCount
          />
        </Form.Item>
        <Form.Item
          name="hasSpoilers"
          label={t('communityHub.spoilers')}
          valuePropName="checked"
        >
          <Switch disabled={!!episodeId} />
        </Form.Item>
        {episodeId && <p>{t('communityHub.episodeSpoilers')}</p>}
        <Button type="primary" htmlType="submit" loading={saving} block>
          {t('communityHub.publish')}
        </Button>
      </Form>
    </Modal>
  );
}

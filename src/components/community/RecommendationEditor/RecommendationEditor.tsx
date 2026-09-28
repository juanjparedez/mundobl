'use client';
import { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Switch } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { PanelCard } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CommunitySeriesPicker } from '../CommunitySeriesPicker/CommunitySeriesPicker';
import { RecommendationContents } from '../RecommendationContents/RecommendationContents';
import type {
  RecommendationListDetail,
  RecommendationItem,
} from '@/types/community-library';
import type { RecommendationListInput } from '@/lib/community-library-input';
import './RecommendationEditor.css';

export function RecommendationEditor({
  initial,
  kind = 'STANDARD',
  busy,
  error,
  onSave,
  onCancel,
}: {
  initial?: RecommendationListDetail;
  kind?: 'STANDARD' | 'TOP_FIVE';
  busy: boolean;
  error: string;
  onSave: (input: RecommendationListInput) => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [form] = Form.useForm<{ title: string; description: string }>();
  const [items, setItems] = useState<RecommendationItem[]>(
    initial?.items ?? []
  );
  const [preview, setPreview] = useState(false);
  const limit = (initial?.kind ?? kind) === 'TOP_FIVE' ? 5 : 100;
  function move(index: number, direction: number) {
    setItems((previous) => {
      const next = [...previous];
      [next[index], next[index + direction]] = [
        next[index + direction],
        next[index],
      ];
      return next;
    });
  }
  return (
    <Form
      form={form}
      layout="vertical"
      className="recommendation-editor"
      initialValues={{
        title:
          initial?.title ??
          (kind === 'TOP_FIVE' ? t('communitySpace.topFive') : ''),
        description: initial?.description ?? '',
      }}
      onFinish={(values) =>
        onSave({
          ...values,
          items: items.map(({ seriesId, note, hasSpoilers }) => ({
            seriesId,
            note,
            hasSpoilers,
          })),
        })
      }
    >
      {error && <Alert type="error" title={error} showIcon />}
      <Alert
        type="info"
        showIcon
        title={t(
          initial?.visibility === 'PUBLIC'
            ? 'communitySpace.publicEditHint'
            : 'communitySpace.emptyListsHint'
        )}
      />
      <Form.Item
        name="title"
        label={t('communitySpace.title')}
        rules={[
          {
            required: true,
            min: 2,
            max: 100,
            whitespace: true,
            message: t('communityHub.required'),
          },
        ]}
      >
        <Input aria-label={t('communitySpace.title')} maxLength={100} />
      </Form.Item>
      <Form.Item name="description" label={t('communitySpace.description')}>
        <Input.TextArea
          aria-label={t('communitySpace.description')}
          maxLength={1500}
          rows={3}
        />
      </Form.Item>
      <div className="recommendation-editor__heading">
        <h2>{t('communitySpace.addWork')}</h2>
        <span>
          {items.length} / {limit}
        </span>
      </div>
      <CommunitySeriesPicker
        label={t('communitySpace.addWork')}
        hint={t('communityHub.searchHint')}
        errorLabel={t('communityHub.error')}
        disabled={busy || items.length >= limit}
        onSelect={(series) =>
          setItems((previous) =>
            previous.some((item) => item.seriesId === series.id)
              ? previous
              : [
                  ...previous,
                  {
                    seriesId: series.id,
                    position: previous.length,
                    note: '',
                    hasSpoilers: false,
                    series: { ...series, imageUrl: null },
                  },
                ]
          )
        }
      />
      <ol className="recommendation-editor__items">
        {items.map((item, index) => (
          <li key={item.seriesId}>
            <PanelCard>
              <div className="recommendation-editor__heading">
                <strong>
                  {index + 1}. {item.series.title}
                </strong>
                <div className="community-space__actions">
                  <Button
                    icon={<ArrowUpOutlined />}
                    aria-label={`${t('communitySpace.up')}: ${item.series.title}`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  />
                  <Button
                    icon={<ArrowDownOutlined />}
                    aria-label={`${t('communitySpace.down')}: ${item.series.title}`}
                    disabled={busy || index === items.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`${t('communitySpace.remove')}: ${item.series.title}`}
                    disabled={busy}
                    onClick={() =>
                      setItems((previous) =>
                        previous.filter((row) => row.seriesId !== item.seriesId)
                      )
                    }
                  />
                </div>
              </div>
              <label htmlFor={`recommendation-note-${item.seriesId}`}>
                {t('communitySpace.reason')}
              </label>
              <Input.TextArea
                id={`recommendation-note-${item.seriesId}`}
                value={item.note}
                maxLength={1000}
                rows={2}
                disabled={busy}
                onChange={(event) =>
                  setItems((previous) =>
                    previous.map((row) =>
                      row.seriesId === item.seriesId
                        ? { ...row, note: event.target.value }
                        : row
                    )
                  )
                }
              />
              <div className="recommendation-editor__spoilers">
                <Switch
                  id={`recommendation-spoilers-${item.seriesId}`}
                  checked={item.hasSpoilers}
                  disabled={busy}
                  onChange={(checked) =>
                    setItems((previous) =>
                      previous.map((row) =>
                        row.seriesId === item.seriesId
                          ? { ...row, hasSpoilers: checked }
                          : row
                      )
                    )
                  }
                />
                <label htmlFor={`recommendation-spoilers-${item.seriesId}`}>
                  {t('communityHub.spoilers')}
                </label>
              </div>
            </PanelCard>
          </li>
        ))}
      </ol>
      <div className="community-space__actions">
        <Button type="primary" htmlType="submit" loading={busy}>
          {t('communitySpace.save')}
        </Button>
        <Button onClick={() => setPreview(true)} disabled={busy}>
          {t('communitySpace.preview')}
        </Button>
        <Button onClick={onCancel} disabled={busy}>
          {t('communitySpace.cancel')}
        </Button>
      </div>
      <Modal
        open={preview}
        onCancel={() => setPreview(false)}
        footer={null}
        title={t('communitySpace.preview')}
        width={760}
        destroyOnHidden
      >
        <h2>{form.getFieldValue('title')}</h2>
        <p>{form.getFieldValue('description')}</p>
        <RecommendationContents items={items} />
      </Modal>
    </Form>
  );
}

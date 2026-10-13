'use client';

import { useEffect, useState } from 'react';
import { Alert, Checkbox, Modal, Spin } from 'antd';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  CURATION_FIELDS,
  hasCurationValue,
  type CurationField,
} from '@/lib/series-curation-fields';
import './SeriesCurationDialog.css';

interface Props {
  seriesId: number;
  incoming: Record<string, unknown>;
  onCancel: () => void;
  onSave: (fields: CurationField[], editVersion: number) => Promise<void>;
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(display).join('\n') || '—';
  if (typeof value === 'boolean') return value ? '✓' : '—';
  if (typeof value === 'object')
    return Object.values(value)
      .filter((v) => typeof v === 'string' && v)
      .join(' · ');
  return String(value);
}

export function SeriesCurationDialog({
  seriesId,
  incoming,
  onCancel,
  onSave,
}: Props) {
  const { t } = useLocale();
  const [snapshot, setSnapshot] = useState<{
    editVersion: number;
    values: Record<string, unknown>;
  } | null>(null);
  const [selected, setSelected] = useState<CurationField[]>([]);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/series/${seriesId}/curate`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setSnapshot(data);
        // Blank/default values do not get precedence without an explicit choice.
        setSelected(
          (Object.keys(CURATION_FIELDS) as CurationField[]).filter(
            (field) =>
              hasCurationValue(incoming[field]) &&
              incoming[field] !== false &&
              incoming[field] !== 0 &&
              !['type', 'format', 'featuredOrder'].includes(field) &&
              JSON.stringify(incoming[field]) !==
                JSON.stringify(data.values[field])
          )
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [seriesId, incoming]);
  const rows = (Object.keys(CURATION_FIELDS) as CurationField[])
    .filter(
      (field) =>
        Object.hasOwn(incoming, field) &&
        incoming[field] !== undefined &&
        JSON.stringify(incoming[field] ?? null) !==
          JSON.stringify(snapshot?.values[field] ?? null)
    )
    .map((field) => ({
      key: field,
      label: t(`seriesForm.${CURATION_FIELDS[field]}`),
      current: snapshot?.values[field],
      next: incoming[field],
    }));
  return (
    <Modal
      open
      className="series-curation-dialog"
      title={t('seriesForm.compareTitle')}
      width={960}
      onCancel={onCancel}
      okText={t('seriesForm.curateSave')}
      cancelText={t('seriesForm.cancelButton')}
      confirmLoading={saving}
      closable={!saving}
      mask={{ closable: !saving }}
      keyboard={!saving}
      cancelButtonProps={{ disabled: saving }}
      okButtonProps={{ disabled: !snapshot || error }}
      onOk={async () => {
        if (!snapshot) return;
        setSaving(true);
        try {
          await onSave(selected, snapshot.editVersion);
        } finally {
          setSaving(false);
        }
      }}
    >
      <Alert
        type="info"
        showIcon
        title={t('seriesForm.compareHelp')}
        description={t('seriesForm.comparePreserve')}
      />
      {error && <Alert type="error" title={t('seriesForm.saveError')} />}
      <Spin spinning={!snapshot && !error}>
        <div className="series-curation-comparison">
          <Checkbox
            disabled={!snapshot || saving || error}
            checked={
              rows.length > 0 && rows.every((row) => selected.includes(row.key))
            }
            indeterminate={
              rows.some((row) => selected.includes(row.key)) &&
              !rows.every((row) => selected.includes(row.key))
            }
            onChange={(event) =>
              setSelected(
                event.target.checked ? rows.map((row) => row.key) : []
              )
            }
          >
            {t('seriesForm.compareSelectAll')}
          </Checkbox>
          {rows.map((row) => (
            <section
              className="series-curation-field"
              key={row.key}
              data-selected={selected.includes(row.key)}
            >
              <Checkbox
                checked={selected.includes(row.key)}
                disabled={!snapshot || saving || error}
                onChange={(event) =>
                  setSelected((fields) =>
                    event.target.checked
                      ? [...fields, row.key]
                      : fields.filter((field) => field !== row.key)
                  )
                }
              >
                {row.label}
              </Checkbox>
              <dl className="series-curation-values">
                <div>
                  <dt>{t('seriesForm.compareCurrent')}</dt>
                  <dd>{display(row.current)}</dd>
                </div>
                <div>
                  <dt>{t('seriesForm.compareYours')}</dt>
                  <dd>{display(row.next)}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </Spin>
    </Modal>
  );
}

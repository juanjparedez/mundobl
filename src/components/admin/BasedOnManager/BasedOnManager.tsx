'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Space } from 'antd';
import Link from 'next/link';
import { DataTable } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import type { BasedOnEntry } from '@/lib/based-on';
import './BasedOnManager.css';

type Action = 'rename' | 'merge' | 'remove';

export function BasedOnManager() {
  const { t } = useLocale();
  const message = useMessage();
  const [entries, setEntries] = useState<BasedOnEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BasedOnEntry | null>(null);
  const [action, setAction] = useState<Action>('rename');
  const [target, setTarget] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch('/api/admin/based-on');
      if (!response.ok) throw new Error('Load failed');
      setEntries(await response.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const open = (entry: BasedOnEntry, next: Action) => {
    setSelected(entry);
    setAction(next);
    setTarget(next === 'rename' ? entry.value : '');
  };
  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/based-on', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: selected.value,
          target,
          action,
          expectedIds: selected.series.map((series) => series.id),
        }),
      });
      if (!response.ok) throw new Error('Save failed');
      message.success(t('basedOnAdmin.saved'));
      setSelected(null);
      await load();
    } catch {
      message.error(t('basedOnAdmin.conflict'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="based-on-manager">
      <p>{t('basedOnAdmin.description')}</p>
      <div className="based-on-manager__toolbar">
        <Input
          aria-label={t('basedOnAdmin.search')}
          placeholder={t('basedOnAdmin.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />
        <Button onClick={() => void load()} disabled={saving}>
          {t('basedOnAdmin.refresh')}
        </Button>
      </div>
      {failed && <Alert type="error" title={t('basedOnAdmin.error')} />}
      <DataTable<BasedOnEntry>
        rowKey="value"
        loading={loading}
        dataSource={entries.filter((entry) =>
          entry.value.toLowerCase().includes(search.toLowerCase())
        )}
        columns={[
          {
            title: t('basedOnAdmin.value'),
            key: 'value',
            dataIndex: 'value',
            render: (value: string) => (
              <span className="based-on-manager__value">
                {JSON.stringify(value)}
              </span>
            ),
          },
          {
            title: t('basedOnAdmin.series'),
            key: 'series',
            render: (_, entry) => entry.series.length,
          },
          {
            title: t('basedOnAdmin.actions'),
            key: 'actions',
            render: (_, entry) => (
              <Space wrap>
                <Button onClick={() => open(entry, 'rename')}>
                  {t('basedOnAdmin.rename')}
                </Button>
                <Button
                  onClick={() => open(entry, 'merge')}
                  disabled={entries.length < 2}
                >
                  {t('basedOnAdmin.merge')}
                </Button>
                <Button danger onClick={() => open(entry, 'remove')}>
                  {t('basedOnAdmin.remove')}
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={t(`basedOnAdmin.${action}`)}
        open={selected !== null}
        onCancel={() => {
          if (!saving) setSelected(null);
        }}
        onOk={() => void submit()}
        confirmLoading={saving}
        okText={t('basedOnAdmin.confirm')}
        cancelText={t('basedOnAdmin.cancel')}
        okButtonProps={{
          danger: action === 'remove',
          disabled:
            action !== 'remove' &&
            (!target.trim() || target === selected?.value),
        }}
        closable={!saving}
        mask={{ closable: !saving }}
      >
        <p>
          {t('basedOnAdmin.source')}:{' '}
          <strong>{JSON.stringify(selected?.value)}</strong>
        </p>
        {action === 'remove' ? (
          <Alert type="warning" title={t('basedOnAdmin.removeHelp')} />
        ) : (
          <label className="based-on-manager__target">
            {t('basedOnAdmin.target')}
            {action === 'rename' ? (
              <Input
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                maxLength={200}
              />
            ) : (
              <Select
                showSearch
                optionFilterProp="label"
                value={target || undefined}
                onChange={setTarget}
                options={entries
                  .filter((entry) => entry.value !== selected?.value)
                  .map((entry) => ({ value: entry.value, label: entry.value }))}
              />
            )}
          </label>
        )}
        <p>
          {t('basedOnAdmin.affected')}:{' '}
          <strong>{selected?.series.length}</strong>
        </p>
        <ul className="based-on-manager__series">
          {selected?.series.map((series) => (
            <li key={series.id}>
              <Link href={`/admin/series/${series.id}/editar`} target="_blank">
                {series.title}
              </Link>
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}

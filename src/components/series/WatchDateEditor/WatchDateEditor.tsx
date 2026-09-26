'use client';
import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Spin } from 'antd';
import type { WatchDateTarget } from '@/lib/watch-date';
import type { TranslationShape } from '@/i18n/messages';
import './WatchDateEditor.css';

export interface WatchDateOption {
  target: WatchDateTarget;
  label: string;
}
export function WatchDateEditor({
  options,
  labels,
  onClose,
}: {
  options: WatchDateOption[];
  labels: TranslationShape['watchDateEditor'];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const target = options[selected].target;
  const query = new URLSearchParams(
    Object.entries(target).map(([key, value]) => [key, String(value)])
  ).toString();
  const [date, setDate] = useState('');
  const [expectedDate, setExpectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/user/watch-date?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data: { watchedDate: string | null } = await response.json();
        if (!controller.signal.aborted) {
          setExpectedDate(data.watchedDate);
          setDate(data.watchedDate?.slice(0, 10) ?? '');
        }
      } catch {
        if (!controller.signal.aborted) setError(labels.error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [query, labels.error]);
  async function save() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/user/watch-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...target,
          watchedDate: date || null,
          expectedDate,
        }),
      });
      if (!response.ok) {
        setError(response.status === 409 ? labels.conflict : labels.error);
        return;
      }
      onClose();
    } catch {
      setError(labels.error);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      open
      title={labels.title}
      onCancel={onClose}
      onOk={() => void save()}
      okText={labels.save}
      cancelText={labels.cancel}
      confirmLoading={saving}
      okButtonProps={{ disabled: loading || !!error }}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
    >
      <div className="watch-date-editor">
        <Select
          aria-label={labels.title}
          value={selected}
          disabled={saving}
          options={options.map((option, index) => ({
            value: index,
            label: option.label,
          }))}
          onChange={(value) => {
            setLoading(true);
            setSelected(value);
          }}
        />
        {loading ? (
          <Spin />
        ) : (
          <>
            <label htmlFor="watch-date-value">{labels.date}</label>
            <Input
              id="watch-date-value"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              disabled={saving || !!error}
              onChange={(event) => setDate(event.target.value)}
            />
            <Button disabled={saving || !!error} onClick={() => setDate('')}>
              {labels.unknown}
            </Button>
          </>
        )}
        {error && <Alert type="error" title={error} />}
      </div>
    </Modal>
  );
}

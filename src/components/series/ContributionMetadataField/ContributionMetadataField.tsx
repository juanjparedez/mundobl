'use client';

import { useEffect, useState } from 'react';
import { Select, Button, Spin, type SelectProps } from 'antd';
import type { ContributionMetadataKind } from '@/lib/contribution-metadata';
import './ContributionMetadataField.css';

interface Props extends Pick<
  SelectProps<string | string[] | undefined>,
  'value' | 'onChange' | 'id' | 'onBlur' | 'disabled'
> {
  kind: ContributionMetadataKind;
  multiple?: boolean;
  labels: { search: string; error: string; retry: string };
}

export function ContributionMetadataField({
  kind,
  multiple,
  labels,
  ...control
}: Props) {
  const [search, setSearch] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      setNames([]);
      try {
        const query = new URLSearchParams({ kind, q: search });
        const response = await fetch(`/api/contribution-metadata?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Metadata unavailable');
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('names' in payload) ||
          !Array.isArray(payload.names) ||
          !payload.names.every(
            (name): name is string => typeof name === 'string'
          )
        )
          throw new Error('Invalid metadata response');
        if (!controller.signal.aborted) setNames(payload.names);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, search, attempt]);

  return (
    <Select<string | string[] | undefined>
      {...control}
      className="contribution-metadata-field"
      mode={multiple ? 'multiple' : undefined}
      allowClear
      showSearch={{ filterOption: false, onSearch: setSearch }}
      placeholder={labels.search}
      loading={loading}
      options={names.map((name) => ({ value: name, label: name }))}
      notFoundContent={
        failed ? (
          <div className="contribution-metadata-field__error" role="alert">
            <span>{labels.error}</span>
            <Button
              size="small"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {labels.retry}
            </Button>
          </div>
        ) : loading ? (
          <Spin size="small" />
        ) : undefined
      }
    />
  );
}

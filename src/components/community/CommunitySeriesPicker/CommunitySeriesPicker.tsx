'use client';
import { useEffect, useState } from 'react';
import { Alert, Select } from 'antd';
import { communityFetch } from '@/lib/community-client';
import './CommunitySeriesPicker.css';

export interface CommunitySeriesOption {
  id: number;
  title: string;
  origin: string;
  catalogScope: string;
}
export function CommunitySeriesPicker({
  label,
  hint,
  errorLabel,
  onSelect,
  disabled,
}: {
  label: string;
  hint: string;
  errorLabel: string;
  onSelect: (series: CommunitySeriesOption) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CommunitySeriesOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setError(false);
      if (query.trim().length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setOptions(
          await communityFetch<CommunitySeriesOption[]>(
            `/api/community/series?q=${encodeURIComponent(query)}`,
            'GET',
            undefined,
            controller.signal
          )
        );
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <div className="community-series-picker">
      <Select
        aria-label={label}
        placeholder={label}
        showSearch
        searchValue={query}
        onSearch={setQuery}
        filterOption={false}
        value={undefined}
        loading={loading}
        disabled={disabled}
        notFoundContent={hint}
        options={options.map((series) => ({
          value: series.id,
          label: series.title,
        }))}
        onChange={(id) => {
          const series = options.find((item) => item.id === id);
          if (series) onSelect(series);
          setQuery('');
        }}
      />
      {error && <Alert type="error" title={errorLabel} />}
    </div>
  );
}

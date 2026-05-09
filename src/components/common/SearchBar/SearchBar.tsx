'use client';

import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './SearchBar.css';
import { useLocale } from '@/lib/providers/LocaleProvider';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  loading?: boolean;
}

export function SearchBar({
  placeholder,
  onSearch,
  loading = false,
}: SearchBarProps) {
  const { t } = useLocale();
  return (
    <Input.Search
      placeholder={placeholder || t('searchBar.placeholder')}
      allowClear
      enterButton={<SearchOutlined />}
      size="large"
      onSearch={onSearch}
      loading={loading}
      className="search-bar"
    />
  );
}

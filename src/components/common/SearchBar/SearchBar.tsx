'use client';

import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './SearchBar.css';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  loading?: boolean;
}

export function SearchBar({
  placeholder = 'Buscar...',
  onSearch,
  loading = false,
}: SearchBarProps) {
  return (
    <Input.Search
      placeholder={placeholder}
      allowClear
      enterButton={<SearchOutlined />}
      size="large"
      onSearch={onSearch}
      loading={loading}
      className="search-bar"
    />
  );
}

'use client';

import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './AdminTableToolbar.css';

interface AdminTableToolbarProps {
  filters: React.ReactNode;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  rightActions?: React.ReactNode;
  className?: string;
}

export function AdminTableToolbar({
  filters,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  rightActions,
  className,
}: AdminTableToolbarProps) {
  return (
    <div className={`admin-table-toolbar${className ? ` ${className}` : ''}`}>
      {filters}

      <Input
        placeholder={searchPlaceholder}
        prefix={<SearchOutlined />}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        onPressEnter={onSearchSubmit}
        allowClear
        onClear={onSearchClear}
        className="admin-table-toolbar__search"
      />

      {rightActions}
    </div>
  );
}

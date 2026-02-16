'use client';

import { Layout, Switch, Space } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useTheme } from '@/lib/providers/ThemeProvider';
import './Header.css';

const { Header: AntHeader } = Layout;

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AntHeader className="app-header">
      <div className="header-content">
        <h4 className="header-title">MundoBL - Catálogo de Series</h4>
        <Space>
          <span style={{ color: 'var(--text-secondary)' }}>
            {theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
          </span>
          <Switch
            checked={theme === 'dark'}
            onChange={toggleTheme}
            checkedChildren="Oscuro"
            unCheckedChildren="Claro"
          />
        </Space>
      </div>
    </AntHeader>
  );
}

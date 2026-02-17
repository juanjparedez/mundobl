'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Switch } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  PlusOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  BulbFilled,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/navigation';
import { useTheme } from '@/lib/providers/ThemeProvider';
import './Sidebar.css';

const { Sider } = Layout;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    {
      key: ROUTES.CATALOGO,
      icon: <AppstoreOutlined />,
      label: 'Catálogo',
      onClick: () => router.push(ROUTES.CATALOGO),
    },
    {
      key: ROUTES.WATCHING,
      icon: <PlayCircleOutlined />,
      label: 'Viendo Ahora',
      onClick: () => router.push(ROUTES.WATCHING),
    },
    {
      key: 'admin',
      icon: <SettingOutlined />,
      label: 'Administración',
      children: [
        {
          key: ROUTES.ADMIN,
          icon: <PlusOutlined />,
          label: 'Nueva Serie',
          onClick: () => router.push(ROUTES.ADMIN),
        },
        {
          key: '/admin/tags',
          icon: <TagsOutlined />,
          label: 'Tags',
          onClick: () => router.push('/admin/tags'),
        },
        {
          key: '/admin/universos',
          icon: <GlobalOutlined />,
          label: 'Universos',
          onClick: () => router.push('/admin/universos'),
        },
        {
          key: '/admin/actores',
          icon: <UserOutlined />,
          label: 'Actores',
          onClick: () => router.push('/admin/actores'),
        },
        {
          key: '/admin/directores',
          icon: <VideoCameraOutlined />,
          label: 'Directores',
          onClick: () => router.push('/admin/directores'),
        },
      ],
    },
  ];

  const selectedKey = pathname || ROUTES.CATALOGO;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="app-sidebar"
      width={250}
      trigger={null}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <AppstoreOutlined style={{ fontSize: '22px' }} />
          {!collapsed && <span className="sidebar-logo-text">MundoBL</span>}
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />

      <div className="sidebar-footer">
        <div className="sidebar-theme-toggle" onClick={toggleTheme}>
          <span className="sidebar-theme-icon">
            {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          </span>
          {!collapsed && (
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              checkedChildren="Oscuro"
              unCheckedChildren="Claro"
              size="small"
            />
          )}
        </div>
      </div>
    </Sider>
  );
}

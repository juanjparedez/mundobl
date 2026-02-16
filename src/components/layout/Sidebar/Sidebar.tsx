'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  PlusOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants/navigation';
import './Sidebar.css';

const { Sider } = Layout;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
      trigger={
        <div className="sidebar-trigger">
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      }
    >
      <div className="sidebar-logo">
        <AppstoreOutlined style={{ fontSize: '24px' }} />
        {!collapsed && <span className="sidebar-logo-text">MundoBL</span>}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
      />
    </Sider>
  );
}

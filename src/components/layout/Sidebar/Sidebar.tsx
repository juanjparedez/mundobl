'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Switch, Avatar, Button } from 'antd';
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
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

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
      key: ROUTES.FEEDBACK,
      icon: <CommentOutlined />,
      label: 'Feedback',
      onClick: () => router.push(ROUTES.FEEDBACK),
    },
    ...(canAccessAdmin
      ? [
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
              ...(isAdmin
                ? [
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
                    {
                      key: '/admin/usuarios',
                      icon: <TeamOutlined />,
                      label: 'Usuarios',
                      onClick: () => router.push('/admin/usuarios'),
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
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
        <div className="sidebar-user-section">
          {session?.user ? (
            <div className="sidebar-user-info" onClick={() => signOut()}>
              <Avatar
                src={session.user.image}
                icon={!session.user.image ? <UserOutlined /> : undefined}
                size="small"
              />
              {!collapsed && (
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">{session.user.name}</span>
                  <LogoutOutlined className="sidebar-logout-icon" />
                </div>
              )}
            </div>
          ) : (
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => signIn('google')}
              className="sidebar-login-btn"
              block
            >
              {!collapsed && 'Iniciar sesión'}
            </Button>
          )}
        </div>

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

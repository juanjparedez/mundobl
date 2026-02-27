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
  LinkOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
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
    {
      key: '/sitios',
      icon: <LinkOutlined />,
      label: 'Sitios de Interés',
      onClick: () => router.push('/sitios'),
    },
    {
      key: '/contenido',
      icon: <VideoCameraOutlined />,
      label: 'Contenido',
      onClick: () => router.push('/contenido'),
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
                icon: <AppstoreOutlined />,
                label: 'Series',
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
                    {
                      key: '/admin/sitios',
                      icon: <LinkOutlined />,
                      label: 'Sitios',
                      onClick: () => router.push('/admin/sitios'),
                    },
                    {
                      key: '/admin/contenido',
                      icon: <PlayCircleOutlined />,
                      label: 'Contenido',
                      onClick: () => router.push('/admin/contenido'),
                    },
                    {
                      key: '/admin/info',
                      icon: <InfoCircleOutlined />,
                      label: 'Info',
                      onClick: () => router.push('/admin/info'),
                    },
                    {
                      key: '/admin/logs',
                      icon: <FileTextOutlined />,
                      label: 'Logs',
                      onClick: () => router.push('/admin/logs'),
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
            <div
              className="sidebar-user-info"
              role="button"
              tabIndex={0}
              aria-label="Cerrar sesión"
              onClick={() => signOut({ callbackUrl: '/' })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  signOut({ callbackUrl: '/' });
                }
              }}
            >
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
              aria-label="Iniciar sesión"
              block
            >
              {!collapsed && 'Iniciar sesión'}
            </Button>
          )}
        </div>

        <div
          className="sidebar-theme-toggle"
          role="button"
          tabIndex={0}
          aria-label={
            theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
          }
          onClick={toggleTheme}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleTheme();
            }
          }}
        >
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

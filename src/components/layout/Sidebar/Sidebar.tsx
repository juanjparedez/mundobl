'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Button, Select } from 'antd';
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
  LoadingOutlined,
  LoginOutlined,
  LogoutOutlined,
  TeamOutlined,
  CommentOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { AccentPicker } from './AccentPicker/AccentPicker';
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
  const { locale, setLocale, t } = useLocale();
  const { data: session, status } = useSession();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  useEffect(() => {
    setIsPreferencesOpen(false);
  }, [pathname, collapsed]);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const menuItems = [
    {
      key: ROUTES.CATALOGO,
      icon: <AppstoreOutlined />,
      label: t('sidebar.catalog'),
      onClick: () => router.push(ROUTES.CATALOGO),
    },
    {
      key: ROUTES.WATCHING,
      icon: <PlayCircleOutlined />,
      label: t('sidebar.watching'),
      onClick: () => router.push(ROUTES.WATCHING),
    },
    {
      key: ROUTES.FEEDBACK,
      icon: <CommentOutlined />,
      label: t('sidebar.feedback'),
      onClick: () => router.push(ROUTES.FEEDBACK),
    },
    {
      key: '/sitios',
      icon: <LinkOutlined />,
      label: t('sidebar.sites'),
      onClick: () => router.push('/sitios'),
    },
    {
      key: '/contenido',
      icon: <VideoCameraOutlined />,
      label: t('sidebar.content'),
      onClick: () => router.push('/contenido'),
    },
    ...(canAccessAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: t('sidebar.administration'),
            children: [
              {
                key: ROUTES.ADMIN,
                icon: <AppstoreOutlined />,
                label: t('sidebar.series'),
                onClick: () => router.push(ROUTES.ADMIN),
              },
              ...(isAdmin
                ? [
                    {
                      key: '/admin/tags',
                      icon: <TagsOutlined />,
                      label: t('sidebar.tags'),
                      onClick: () => router.push('/admin/tags'),
                    },
                    {
                      key: '/admin/universos',
                      icon: <GlobalOutlined />,
                      label: t('sidebar.universes'),
                      onClick: () => router.push('/admin/universos'),
                    },
                    {
                      key: '/admin/actores',
                      icon: <UserOutlined />,
                      label: t('sidebar.actors'),
                      onClick: () => router.push('/admin/actores'),
                    },
                    {
                      key: '/admin/directores',
                      icon: <VideoCameraOutlined />,
                      label: t('sidebar.directors'),
                      onClick: () => router.push('/admin/directores'),
                    },
                    {
                      key: '/admin/usuarios',
                      icon: <TeamOutlined />,
                      label: t('sidebar.users'),
                      onClick: () => router.push('/admin/usuarios'),
                    },
                    {
                      key: '/admin/sitios',
                      icon: <LinkOutlined />,
                      label: t('sidebar.sites'),
                      onClick: () => router.push('/admin/sitios'),
                    },
                    {
                      key: '/admin/contenido',
                      icon: <PlayCircleOutlined />,
                      label: t('sidebar.content'),
                      onClick: () => router.push('/admin/contenido'),
                    },
                    {
                      key: '/admin/comentarios',
                      icon: <CommentOutlined />,
                      label: t('sidebar.comments'),
                      onClick: () => router.push('/admin/comentarios'),
                    },
                    {
                      key: '/admin/info',
                      icon: <InfoCircleOutlined />,
                      label: t('sidebar.info'),
                      onClick: () => router.push('/admin/info'),
                    },
                    {
                      key: '/admin/logs',
                      icon: <FileTextOutlined />,
                      label: t('sidebar.logs'),
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
          aria-label={
            collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')
          }
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />

      <div className="sidebar-footer">
        <div className="sidebar-user-section">
          {status === 'loading' ? (
            <div className="sidebar-user-loading">
              <LoadingOutlined />
            </div>
          ) : session?.user ? (
            <div className="sidebar-user-info">
              <Link href="/perfil" className="sidebar-user-profile-link" aria-label={t('sidebar.profile')}>
                <Avatar
                  src={session.user.image}
                  icon={!session.user.image ? <UserOutlined /> : undefined}
                  size="small"
                />
                {!collapsed && (
                  <span className="sidebar-user-name">{session.user.name}</span>
                )}
              </Link>
              {!collapsed && (
                <button
                  className="sidebar-logout-btn"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  aria-label={t('sidebar.logout')}
                  title={t('sidebar.logout')}
                >
                  <LogoutOutlined />
                </button>
              )}
            </div>
          ) : (
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => signIn('google')}
              className="sidebar-login-btn"
              aria-label={t('sidebar.login')}
              block
            >
              {!collapsed && t('sidebar.login')}
            </Button>
          )}
        </div>

        <button
          className={`sidebar-settings-trigger${isPreferencesOpen ? ' sidebar-settings-trigger--active' : ''}`}
          onClick={() => {
            if (collapsed) {
              setCollapsed(false);
              return;
            }
            setIsPreferencesOpen((prev) => !prev);
          }}
          aria-label={t('bottomNav.settings')}
          aria-expanded={isPreferencesOpen}
          aria-controls="sidebar-preferences"
        >
          <span className="sidebar-settings-trigger__icon" aria-hidden="true">
            <SettingOutlined />
          </span>
          {!collapsed && <span>{t('bottomNav.settings')}</span>}
        </button>

        {!collapsed && isPreferencesOpen && (
          <div id="sidebar-preferences" className="sidebar-preferences">
            <div className="sidebar-preferences__field">
              <span className="sidebar-preferences__label">{t('common.language')}</span>
              <Select
                value={locale}
                onChange={setLocale}
                options={SUPPORTED_LOCALES.map((code) => ({
                  value: code,
                  label: LOCALE_LABELS[code],
                }))}
                size="small"
                className="sidebar-preferences__select"
                aria-label={t('common.language')}
              />
            </div>

            <div className="sidebar-preferences__field sidebar-preferences__field--stacked">
              <span className="sidebar-preferences__label">{t('bottomNav.accentColor')}</span>
              <AccentPicker />
            </div>

            <button
              className="sidebar-preferences__theme"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? t('sidebar.switchToLight')
                  : t('sidebar.switchToDark')
              }
            >
              <span className="sidebar-preferences__theme-icon" aria-hidden="true">
                {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
              </span>
              <span>{t('bottomNav.theme')}</span>
            </button>
          </div>
        )}
      </div>
    </Sider>
  );
}

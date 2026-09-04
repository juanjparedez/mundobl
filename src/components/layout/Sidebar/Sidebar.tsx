'use client';

import { startTransition, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  TranslationOutlined,
  CommentOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import { useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import { LAST_SEEN_NOVEDADES_KEY } from '@/app/(app)/novedades/storage-keys';
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
  const { t } = useLocale();
  const { data: session } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasNovedades, setHasNovedades] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    let aborted = false;
    fetch('/api/novedades/latest')
      .then((res) => (res.ok ? res.json() : { timestamp: null }))
      .then((data: { timestamp: number | null }) => {
        if (aborted) return;
        if (!data.timestamp) {
          setHasNovedades(false);
          return;
        }
        const seen = Number(
          window.localStorage.getItem(LAST_SEEN_NOVEDADES_KEY) ?? '0'
        );
        setHasNovedades(data.timestamp > seen);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, [pathname]);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const isCollaborator = session?.user?.role === 'COLLABORATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const menuItems = [
    {
      key: ROUTES.CATALOGO,
      icon: <AppstoreOutlined />,
      label: t('sidebar.catalog'),
      onClick: () => router.push(ROUTES.CATALOGO),
    },
    {
      key: ROUTES.VER,
      icon: <PlayCircleOutlined />,
      label: 'Ver series',
      onClick: () => router.push(ROUTES.VER),
    },
    {
      key: ROUTES.WATCHING,
      icon: <PlayCircleOutlined />,
      label: t('sidebar.watching'),
      onClick: () => router.push(ROUTES.WATCHING),
    },
    {
      key: ROUTES.NOVEDADES,
      icon: (
        <Badge dot={hasNovedades} offset={[2, 2]}>
          <NotificationOutlined />
        </Badge>
      ),
      label: t('sidebar.novedades'),
      onClick: () => router.push(ROUTES.NOVEDADES),
    },
    ...(session?.user
      ? [
          {
            key: ROUTES.PERFIL,
            icon: <UserOutlined />,
            label: t('sidebar.profile'),
            onClick: () => router.push(ROUTES.PERFIL),
          },
        ]
      : []),
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
      key: '/plataformas',
      icon: <SafetyCertificateOutlined />,
      label: 'Plataformas & Planes',
      onClick: () => router.push('/plataformas'),
    },
    {
      key: '/glosario',
      icon: <TranslationOutlined />,
      label: 'Glosario Cultural',
      onClick: () => router.push('/glosario'),
    },
    {
      key: '/contenido',
      icon: <VideoCameraOutlined />,
      label: t('sidebar.content'),
      onClick: () => router.push('/contenido'),
    },
    {
      key: ROUTES.ESTADISTICAS,
      icon: <BarChartOutlined />,
      label: t('sidebar.stats'),
      onClick: () => router.push(ROUTES.ESTADISTICAS),
    },
    {
      key: '/acerca',
      icon: <InfoCircleOutlined />,
      label: 'Acerca de MundoBL',
      onClick: () => router.push('/acerca'),
    },
    ...(canAccessAdmin
      ? [
          {
            key: ROUTES.ADMIN,
            icon: <SettingOutlined />,
            label: t('sidebar.administration'),
            onClick: () => router.push(ROUTES.ADMIN),
          },
        ]
      : []),
    // Rol reducido: nunca ve "Administracion" (apunta a /admin, vetado
    // por src/proxy.ts para COLLABORATOR) — item propio hacia su area.
    ...(isCollaborator
      ? [
          {
            key: ROUTES.ADMIN_COLABORADOR,
            icon: <SettingOutlined />,
            label: t('sidebar.collaboratorPanel'),
            onClick: () => router.push(ROUTES.ADMIN_COLABORADOR),
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
        {session?.user ? (
          <button
            className="sidebar-user-block"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <Avatar
              src={session.user.image}
              icon={!session.user.image ? <UserOutlined /> : undefined}
              size={32}
              className="sidebar-user-block__avatar"
            />
            {!collapsed && (
              <>
                <div className="sidebar-user-block__info">
                  <span className="sidebar-user-block__name">
                    {session.user.name ?? t('sidebar.profile')}
                  </span>
                  <span
                    className={`sidebar-user-block__role sidebar-user-block__role--${session.user.role.toLowerCase()}`}
                  >
                    {isAdmin
                      ? t('adminUsers.roleAdmin')
                      : isModerator
                        ? t('adminUsers.roleModerator')
                        : isCollaborator
                          ? t('adminUsers.roleCollaborator')
                          : t('adminUsers.roleVisitor')}
                  </span>
                </div>
                <SettingOutlined
                  className="sidebar-user-block__settings-icon"
                  aria-hidden
                />
              </>
            )}
          </button>
        ) : (
          <button
            className="sidebar-settings-trigger"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <span className="sidebar-settings-trigger__icon" aria-hidden="true">
              <SettingOutlined />
            </span>
            {!collapsed && <span>{t('bottomNav.settings')}</span>}
          </button>
        )}
      </div>
      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </Sider>
  );
}

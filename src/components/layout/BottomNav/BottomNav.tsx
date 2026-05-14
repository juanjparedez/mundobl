'use client';

import { startTransition, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  CommentOutlined,
  LoadingOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined,
  BellOutlined,
  BellFilled,
  MenuOutlined,
  VideoCameraOutlined,
  NotificationOutlined,
  LinkOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Badge, Drawer } from 'antd';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import './BottomNav.css';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const unreadCount = useUnreadNotifications();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const isActive = (path: string) => pathname?.startsWith(path);

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
      setIsMoreOpen(false);
    });
  }, [pathname]);

  const bellIcon = (
    <Badge count={unreadCount} size="small" overflowCount={99} offset={[2, -2]}>
      {unreadCount > 0 ? <BellFilled /> : <BellOutlined />}
    </Badge>
  );

  // Material guideline: nav bar con 3-5 items. Para no apretar mas alla
  // de eso, mostramos siempre 4 primarios + "Mas" (drawer con el resto).
  // Hace que el bar sea consistente para todos los roles y previene
  // labels/icons demasiado chicos cuando hay muchos items.
  const primaryItems: NavItem[] = [
    {
      key: 'catalogo',
      icon: <AppstoreOutlined />,
      label: t('bottomNav.catalog'),
      path: ROUTES.CATALOGO,
    },
    {
      key: 'watching',
      icon: <PlayCircleOutlined />,
      label: t('bottomNav.watching'),
      path: ROUTES.WATCHING,
    },
    {
      key: 'feedback',
      icon: <CommentOutlined />,
      label: t('bottomNav.feedback'),
      path: ROUTES.FEEDBACK,
    },
    ...(session
      ? [
          {
            key: 'notifications',
            icon: bellIcon,
            label: t('notifications.label'),
            path: '/notificaciones',
          },
        ]
      : []),
  ];

  // Items que viven dentro del drawer "Mas" (5to slot del bar). Incluye:
  //  1) acceso a las paginas publicas que no caben como primary (ver,
  //     novedades, sitios, contenido, estadisticas) — equivalentes al
  //     Sidebar de desktop;
  //  2) accesos de cuenta (perfil/login, admin, ajustes, logout).
  // Asi mobile no pierde features que existen en desktop.
  const moreItems: NavItem[] = [
    {
      key: 'ver',
      icon: <VideoCameraOutlined />,
      label: t('bottomNav.ver'),
      path: ROUTES.VER,
    },
    {
      key: 'novedades',
      icon: <NotificationOutlined />,
      label: t('sidebar.novedades'),
      path: ROUTES.NOVEDADES,
    },
    {
      key: 'sitios',
      icon: <LinkOutlined />,
      label: t('sidebar.sites'),
      path: '/sitios',
    },
    {
      key: 'contenido',
      icon: <PlayCircleOutlined />,
      label: t('sidebar.content'),
      path: '/contenido',
    },
    {
      key: 'estadisticas',
      icon: <BarChartOutlined />,
      label: t('sidebar.stats'),
      path: ROUTES.ESTADISTICAS,
    },
    ...(status === 'loading'
      ? [
          {
            key: 'loading',
            icon: <LoadingOutlined />,
            label: t('bottomNav.loading'),
          },
        ]
      : !session
        ? [
            {
              key: 'login',
              icon: <LoginOutlined />,
              label: t('bottomNav.login'),
              onClick: () =>
                signIn('google', {
                  callbackUrl:
                    typeof window !== 'undefined' &&
                    window.location.pathname !== '/'
                      ? window.location.pathname + window.location.search
                      : '/catalogo',
                }),
            },
          ]
        : [
            {
              key: 'profile',
              icon: <UserOutlined />,
              label: session.user?.name?.split(' ')[0] || t('sidebar.profile'),
              path: ROUTES.PERFIL,
            },
          ]),
    ...(canAccessAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: t('bottomNav.admin'),
            path: ROUTES.ADMIN,
          },
        ]
      : []),
    {
      key: 'settings',
      icon: <GlobalOutlined />,
      label: t('bottomNav.settings'),
      onClick: () => {
        setIsMoreOpen(false);
        setIsSettingsOpen(true);
      },
    },
    ...(session
      ? [
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('sidebar.logout'),
            onClick: () => signOut({ callbackUrl: '/' }),
          },
        ]
      : []),
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label={t('bottomNav.mainNavigation')}>
        {primaryItems.map((item) => (
          <button
            key={item.key}
            className={`bottom-nav-item ${item.path && isActive(item.path) ? 'bottom-nav-item--active' : ''}`}
            onClick={
              item.onClick || (() => item.path && router.push(item.path))
            }
            aria-label={item.label}
            aria-current={item.path && isActive(item.path) ? 'page' : undefined}
          >
            <span className="bottom-nav-item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav-item-label">{item.label}</span>
          </button>
        ))}
        <button
          className={`bottom-nav-item ${isMoreOpen ? 'bottom-nav-item--active' : ''}`}
          onClick={() => setIsMoreOpen(true)}
          aria-label={t('bottomNav.more') || 'Más'}
          aria-haspopup="dialog"
        >
          <span className="bottom-nav-item-icon" aria-hidden="true">
            <MenuOutlined />
          </span>
          <span className="bottom-nav-item-label">
            {t('bottomNav.more') || 'Más'}
          </span>
        </button>
      </nav>

      <Drawer
        title={t('bottomNav.more') || 'Más'}
        placement="bottom"
        height="auto"
        open={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        className="bottom-nav-more-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <ul className="bottom-nav-more-list">
          {moreItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`bottom-nav-more-item ${
                  item.path && isActive(item.path)
                    ? 'bottom-nav-more-item--active'
                    : ''
                }`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.path) {
                    router.push(item.path);
                    setIsMoreOpen(false);
                  }
                }}
              >
                <span className="bottom-nav-more-item__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="bottom-nav-more-item__label">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Drawer>

      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

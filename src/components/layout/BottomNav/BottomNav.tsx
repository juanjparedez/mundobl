'use client';

import { startTransition, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LoadingOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Drawer } from 'antd';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useHasNovedades } from '@/hooks/useHasNovedades';
import {
  NAV_ITEMS,
  canSeeNavItem,
  isNavItemActive,
  type NavItemDef,
} from '../navItems';
import './BottomNav.css';

interface NavEntry {
  key: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Navegacion de movil: 4 accesos primarios + "Mas". El cajon "Mas" lista
 * TODO lo que tiene el Sidebar de escritorio (misma fuente: navItems.ts),
 * mas Ajustes y Cerrar sesion. En el celular no falta ninguna seccion.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const { data: session, status } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const unreadCount = useUnreadNotifications();
  const hasNovedades = useHasNovedades();

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
      setIsMoreOpen(false);
    });
  }, [pathname]);

  const navContext = { loggedIn: !!session?.user, role: session?.user?.role };

  const renderIcon = (item: NavItemDef): ReactNode => {
    const Icon = item.icon;
    if (item.key === 'perfil' && session?.user) {
      return (
        <Badge
          count={unreadCount}
          size="small"
          overflowCount={99}
          offset={[2, -2]}
        >
          <Avatar
            src={session.user.image}
            icon={!session.user.image ? <UserOutlined /> : undefined}
            size={26}
            className="bottom-nav-avatar"
          />
        </Badge>
      );
    }
    if (item.badge === 'notifications') {
      return (
        <Badge
          count={unreadCount}
          size="small"
          overflowCount={99}
          offset={[2, -2]}
        >
          <Icon />
        </Badge>
      );
    }
    if (item.badge === 'novedades') {
      return (
        <Badge dot={hasNovedades} offset={[2, 2]}>
          <Icon />
        </Badge>
      );
    }
    return <Icon />;
  };

  const toEntry = (item: NavItemDef, short: boolean): NavEntry => ({
    key: item.key,
    icon: renderIcon(item),
    label: t(short && item.shortLabelKey ? item.shortLabelKey : item.labelKey),
    active: isNavItemActive(item, pathname),
    onClick: () => {
      setIsMoreOpen(false);
      router.push(item.path);
    },
  });

  const loginEntry: NavEntry = {
    key: 'login',
    icon: status === 'loading' ? <LoadingOutlined /> : <LoginOutlined />,
    label: status === 'loading' ? t('bottomNav.loading') : t('bottomNav.login'),
    active: false,
    onClick: () =>
      signIn('google', {
        callbackUrl:
          typeof window !== 'undefined' && window.location.pathname !== '/'
            ? window.location.pathname + window.location.search
            : '/catalogo',
      }),
  };

  // Barra: los 4 primarios. El slot de Perfil es "Entrar" sin sesion.
  const primaryEntries: NavEntry[] = NAV_ITEMS.filter((i) => i.primary).map(
    (item) =>
      item.access === 'session' && !session?.user
        ? loginEntry
        : toEntry(item, true)
  );

  // Cajon "Mas": todo lo demas, con los mismos permisos que el Sidebar.
  const moreEntries: NavEntry[] = [
    ...NAV_ITEMS.filter((i) => !i.primary && canSeeNavItem(i, navContext)).map(
      (item) => toEntry(item, false)
    ),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('bottomNav.settings'),
      active: false,
      onClick: () => {
        setIsMoreOpen(false);
        setIsSettingsOpen(true);
      },
    },
    ...(session?.user
      ? [
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('sidebar.logout'),
            active: false,
            onClick: () => signOut({ callbackUrl: '/' }),
          },
        ]
      : []),
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label={t('bottomNav.mainNavigation')}>
        {primaryEntries.map((entry) => (
          <button
            key={entry.key}
            type="button"
            className={`bottom-nav-item ${entry.active ? 'bottom-nav-item--active' : ''}`}
            onClick={entry.onClick}
            aria-label={entry.label}
            aria-current={entry.active ? 'page' : undefined}
          >
            <span className="bottom-nav-item-icon" aria-hidden="true">
              {entry.icon}
            </span>
            <span className="bottom-nav-item-label">{entry.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`bottom-nav-item ${isMoreOpen ? 'bottom-nav-item--active' : ''}`}
          onClick={() => setIsMoreOpen(true)}
          aria-label={t('bottomNav.more')}
          aria-haspopup="dialog"
        >
          <span className="bottom-nav-item-icon" aria-hidden="true">
            <MenuOutlined />
          </span>
          <span className="bottom-nav-item-label">{t('bottomNav.more')}</span>
        </button>
      </nav>

      <Drawer
        title={t('bottomNav.more')}
        placement="bottom"
        height="82vh"
        open={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        className="bottom-nav-more-drawer"
        styles={{ body: { padding: 0 } }}
      >
        <ul className="bottom-nav-more-list">
          {moreEntries.map((entry) => (
            <li key={entry.key}>
              <button
                type="button"
                className={`bottom-nav-more-item ${
                  entry.active ? 'bottom-nav-more-item--active' : ''
                }`}
                onClick={entry.onClick}
                aria-current={entry.active ? 'page' : undefined}
              >
                <span className="bottom-nav-more-item__icon" aria-hidden="true">
                  {entry.icon}
                </span>
                <span className="bottom-nav-more-item__label">
                  {entry.label}
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

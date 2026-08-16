'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, Button, Dropdown, Tooltip } from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { ROUTES } from '@/constants/navigation';
import { NotificationsBell } from '../NotificationsBell/NotificationsBell';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import './TopBar.css';

function openCommandK() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mb:open-command-k'));
  }
}

/** Rutas donde la search global tiene sentido (busca series). En el resto
 *  ocultamos el boton para que el user no se confunda al teclear y obtener
 *  resultados de series desde una pagina que no es de catalogo. */
const SEARCH_ROUTES = [
  '/catalogo',
  '/ver',
  '/watching',
  '/admin/series',
  '/admin/actores',
  '/admin/directores',
  '/admin/productoras',
  '/admin/contenido',
  '/admin/tags',
  '/admin/universos',
];

/** Estas rutas ya tienen su propia búsqueda local real (input funcional
 *  que filtra la lista en pantalla) — el botón del TopBar que abre el
 *  buscador global queda redundante y confuso solo en el listado exacto,
 *  no en sus sub-rutas (que no tienen búsqueda propia). */
const SEARCH_HIDDEN_EXACT_ROUTES = ['/catalogo', '/ver', '/admin/series'];

function shouldShowSearch(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname === '/') return true;
  if (SEARCH_HIDDEN_EXACT_ROUTES.includes(pathname)) return false;
  return SEARCH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}

/** Rutas donde ocultamos el TopBar completo en mobile para recuperar
 *  espacio vertical (la pagina ya tiene su propio header/acciones). */
const TOPBAR_HIDDEN_MOBILE_ROUTES = ['/perfil'];

function shouldHideTopBar(pathname: string | null, isMobile: boolean): boolean {
  if (!isMobile || !pathname) return false;
  return TOPBAR_HIDDEN_MOBILE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale, setLocale } = useLocale();
  const { data: session, status } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // En /perfil mobile la TopBar queda casi vacia (search no aplica, los
  // unicos chips son avatar + idioma + settings que ya estan en el
  // ProfileDashboardHeader). Ocultarla para no duplicar y dar mas
  // espacio vertical (iter fine_tunning_1 #9). Logout sigue accesible
  // desde el ProfileSettings card "Sesion".
  if (shouldHideTopBar(pathname, isMobile)) {
    return null;
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const showSearch = shouldShowSearch(pathname);

  const localeItems = SUPPORTED_LOCALES.map((code) => ({
    key: code,
    label: LOCALE_LABELS[code],
    onClick: () => setLocale(code),
  }));

  const userMenuItems = session?.user
    ? [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: t('sidebar.profile'),
          onClick: () => router.push(ROUTES.PERFIL),
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: t('bottomNav.settings'),
          onClick: () => setSettingsOpen(true),
        },
        { type: 'divider' as const },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: t('sidebar.logout'),
          onClick: () => signOut({ callbackUrl: '/' }),
          danger: true,
        },
      ]
    : [];

  return (
    <header className="app-topbar" role="banner">
      {showSearch ? (
        <button
          type="button"
          className="app-topbar__search"
          onClick={openCommandK}
          aria-label={t('searchBar.placeholder')}
        >
          <SearchOutlined className="app-topbar__search-icon" aria-hidden />
          <span className="app-topbar__search-text">
            {t('searchBar.placeholder')}
          </span>
          <kbd className="app-topbar__search-kbd" aria-hidden>
            ⌘K
          </kbd>
        </button>
      ) : (
        /* Spacer para mantener el layout cuando no hay search.
         * Si quitamos el button el cluster de actions colapsa al centro. */
        <div className="app-topbar__search-spacer" />
      )}

      <div className="app-topbar__actions">
        {isAdmin && (
          <span
            className="app-topbar__admin-pill"
            role="status"
            aria-label={t('header.adminModeLabel')}
          >
            <SafetyOutlined aria-hidden />
            <span className="app-topbar__admin-pill-text">
              {t('header.adminModeLabel')}
            </span>
          </span>
        )}
        {/* En mobile estos items se duplican con BottomNav (notifications,
         * idioma via SettingsPanel, ajustes, login). Los ocultamos con
         * .app-topbar__mobile-hide en media query <768px para evitar
         * doble entry. El avatar+dropdown del user logueado SI queda
         * (es el unico acceso a logout). */}
        <span className="app-topbar__mobile-hide">
          <NotificationsBell variant="topbar" />
        </span>

        <Dropdown
          menu={{ items: localeItems, selectedKeys: [locale] }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Tooltip title={LOCALE_LABELS[locale]} placement="bottom">
            <button
              type="button"
              className="app-topbar__icon-btn app-topbar__mobile-hide"
              aria-label={LOCALE_LABELS[locale]}
            >
              <GlobalOutlined />
            </button>
          </Tooltip>
        </Dropdown>

        <Tooltip title={t('bottomNav.settings')} placement="bottom">
          <button
            type="button"
            className="app-topbar__icon-btn app-topbar__mobile-hide"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <SettingOutlined />
          </button>
        </Tooltip>

        {status === 'loading' ? (
          <Avatar size={32} icon={<UserOutlined />} />
        ) : session?.user ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button
              type="button"
              className="app-topbar__avatar-btn"
              aria-label={session.user.name ?? t('sidebar.profile')}
            >
              <Avatar
                src={session.user.image}
                icon={!session.user.image ? <UserOutlined /> : undefined}
                size={32}
              />
            </button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<LoginOutlined />}
            className="app-topbar__mobile-hide"
            onClick={() =>
              signIn('google', {
                callbackUrl:
                  typeof window !== 'undefined' &&
                  window.location.pathname !== '/'
                    ? window.location.pathname + window.location.search
                    : '/catalogo',
              })
            }
          >
            {t('sidebar.login')}
          </Button>
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}

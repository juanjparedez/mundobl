'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  CommentOutlined,
  BulbOutlined,
  BulbFilled,
  LoadingOutlined,
  LoginOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Select } from 'antd';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config';
import { AccentPicker } from '@/components/layout/Sidebar/AccentPicker/AccentPicker';
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
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const { data: session, status } = useSession();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const isActive = (path: string) => pathname?.startsWith(path);

  useEffect(() => {
    setIsPreferencesOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
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
              onClick: () => signIn('google'),
            },
          ]
        : [
            {
              key: 'profile',
              icon: <UserOutlined />,
              label:
                session.user?.name?.split(' ')[0] || t('bottomNav.logout'),
              onClick: () => signOut({ callbackUrl: '/' }),
            },
          ]),
  ];

  return (
    <>
      <div
        id="bottom-nav-preferences"
        className={`bottom-nav-preferences${isPreferencesOpen ? ' bottom-nav-preferences--open' : ''}`}
        aria-hidden={!isPreferencesOpen}
      >
        <div className="bottom-nav-preferences__field">
          <span className="bottom-nav-preferences__label">{t('common.language')}</span>
          <Select
            value={locale}
            onChange={setLocale}
            options={SUPPORTED_LOCALES.map((code) => ({
              value: code,
              label: LOCALE_LABELS[code],
            }))}
            size="small"
            className="bottom-nav-preferences__select"
            aria-label={t('common.language')}
          />
        </div>

        <div className="bottom-nav-preferences__field">
          <span className="bottom-nav-preferences__label">{t('bottomNav.accentColor')}</span>
          <AccentPicker />
        </div>

        <button
          className="bottom-nav-preferences__theme"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark'
              ? t('bottomNav.switchToLight')
              : t('bottomNav.switchToDark')
          }
        >
          <span className="bottom-nav-preferences__theme-icon" aria-hidden="true">
            {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          </span>
          <span>{t('bottomNav.theme')}</span>
        </button>
      </div>

      <nav className="bottom-nav" aria-label={t('bottomNav.mainNavigation')}>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`bottom-nav-item ${item.path && isActive(item.path) ? 'bottom-nav-item--active' : ''}`}
            onClick={item.onClick || (() => item.path && router.push(item.path))}
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
          className={`bottom-nav-item ${isPreferencesOpen ? 'bottom-nav-item--active' : ''}`}
          onClick={() => setIsPreferencesOpen((prev) => !prev)}
          aria-label={t('bottomNav.settings')}
          aria-expanded={isPreferencesOpen}
          aria-controls="bottom-nav-preferences"
        >
          <span className="bottom-nav-item-icon" aria-hidden="true">
            <GlobalOutlined />
          </span>
          <span className="bottom-nav-item-label">{t('bottomNav.settings')}</span>
        </button>
      </nav>
    </>
  );
}

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
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
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

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const isActive = (path: string) => pathname?.startsWith(path);

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
    });
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
              label: session.user?.name?.split(' ')[0] || t('bottomNav.logout'),
              onClick: () => signOut({ callbackUrl: '/' }),
            },
          ]),
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label={t('bottomNav.mainNavigation')}>
        {navItems.map((item) => (
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
          className={`bottom-nav-item ${isSettingsOpen ? 'bottom-nav-item--active' : ''}`}
          onClick={() => setIsSettingsOpen(true)}
          aria-label={t('bottomNav.settings')}
          aria-haspopup="dialog"
        >
          <span className="bottom-nav-item-icon" aria-hidden="true">
            <GlobalOutlined />
          </span>
          <span className="bottom-nav-item-label">
            {t('bottomNav.settings')}
          </span>
        </button>
      </nav>
      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  CommentOutlined,
  BulbOutlined,
  BulbFilled,
  LoginOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { ROUTES } from '@/constants/navigation';
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
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isModerator = session?.user?.role === 'MODERATOR';
  const canAccessAdmin = isAdmin || isModerator;

  const isActive = (path: string) => pathname?.startsWith(path);

  const navItems: NavItem[] = [
    {
      key: 'catalogo',
      icon: <AppstoreOutlined />,
      label: 'Catálogo',
      path: ROUTES.CATALOGO,
    },
    {
      key: 'watching',
      icon: <PlayCircleOutlined />,
      label: 'Viendo',
      path: ROUTES.WATCHING,
    },
    {
      key: 'feedback',
      icon: <CommentOutlined />,
      label: 'Feedback',
      path: ROUTES.FEEDBACK,
    },
    ...(canAccessAdmin
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: 'Admin',
            path: ROUTES.ADMIN,
          },
        ]
      : []),
    ...(!session
      ? [
          {
            key: 'login',
            icon: <LoginOutlined />,
            label: 'Entrar',
            onClick: () => signIn('google'),
          },
        ]
      : [
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: session.user?.name?.split(' ')[0] || 'Salir',
            onClick: () => signOut({ callbackUrl: '/' }),
          },
        ]),
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
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
        className="bottom-nav-item"
        onClick={toggleTheme}
        aria-label={
          theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
        }
      >
        <span className="bottom-nav-item-icon" aria-hidden="true">
          {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
        </span>
        <span className="bottom-nav-item-label">Tema</span>
      </button>
    </nav>
  );
}

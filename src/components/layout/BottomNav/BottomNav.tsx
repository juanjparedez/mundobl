'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { ROUTES } from '@/constants/navigation';
import './BottomNav.css';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

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
    key: 'admin',
    icon: <SettingOutlined />,
    label: 'Admin',
    path: ROUTES.ADMIN,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${isActive(item.path) ? 'bottom-nav-item--active' : ''}`}
          onClick={() => router.push(item.path)}
        >
          <span className="bottom-nav-item-icon">{item.icon}</span>
          <span className="bottom-nav-item-label">{item.label}</span>
        </button>
      ))}
      <button className="bottom-nav-item" onClick={toggleTheme}>
        <span className="bottom-nav-item-icon">
          {theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
        </span>
        <span className="bottom-nav-item-label">Tema</span>
      </button>
    </nav>
  );
}

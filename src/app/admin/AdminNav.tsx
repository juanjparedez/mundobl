'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  PlusOutlined,
  TagsOutlined,
  GlobalOutlined,
  UserOutlined,
  VideoCameraOutlined,
  BankOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import './admin-nav.css';

const adminLinks = [
  {
    key: '/admin',
    icon: <PlusOutlined />,
    label: 'Series',
    shortLabel: 'Series',
  },
  {
    key: '/admin/tags',
    icon: <TagsOutlined />,
    label: 'Tags',
    shortLabel: 'Tags',
  },
  {
    key: '/admin/universos',
    icon: <GlobalOutlined />,
    label: 'Universos',
    shortLabel: 'Univ.',
  },
  {
    key: '/admin/actores',
    icon: <UserOutlined />,
    label: 'Actores',
    shortLabel: 'Actor.',
  },
  {
    key: '/admin/directores',
    icon: <VideoCameraOutlined />,
    label: 'Directores',
    shortLabel: 'Direct.',
  },
  {
    key: '/admin/productoras',
    icon: <BankOutlined />,
    label: 'Productoras',
    shortLabel: 'Prod.',
  },
  {
    key: '/admin/idiomas',
    icon: <TranslationOutlined />,
    label: 'Idiomas',
    shortLabel: 'Idiom.',
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="admin-nav">
      {adminLinks.map((link) => (
        <button
          key={link.key}
          className={`admin-nav__item ${pathname === link.key ? 'admin-nav__item--active' : ''}`}
          onClick={() => router.push(link.key)}
        >
          <span className="admin-nav__icon">{link.icon}</span>
          <span className="admin-nav__label">{link.label}</span>
          <span className="admin-nav__label-short">{link.shortLabel}</span>
        </button>
      ))}
    </nav>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  AppstoreOutlined,
  TagsOutlined,
  GlobalOutlined,
  UserOutlined,
  VideoCameraOutlined,
  BankOutlined,
  TranslationOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import './admin-nav.css';
import { useLocale } from '@/lib/providers/LocaleProvider';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const adminLinks = [
    {
      key: '/admin',
      icon: <AppstoreOutlined />,
      label: t('adminNav.series'),
      shortLabel: t('adminNav.seriesShort'),
    },
    {
      key: '/admin/tags',
      icon: <TagsOutlined />,
      label: t('adminNav.tags'),
      shortLabel: t('adminNav.tagsShort'),
    },
    {
      key: '/admin/universos',
      icon: <GlobalOutlined />,
      label: t('adminNav.universes'),
      shortLabel: t('adminNav.universesShort'),
    },
    {
      key: '/admin/actores',
      icon: <UserOutlined />,
      label: t('adminNav.actors'),
      shortLabel: t('adminNav.actorsShort'),
    },
    {
      key: '/admin/directores',
      icon: <VideoCameraOutlined />,
      label: t('adminNav.directors'),
      shortLabel: t('adminNav.directorsShort'),
    },
    {
      key: '/admin/productoras',
      icon: <BankOutlined />,
      label: t('adminNav.productionCompanies'),
      shortLabel: t('adminNav.productionCompaniesShort'),
    },
    {
      key: '/admin/idiomas',
      icon: <TranslationOutlined />,
      label: t('adminNav.languages'),
      shortLabel: t('adminNav.languagesShort'),
    },
    {
      key: '/admin/sitios',
      icon: <LinkOutlined />,
      label: t('adminNav.sites'),
      shortLabel: t('adminNav.sitesShort'),
    },
    {
      key: '/admin/contenido',
      icon: <PlayCircleOutlined />,
      label: t('adminNav.content'),
      shortLabel: t('adminNav.contentShort'),
    },
    {
      key: '/admin/comentarios',
      icon: <MessageOutlined />,
      label: t('adminNav.comments'),
      shortLabel: t('adminNav.commentsShort'),
    },
    {
      key: '/admin/info',
      icon: <InfoCircleOutlined />,
      label: t('adminNav.info'),
      shortLabel: t('adminNav.infoShort'),
    },
    {
      key: '/admin/logs',
      icon: <FileTextOutlined />,
      label: t('adminNav.logs'),
      shortLabel: t('adminNav.logsShort'),
    },
    {
      key: '/admin/changelog',
      icon: <UnorderedListOutlined />,
      label: t('adminNav.changelog'),
      shortLabel: t('adminNav.changelogShort'),
    },
    {
      key: '/admin/stats',
      icon: <BarChartOutlined />,
      label: t('adminNav.stats'),
      shortLabel: t('adminNav.statsShort'),
    },
  ];

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

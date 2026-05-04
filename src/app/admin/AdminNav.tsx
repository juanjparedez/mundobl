'use client';

import { Fragment } from 'react';
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
  ReadOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import './admin-nav.css';
import { useLocale } from '@/lib/providers/LocaleProvider';
import type { TranslationKey } from '@/i18n/messages';

type AdminLink = {
  key: string;
  icon: React.ReactNode;
  labelKey: TranslationKey;
  shortKey: TranslationKey;
};

type AdminGroup = {
  titleKey: TranslationKey;
  links: AdminLink[];
};

// Agrupacion de la nav admin para reducir la sobrecarga visual de tener
// 15 botones en una sola fila. Los grupos siguen un orden de uso:
// catalogo (lo que se gestiona dia a dia) → comunidad → sistema.
const ADMIN_GROUPS: AdminGroup[] = [
  {
    titleKey: 'adminNav.groupCatalog',
    links: [
      {
        key: '/admin',
        icon: <AppstoreOutlined />,
        labelKey: 'adminNav.series',
        shortKey: 'adminNav.seriesShort',
      },
      {
        key: '/admin/tags',
        icon: <TagsOutlined />,
        labelKey: 'adminNav.tags',
        shortKey: 'adminNav.tagsShort',
      },
      {
        key: '/admin/universos',
        icon: <GlobalOutlined />,
        labelKey: 'adminNav.universes',
        shortKey: 'adminNav.universesShort',
      },
      {
        key: '/admin/actores',
        icon: <UserOutlined />,
        labelKey: 'adminNav.actors',
        shortKey: 'adminNav.actorsShort',
      },
      {
        key: '/admin/directores',
        icon: <VideoCameraOutlined />,
        labelKey: 'adminNav.directors',
        shortKey: 'adminNav.directorsShort',
      },
      {
        key: '/admin/productoras',
        icon: <BankOutlined />,
        labelKey: 'adminNav.productionCompanies',
        shortKey: 'adminNav.productionCompaniesShort',
      },
      {
        key: '/admin/idiomas',
        icon: <TranslationOutlined />,
        labelKey: 'adminNav.languages',
        shortKey: 'adminNav.languagesShort',
      },
    ],
  },
  {
    titleKey: 'adminNav.groupCommunity',
    links: [
      {
        key: '/admin/contenido',
        icon: <PlayCircleOutlined />,
        labelKey: 'adminNav.content',
        shortKey: 'adminNav.contentShort',
      },
      {
        key: '/admin/sitios',
        icon: <LinkOutlined />,
        labelKey: 'adminNav.sites',
        shortKey: 'adminNav.sitesShort',
      },
      {
        key: '/admin/comentarios',
        icon: <MessageOutlined />,
        labelKey: 'adminNav.comments',
        shortKey: 'adminNav.commentsShort',
      },
      {
        key: '/admin/resenas',
        icon: <ReadOutlined />,
        labelKey: 'adminNav.reviews',
        shortKey: 'adminNav.reviewsShort',
      },
      {
        key: '/admin/noticias',
        icon: <NotificationOutlined />,
        labelKey: 'adminNav.news',
        shortKey: 'adminNav.newsShort',
      },
    ],
  },
  {
    titleKey: 'adminNav.groupSystem',
    links: [
      {
        key: '/admin/info',
        icon: <InfoCircleOutlined />,
        labelKey: 'adminNav.info',
        shortKey: 'adminNav.infoShort',
      },
      {
        key: '/admin/logs',
        icon: <FileTextOutlined />,
        labelKey: 'adminNav.logs',
        shortKey: 'adminNav.logsShort',
      },
      {
        key: '/admin/changelog',
        icon: <UnorderedListOutlined />,
        labelKey: 'adminNav.changelog',
        shortKey: 'adminNav.changelogShort',
      },
      {
        key: '/admin/stats',
        icon: <BarChartOutlined />,
        labelKey: 'adminNav.stats',
        shortKey: 'adminNav.statsShort',
      },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  return (
    <nav className="admin-nav admin-nav--grouped">
      {ADMIN_GROUPS.map((group, groupIdx) => (
        <Fragment key={group.titleKey}>
          {groupIdx > 0 && (
            <span className="admin-nav__separator" aria-hidden="true" />
          )}
          <div
            className="admin-nav__group"
            role="group"
            aria-label={t(group.titleKey)}
          >
            <span className="admin-nav__group-title">{t(group.titleKey)}</span>
            <div className="admin-nav__group-items">
              {group.links.map((link) => (
                <button
                  key={link.key}
                  className={`admin-nav__item ${pathname === link.key ? 'admin-nav__item--active' : ''}`}
                  onClick={() => router.push(link.key)}
                >
                  <span className="admin-nav__icon">{link.icon}</span>
                  <span className="admin-nav__label">{t(link.labelKey)}</span>
                  <span className="admin-nav__label-short">
                    {t(link.shortKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Fragment>
      ))}
    </nav>
  );
}

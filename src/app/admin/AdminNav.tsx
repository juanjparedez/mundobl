'use client';

import { Fragment, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import {
  AppstoreOutlined,
  TagsOutlined,
  GlobalOutlined,
  UserOutlined,
  UserAddOutlined,
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
  BugOutlined,
  MenuOutlined,
  RightOutlined,
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
        key: '/admin/series/user-submitted',
        icon: <UserAddOutlined />,
        labelKey: 'adminNav.userEmbed',
        shortKey: 'adminNav.userEmbedShort',
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
      {
        key: '/admin/feedback',
        icon: <BugOutlined />,
        labelKey: 'adminNav.feedback',
        shortKey: 'adminNav.feedbackShort',
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Encontrar la entrada activa para mostrar en el trigger mobile.
  // Si ninguna matchea, default al primer item del primer grupo.
  const activeLink = ADMIN_GROUPS.flatMap((g) => g.links).find(
    (l) => pathname === l.key
  );
  const activeLabel = activeLink
    ? t(activeLink.labelKey)
    : t('adminNav.series');

  const handleNavigate = (path: string) => {
    setMobileOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Mobile (<=768px via CSS): trigger compact que abre Drawer con
        * todos los grupos. La nav horizontal de desktop sigue abajo
        * oculta via media query. */}
      <button
        type="button"
        className="admin-nav-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
        aria-label={t('adminNav.ariaLabel')}
      >
        <MenuOutlined className="admin-nav-mobile-trigger__icon" />
        <span className="admin-nav-mobile-trigger__label">
          {activeLabel}
        </span>
        <RightOutlined className="admin-nav-mobile-trigger__chevron" />
      </button>

      <Drawer
        title={t('adminNav.ariaLabel')}
        placement="left"
        width={280}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        className="admin-nav-mobile-drawer"
        styles={{ body: { padding: 0 } }}
      >
        {ADMIN_GROUPS.map((group) => (
          <div key={group.titleKey} className="admin-nav-mobile-group">
            <h4 className="admin-nav-mobile-group__title">
              {t(group.titleKey)}
            </h4>
            <ul className="admin-nav-mobile-group__list">
              {group.links.map((link) => (
                <li key={link.key}>
                  <button
                    type="button"
                    className={`admin-nav-mobile-item${pathname === link.key ? ' admin-nav-mobile-item--active' : ''}`}
                    onClick={() => handleNavigate(link.key)}
                  >
                    <span className="admin-nav-mobile-item__icon" aria-hidden>
                      {link.icon}
                    </span>
                    <span className="admin-nav-mobile-item__label">
                      {t(link.labelKey)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Drawer>

      {/* Desktop (>=769px via CSS): nav horizontal existente */}
      <nav className="admin-nav" aria-label={t('adminNav.ariaLabel')}>
        {ADMIN_GROUPS.map((group, groupIdx) => (
          <Fragment key={group.titleKey}>
            {groupIdx > 0 && (
              <span className="admin-nav__group-gap" aria-hidden="true" />
            )}
            <div
              className="admin-nav__group"
              role="group"
              aria-label={t(group.titleKey)}
              data-group={group.titleKey
                .replace('adminNav.group', '')
                .toLowerCase()}
            >
              {group.links.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  className={`admin-nav__item${pathname === link.key ? ' admin-nav__item--active' : ''}`}
                  onClick={() => router.push(link.key)}
                  title={t(link.labelKey)}
                >
                  <span className="admin-nav__icon" aria-hidden>
                    {link.icon}
                  </span>
                  <span className="admin-nav__label">{t(link.labelKey)}</span>
                  <span className="admin-nav__label-short">
                    {t(link.shortKey)}
                  </span>
                </button>
              ))}
            </div>
          </Fragment>
        ))}
      </nav>
    </>
  );
}

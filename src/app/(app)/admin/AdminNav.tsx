'use client';

import { Fragment, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer } from 'antd';
import {
  ADMIN_DESTINATIONS,
  ADMIN_GROUPS,
  destinationsOf,
} from './adminDestinations';
import { MenuOutlined, RightOutlined } from '@ant-design/icons';
import './admin-nav.css';
import { useLocale } from '@/lib/providers/LocaleProvider';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Encontrar la entrada activa para mostrar en el trigger mobile.
  // Si ninguna matchea, default al primer item del primer grupo.
  const activeLink = ADMIN_DESTINATIONS.find((d) => pathname === d.href);
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
        <span className="admin-nav-mobile-trigger__label">{activeLabel}</span>
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
          <div key={group.id} className="admin-nav-mobile-group">
            <h4 className="admin-nav-mobile-group__title">
              {t(group.titleKey)}
            </h4>
            <ul className="admin-nav-mobile-group__list">
              {destinationsOf(group.id).map((dest) => (
                <li key={dest.id}>
                  <button
                    type="button"
                    className={`admin-nav-mobile-item${pathname === dest.href ? ' admin-nav-mobile-item--active' : ''}`}
                    onClick={() => handleNavigate(dest.href)}
                  >
                    <span className="admin-nav-mobile-item__icon" aria-hidden>
                      {dest.icon}
                    </span>
                    <span className="admin-nav-mobile-item__label">
                      {t(dest.labelKey)}
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
          <Fragment key={group.id}>
            {groupIdx > 0 && (
              <span className="admin-nav__group-gap" aria-hidden="true" />
            )}
            <div
              className="admin-nav__group"
              role="group"
              aria-label={t(group.titleKey)}
              // id estable del registro, no derivado del titulo visible:
              // asi traducir la nav no rompe los acentos por grupo del CSS.
              data-group={group.id}
            >
              {destinationsOf(group.id).map((dest) => (
                <button
                  key={dest.id}
                  type="button"
                  className={`admin-nav__item${pathname === dest.href ? ' admin-nav__item--active' : ''}`}
                  onClick={() => router.push(dest.href)}
                  title={t(dest.labelKey)}
                >
                  <span className="admin-nav__icon" aria-hidden>
                    {dest.icon}
                  </span>
                  <span className="admin-nav__label">{t(dest.labelKey)}</span>
                  <span className="admin-nav__label-short">
                    {t(dest.shortKey)}
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

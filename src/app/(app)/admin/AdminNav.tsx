'use client';

import { startTransition, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Drawer } from 'antd';
import { MenuOutlined, RightOutlined } from '@ant-design/icons';
import { NavigationSections } from '@/components/layout/NavigationSections/NavigationSections';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  ADMIN_DESTINATIONS,
  ADMIN_GROUPS,
  destinationsOf,
} from './adminDestinations';
import './admin-nav.css';

export function AdminNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useLocale();
  const [openSection, setOpenSection] = useState<string | null>(null);
  useEffect(() => {
    startTransition(() => setOpenSection(null));
  }, [pathname]);
  const visible = ADMIN_DESTINATIONS.filter(
    (destination) =>
      (!destination.supportOwnerOnly || session?.user?.canManageSupport) &&
      (!destination.adminOnly || session?.user?.role === 'ADMIN')
  );
  // Prefer the most specific destination when editing a nested resource.
  const active = [...visible]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (destination) =>
        pathname === destination.href ||
        pathname?.startsWith(destination.href + '/')
    );
  const sections = ADMIN_GROUPS.map((group) => ({
    key: group.id,
    label: t(group.titleKey),
    entries: destinationsOf(group.id)
      .filter((destination) => visible.includes(destination))
      .map((destination) => ({
        key: destination.id,
        path: destination.href,
        label: t(destination.labelKey),
        icon: destination.icon,
        active: active?.id === destination.id,
      })),
  })).filter((section) => section.entries.length > 0);
  return (
    <>
      <button
        type="button"
        className="admin-nav-mobile-trigger"
        onClick={() =>
          setOpenSection(active?.groupId ?? sections[0]?.key ?? null)
        }
        aria-haspopup="dialog"
        aria-expanded={openSection !== null}
        aria-label={t('adminNav.ariaLabel')}
      >
        <MenuOutlined />
        <span>{active ? t(active.labelKey) : t('adminNav.ariaLabel')}</span>
        <RightOutlined />
      </button>
      <nav className="admin-nav" aria-label={t('adminNav.ariaLabel')}>
        {sections.map((section) => (
          <button
            type="button"
            key={section.key}
            className="admin-nav__item"
            data-active={active?.groupId === section.key}
            aria-haspopup="dialog"
            aria-expanded={openSection === section.key}
            onClick={() => setOpenSection(section.key)}
          >
            {section.label}
            <RightOutlined aria-hidden="true" />
          </button>
        ))}
      </nav>
      <Drawer
        title={t('adminNav.ariaLabel')}
        placement="left"
        size={380}
        open={openSection !== null}
        onClose={() => setOpenSection(null)}
        destroyOnHidden
        className="navigation-drawer"
      >
        <NavigationSections
          key={openSection}
          sections={sections}
          initialSection={openSection ?? undefined}
          onNavigate={() => setOpenSection(null)}
        />
      </Drawer>
    </>
  );
}

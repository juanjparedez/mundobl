'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
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
    <nav className="admin-nav" aria-label={t('adminNav.ariaLabel')}>
      <NavigationSections key={active?.groupId} sections={sections} />
    </nav>
  );
}

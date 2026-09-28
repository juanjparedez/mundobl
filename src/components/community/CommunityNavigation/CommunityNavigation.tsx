'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './CommunityNavigation.css';
export type CommunityNavigationSection =
  | 'conversations'
  | 'lists'
  | 'mine'
  | 'myTopics'
  | 'profile';
export function CommunityNavigation({
  active,
}: {
  active: CommunityNavigationSection;
}) {
  const { t } = useLocale();
  const { data: session } = useSession();
  const links = [
    {
      key: 'conversations',
      href: '/comunidad',
      label: t('communityHub.conversations'),
    },
    {
      key: 'lists',
      href: '/comunidad/listas',
      label: t('communitySpace.lists'),
    },
    ...(session?.user
      ? [
          {
            key: 'myTopics',
            href: '/comunidad/mis-conversaciones',
            label: t('communitySpace.myTopics'),
          },
          {
            key: 'mine',
            href: '/comunidad/listas?mine=true',
            label: t('communitySpace.myLists'),
          },
          {
            key: 'profile',
            href: '/comunidad/mi-espacio',
            label: t('communitySpace.profile'),
          },
        ]
      : []),
  ];
  return (
    <nav className="community-navigation" aria-label={t('community.title')}>
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          aria-current={active === link.key ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

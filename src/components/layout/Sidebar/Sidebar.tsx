'use client';

import { startTransition, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Avatar, Badge, Drawer, Layout, Menu } from 'antd';
import Link from 'next/link';
import { NavigationSections } from '../NavigationSections/NavigationSections';
import {
  AppstoreOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useHasNovedades } from '@/hooks/useHasNovedades';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import {
  NAV_ITEMS,
  NAV_SECTIONS,
  canSeeNavItem,
  isNavItemActive,
} from '../navItems';
import './Sidebar.css';

const { Sider } = Layout;

export function Sidebar({
  supportVisible = false,
}: {
  supportVisible?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed') === 'true';
      startTransition(() => setCollapsed(saved));
    } catch {
      /* Storage is optional. */
    }
  }, []);
  const changeCollapsed = (value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem('sidebar-collapsed', String(value));
    } catch {
      /* Keep the preference for this render session. */
    }
  };

  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { t } = useLocale();
  const { data: session } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasNovedades = useHasNovedades();

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
      setOpenSection(null);
    });
  }, [pathname]);

  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';
  const isCollaborator = role === 'COLLABORATOR';
  const navContext = { supportVisible, loggedIn: !!session?.user, role };

  // Misma lista que la barra inferior de movil (navItems.ts): lo que se
  // ve aca se ve alla. Los items mobileOnly ya viven en la TopBar.
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.mobileOnly && canSeeNavItem(item, navContext)
  );
  const renderIcon = (item: (typeof NAV_ITEMS)[number]) => {
    const Icon = item.icon;
    return item.badge === 'novedades' ? (
      <Badge dot={hasNovedades} offset={[2, 2]}>
        <Icon />
      </Badge>
    ) : (
      <Icon />
    );
  };
  const sections = NAV_SECTIONS.map((section) => ({
    key: section.key,
    label: t(section.labelKey),
    entries: visibleItems
      .filter((item) => item.section === section.key && !item.primary)
      .map((item) => ({
        key: item.key,
        path: item.path,
        label: t(item.labelKey),
        icon: renderIcon(item),
        active: isNavItemActive(item, pathname),
      })),
  })).filter((section) => section.entries.length > 0);
  const menuItems = [
    ...visibleItems
      .filter((item) => item.primary)
      .map((item) => ({
        key: item.path,
        icon: renderIcon(item),
        label: (
          <Link
            href={item.path}
            prefetch={false}
            aria-current={isNavItemActive(item, pathname) ? 'page' : undefined}
          >
            {t(item.labelKey)}
          </Link>
        ),
      })),
    { type: 'divider' as const },
    ...sections.map((section) => {
      const Icon = NAV_SECTIONS.find(
        (definition) => definition.key === section.key
      )!.icon;
      return {
        key: section.key,
        title: section.label,
        icon: (
          <Badge
            dot={
              hasNovedades &&
              section.entries.some((entry) => entry.key === 'novedades')
            }
          >
            <Icon />
          </Badge>
        ),
        label: <span aria-haspopup="dialog">{section.label}</span>,
        onClick: () => setOpenSection(section.key),
      };
    }),
  ];
  const activeItem = visibleItems.find((item) =>
    isNavItemActive(item, pathname)
  );
  const selectedKey = activeItem
    ? activeItem.primary
      ? activeItem.path
      : activeItem.section
    : '';

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={changeCollapsed}
      className="app-sidebar"
      width={250}
      trigger={null}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <AppstoreOutlined className="sidebar-logo-icon" />
          {!collapsed && <span className="sidebar-logo-text">MundoBL</span>}
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={() => changeCollapsed(!collapsed)}
          aria-label={
            collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')
          }
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />

      <Drawer
        title={t('bottomNav.mainNavigation')}
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
      <div className="sidebar-footer">
        {session?.user ? (
          <button
            className="sidebar-user-block"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <Avatar
              src={session.user.image}
              icon={!session.user.image ? <UserOutlined /> : undefined}
              size={32}
              className="sidebar-user-block__avatar"
            />
            {!collapsed && (
              <>
                <div className="sidebar-user-block__info">
                  <span className="sidebar-user-block__name">
                    {session.user.name ?? t('sidebar.profile')}
                  </span>
                  <span
                    className={`sidebar-user-block__role sidebar-user-block__role--${session.user.role.toLowerCase()}`}
                  >
                    {isAdmin
                      ? t('adminUsers.roleAdmin')
                      : isModerator
                        ? t('adminUsers.roleModerator')
                        : isCollaborator
                          ? t('adminUsers.roleCollaborator')
                          : t('adminUsers.roleVisitor')}
                  </span>
                </div>
                <SettingOutlined
                  className="sidebar-user-block__settings-icon"
                  aria-hidden
                />
              </>
            )}
          </button>
        ) : (
          <button
            className="sidebar-settings-trigger"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('bottomNav.settings')}
            aria-haspopup="dialog"
          >
            <span className="sidebar-settings-trigger__icon" aria-hidden="true">
              <SettingOutlined />
            </span>
            {!collapsed && <span>{t('bottomNav.settings')}</span>}
          </button>
        )}
      </div>

      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </Sider>
  );
}

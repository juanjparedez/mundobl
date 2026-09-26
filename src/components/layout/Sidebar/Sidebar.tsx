'use client';

import { startTransition, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Badge, Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { ROUTES } from '@/constants/navigation';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useHasNovedades } from '@/hooks/useHasNovedades';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import { NAV_ITEMS, NAV_SECTIONS, canSeeNavItem } from '../navItems';
import './Sidebar.css';

const { Sider } = Layout;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const { data: session } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasNovedades = useHasNovedades();

  useEffect(() => {
    startTransition(() => {
      setIsSettingsOpen(false);
    });
  }, [pathname]);

  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN';
  const isModerator = role === 'MODERATOR';
  const isCollaborator = role === 'COLLABORATOR';
  const navContext = { loggedIn: !!session?.user, role };

  // Misma lista que la barra inferior de movil (navItems.ts): lo que se
  // ve aca se ve alla. Los items mobileOnly ya viven en la TopBar.
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.mobileOnly && canSeeNavItem(item, navContext)
  );
  const menuItems = NAV_SECTIONS.map((section) => ({
    type: 'group' as const,
    key: `section-${section.key}`,
    label: t(section.labelKey),
    children: visibleItems
      .filter((item) => item.section === section.key)
      .map((item) => {
        const Icon = item.icon;
        const icon =
          item.badge === 'novedades' ? (
            <Badge dot={hasNovedades} offset={[2, 2]}>
              <Icon />
            </Badge>
          ) : (
            <Icon />
          );
        return {
          key: item.path,
          icon,
          label: t(item.labelKey),
          onClick: () => router.push(item.path),
        };
      }),
  })).filter((group) => group.children.length > 0);

  const selectedKey = pathname || ROUTES.CATALOGO;

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      className="app-sidebar"
      width={250}
      trigger={null}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <AppstoreOutlined style={{ fontSize: '22px' }} />
          {!collapsed && <span className="sidebar-logo-text">MundoBL</span>}
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={
            collapsed ? t('sidebar.expandMenu') : t('sidebar.collapseMenu')
          }
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} />

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

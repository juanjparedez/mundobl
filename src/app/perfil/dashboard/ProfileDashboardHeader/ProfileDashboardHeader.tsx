'use client';

import { useState } from 'react';
import { Avatar, Button, Space, Tag } from 'antd';
import {
  AppstoreAddOutlined,
  CalendarOutlined,
  CheckOutlined,
  EditOutlined,
  LayoutOutlined,
  ReloadOutlined,
  SettingOutlined,
  SlidersOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import type { ProfileData } from '../../types';
import './ProfileDashboardHeader.css';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

export interface ProfileDashboardHeaderProps {
  user: ProfileData['user'];
  /** Callback opcional para abrir el drawer de personalizar. Cuando se
   *  pasa, se renderea un boton extra "Personalizar" que abre el panel
   *  con switches por section. */
  onCustomizeClick?: () => void;
  /** Si presentes, integran los controles del DashboardEditToolbar
   *  directamente al header (toggle edit + add widget + reset).
   *  Cuando editing=true se muestran ademas "Agregar" y "Reset" inline. */
  editing?: boolean;
  onToggleEditing?: () => void;
  onAddWidget?: () => void;
  onResetLayout?: () => void;
}

function formatJoinedDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Header denso del perfil dashboard. Click en "Editar perfil" hace scroll
 *  al footer del dashboard donde vive ProfileSettings. Antes apuntaba a
 *  /perfil/clasico (no hacia nada util mas que recargar). */
export function ProfileDashboardHeader({
  user,
  onCustomizeClick,
  editing = false,
  onToggleEditing,
  onAddWidget,
  onResetLayout,
}: ProfileDashboardHeaderProps) {
  const { t, locale } = useLocale();
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const handleEditClick = () => {
    const target = document.getElementById('mb-profile-settings');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="mb-profile-header" role="banner">
      <Avatar
        src={user.image}
        icon={!user.image ? <UserOutlined /> : undefined}
        // size base para SSR / fallback. CSS sobreescribe via
        // --profile-header-avatar-size segun density.
        size={72}
        className="mb-profile-header__avatar"
      />
      <div className="mb-profile-header__info">
        <h1 className="mb-profile-header__name">{user.name ?? user.email}</h1>
        <p className="mb-profile-header__email">{user.email}</p>
        <div className="mb-profile-header__meta">
          <Tag color={ROLE_COLORS[user.role] ?? 'default'}>{user.role}</Tag>
          <span className="mb-profile-header__joined">
            <CalendarOutlined />
            {t('profile.memberSince')}{' '}
            {formatJoinedDate(user.createdAt, locale)}
          </span>
        </div>
      </div>
      <div className="mb-profile-header__actions">
        <Space size={8} wrap>
          <Button icon={<EditOutlined />} onClick={handleEditClick}>
            {t('profileDashboard.editProfile')}
          </Button>
          {/* Preferencias: abre el SettingsPanel global (theme, accent,
           *  locale, density). Restaurado del OverviewHeader — antes del
           *  refactor a grid se podia abrir desde aca y se habia perdido.
           *  Sigue accesible tambien desde la sidebar. */}
          <Button
            icon={<SlidersOutlined />}
            onClick={() => setPreferencesOpen(true)}
          >
            {t('profileDashboard.preferencesButton')}
          </Button>
          {onCustomizeClick && (
            <Button icon={<SettingOutlined />} onClick={onCustomizeClick}>
              {t('profile.customizeButton')}
            </Button>
          )}
          {/* Controles del dashboard grid integrados al header (en lugar
           *  de toolbar suelto debajo). Cuando editing=true se expanden
           *  con Add + Reset inline. */}
          {onToggleEditing && (
            <Button
              icon={editing ? <CheckOutlined /> : <LayoutOutlined />}
              onClick={onToggleEditing}
              type={editing ? 'primary' : 'default'}
            >
              {editing
                ? t('profileDashboard.editLayoutDone')
                : t('profileDashboard.editLayout')}
            </Button>
          )}
          {editing && onAddWidget && (
            <Button icon={<AppstoreAddOutlined />} onClick={onAddWidget}>
              {t('profileDashboard.addWidget')}
            </Button>
          )}
          {editing && onResetLayout && (
            <Button icon={<ReloadOutlined />} onClick={onResetLayout}>
              {t('profileDashboard.resetLayout')}
            </Button>
          )}
        </Space>
      </div>
      <SettingsPanel
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </header>
  );
}

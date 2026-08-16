'use client';

import { useState } from 'react';
import { Avatar, Button, Segmented, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  SettingOutlined,
  SlidersOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { SettingsPanel } from '@/components/layout/SettingsPanel/SettingsPanel';
import { ClientVersionInfo } from '../../ClientVersionInfo/ClientVersionInfo';
import type { ProfileData } from '../../types';
import './ProfileDashboardHeader.css';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

export type ProfileHeaderMode = 'basic' | 'advanced' | 'admin';

export interface ProfileDashboardHeaderProps {
  user: ProfileData['user'];
  /** Callback opcional para abrir el drawer de personalizar. Cuando se
   *  pasa, se renderea un boton extra "Personalizar" que abre el panel
   *  con switches por section. */
  onCustomizeClick?: () => void;
  /** Mode selector integrado al header (Basic / Advanced / Admin).
   *  Cuando se pasan estas 3 props, se renderea el Segmented en una
   *  sub-row de actions. La opcion 'admin' aparece solo si admin=true. */
  mode?: ProfileHeaderMode;
  onModeChange?: (next: ProfileHeaderMode) => void;
  showAdminMode?: boolean;
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
  mode,
  onModeChange,
  showAdminMode = false,
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
          {/* Version del cliente movida del footer al header (iter
           *  fine_tunning_1 #4) — sigue siendo discreta, util para
           *  reporte de bugs y copy-to-clipboard. */}
          <ClientVersionInfo />
        </div>
      </div>
      <div className="mb-profile-header__actions">
        {/* Primary actions: cosas de la cuenta del user (perfil, prefs).
         *  Visualmente separadas de los controles del dashboard layout
         *  (mode + customize + edit). */}
        <Space size={8} wrap>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEditClick}
          >
            {t('profileDashboard.editProfile')}
          </Button>
          {/* Preferencias: abre el SettingsPanel global (theme, accent,
           *  locale, density). Accesible tambien desde la sidebar. */}
          <Button
            icon={<SlidersOutlined />}
            onClick={() => setPreferencesOpen(true)}
          >
            {t('profileDashboard.preferencesButton')}
          </Button>
        </Space>
        {/* Layout / mode controls. El toggle de edicion de layout
         *  (+ Agregar / Reset) se movio a un FAB flotante que sigue el
         *  scroll (pedido de Flor). Aca quedan mode + Personalizar. */}
        {(mode || onCustomizeClick) && (
          <Space size={8} wrap className="mb-profile-header__layout-actions">
            {mode && onModeChange && (
              <Segmented
                value={mode}
                onChange={(v) => onModeChange(v as ProfileHeaderMode)}
                size="small"
                options={[
                  { label: t('profileMode.basic'), value: 'basic' },
                  { label: t('profileMode.advanced'), value: 'advanced' },
                  ...(showAdminMode
                    ? [{ label: t('profileMode.admin'), value: 'admin' }]
                    : []),
                ]}
              />
            )}
            {onCustomizeClick && (
              <Button
                icon={<SettingOutlined />}
                onClick={onCustomizeClick}
                size="small"
              >
                {t('profile.customizeButton')}
              </Button>
            )}
          </Space>
        )}
      </div>
      <SettingsPanel
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />
    </header>
  );
}

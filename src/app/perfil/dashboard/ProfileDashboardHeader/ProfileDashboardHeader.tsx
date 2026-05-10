'use client';

import { Avatar, Button, Space, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
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
}: ProfileDashboardHeaderProps) {
  const { t, locale } = useLocale();

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
          {onCustomizeClick && (
            <Button icon={<SettingOutlined />} onClick={onCustomizeClick}>
              {t('profile.customizeButton')}
            </Button>
          )}
        </Space>
      </div>
    </header>
  );
}

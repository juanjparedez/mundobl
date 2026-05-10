'use client';

import { Avatar, Button, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
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
export function ProfileDashboardHeader({ user }: ProfileDashboardHeaderProps) {
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
        size={88}
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
        <Button icon={<EditOutlined />} onClick={handleEditClick}>
          {t('profileDashboard.editProfile')}
        </Button>
      </div>
    </header>
  );
}

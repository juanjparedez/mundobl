'use client';

import { Avatar, Button, Tag } from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { ClientVersionInfo } from '../../ClientVersionInfo/ClientVersionInfo';
import type { ProfileData } from '../../types';
import './ProfileDashboardHeader.css';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

export interface ProfileDashboardHeaderProps {
  user: ProfileData['user'];
  /** "Editar perfil": lleva a la pestaña Ajustes. */
  onEditProfile: () => void;
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

/** Header del perfil: identidad y un solo atajo a Ajustes. Lo demas
 *  (apariencia, estadisticas, diseño de paneles) vive en las pestañas. */
export function ProfileDashboardHeader({
  user,
  onEditProfile,
}: ProfileDashboardHeaderProps) {
  const { t, locale } = useLocale();

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
          {/* Version del cliente: discreta, util para reportar bugs. */}
          <ClientVersionInfo />
        </div>
      </div>
      <div className="mb-profile-header__actions">
        <Button type="primary" icon={<EditOutlined />} onClick={onEditProfile}>
          {t('profileDashboard.editProfile')}
        </Button>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
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
  /** Click en "Editar perfil". Apunta al apartado de settings. */
  editHref?: string;
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

/** Header denso del perfil dashboard, alineado al mock:
 *  Avatar + nombre + email + role badge + fecha de alta + boton "Editar perfil".
 *  Vive FUERA del DashboardGrid (no es un widget). */
export function ProfileDashboardHeader({
  user,
  editHref = '/perfil/clasico',
}: ProfileDashboardHeaderProps) {
  const { t, locale } = useLocale();

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
        <Link href={editHref}>
          <Button icon={<EditOutlined />}>
            {t('profileDashboard.editProfile')}
          </Button>
        </Link>
      </div>
    </header>
  );
}

'use client';

import { Avatar, Button } from 'antd';
import {
  CalendarOutlined,
  ControlOutlined,
  EditOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ProfileData } from '../../types';
import './Header.css';

interface Props {
  user: ProfileData['user'];
  onEditClick: () => void;
  onPreferencesClick: () => void;
  onCustomizeClick?: () => void;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERADOR',
  VISITOR: 'USUARIO',
};

/** Header del perfil overview: avatar + nombre + email + rol pill +
 *  botones (Editar perfil + Preferencias). Composicion del style-guide. */
export function OverviewHeader({
  user,
  onEditClick,
  onPreferencesClick,
  onCustomizeClick,
}: Props) {
  const roleLabel = ROLE_LABEL[user.role] ?? 'USUARIO';
  const isAdmin = user.role === 'ADMIN';
  const joinedFormatted = (() => {
    try {
      return new Date(user.createdAt).toLocaleDateString('es', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return user.createdAt;
    }
  })();

  return (
    <header className="overview-header" role="banner">
      <Avatar
        src={user.image}
        icon={!user.image ? <UserOutlined /> : undefined}
        size={56}
        className="overview-header__avatar"
      />
      <div className="overview-header__info">
        <h1 className="overview-header__name">{user.name ?? user.email}</h1>
        <p className="overview-header__email">{user.email}</p>
        <div className="overview-header__meta">
          <span
            className={`overview-header__role-pill overview-header__role-pill--${isAdmin ? 'admin' : 'user'}`}
          >
            {roleLabel}
          </span>
          <span className="overview-header__joined">
            <CalendarOutlined />
            Miembro desde {joinedFormatted}
          </span>
        </div>
      </div>
      <div className="overview-header__actions">
        {onCustomizeClick && (
          <Button
            icon={<ControlOutlined />}
            onClick={onCustomizeClick}
            size="small"
          >
            Personalizar
          </Button>
        )}
        <Button icon={<EditOutlined />} onClick={onEditClick} size="small">
          Editar perfil
        </Button>
        <Button
          icon={<SettingOutlined />}
          onClick={onPreferencesClick}
          size="small"
        >
          Preferencias
        </Button>
      </div>
    </header>
  );
}

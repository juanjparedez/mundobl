'use client';

import Link from 'next/link';
import {
  ThunderboltOutlined,
  CommentOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileSearchOutlined,
  BellOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './QuickAdminActionsWidget.css';

/** Grid de acciones rapidas para admins. Cada accion = card clickable con
 *  icono + label que linkea a la ruta admin correspondiente. Pensado para
 *  vivir al lado del Resumen en el header del perfil admin (style-guide/my-profile.png).
 *
 *  Reusa rutas admin existentes — no crea nada nuevo en backend. */
export function QuickAdminActionsWidget() {
  const { t } = useLocale();

  const actions = [
    {
      icon: <CommentOutlined />,
      label: t('quickAdmin.moderateComments'),
      href: '/admin/comentarios',
      tone: 'gold' as const,
    },
    {
      icon: <AppstoreOutlined />,
      label: t('quickAdmin.manageContent'),
      href: '/admin',
      tone: 'purple' as const,
    },
    {
      icon: <TeamOutlined />,
      label: t('quickAdmin.reviewUsers'),
      href: '/admin/usuarios',
      tone: 'blue' as const,
    },
    {
      icon: <FlagOutlined />,
      label: t('quickAdmin.reports'),
      href: '/admin/feedback',
      tone: 'red' as const,
    },
    {
      icon: <FileSearchOutlined />,
      label: t('quickAdmin.auditLog'),
      href: '/admin/logs',
      tone: 'green' as const,
    },
    {
      icon: <BellOutlined />,
      label: t('quickAdmin.news'),
      href: '/admin/noticias',
      tone: 'gold' as const,
    },
  ];

  return (
    <Widget
      title={t('quickAdmin.title')}
      icon={<ThunderboltOutlined />}
      noPadding
    >
      <div className="mb-quick-admin">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`mb-quick-admin__item mb-quick-admin__item--${a.tone}`}
          >
            <span className="mb-quick-admin__icon">{a.icon}</span>
            <span className="mb-quick-admin__label">{a.label}</span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}

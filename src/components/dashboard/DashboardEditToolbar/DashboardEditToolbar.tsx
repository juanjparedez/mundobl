'use client';

import { Button, Popconfirm, Tooltip } from 'antd';
import {
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './DashboardEditToolbar.css';

export interface DashboardEditToolbarProps {
  /** Si esta en modo edicion. */
  editing: boolean;
  /** Toggle del modo edicion. */
  onToggleEditing: () => void;
  /** Si se provee, muestra el boton "Agregar widget" en modo edicion. */
  onAddWidget?: () => void;
  /** Reset al layout por defecto. Solo visible en modo edicion. */
  onReset?: () => void;
  /** Slot extra a la izquierda (ej: switcher de presets). */
  startContent?: React.ReactNode;
  className?: string;
}

/**
 * Toolbar standalone para gestionar el modo edicion de un DashboardGrid.
 *
 * Pone el boton "Editar layout" / "Listo" para entrar/salir del modo, mas
 * un boton "Agregar widget" y un "Reset" cuando esta editando. La pagina
 * decide donde montar este toolbar (header de la pagina, dentro de un
 * SectionHeader como `actions`, etc).
 */
export function DashboardEditToolbar({
  editing,
  onToggleEditing,
  onAddWidget,
  onReset,
  startContent,
  className,
}: DashboardEditToolbarProps) {
  const { t } = useLocale();

  return (
    <div
      className={`mb-dashboard-edit-toolbar${className ? ` ${className}` : ''}`}
      role="toolbar"
    >
      {startContent && (
        <div className="mb-dashboard-edit-toolbar__start">{startContent}</div>
      )}

      <div className="mb-dashboard-edit-toolbar__actions">
        {editing && onAddWidget && (
          <Tooltip title={t('dashboard.addWidget')}>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={onAddWidget}
            >
              {t('dashboard.addWidget')}
            </Button>
          </Tooltip>
        )}

        {editing && onReset && (
          <Popconfirm
            title={t('dashboard.resetConfirmTitle')}
            description={t('dashboard.resetConfirmDescription')}
            okText={t('dashboard.resetConfirmOk')}
            cancelText={t('dashboard.resetConfirmCancel')}
            okButtonProps={{ danger: true }}
            onConfirm={onReset}
          >
            <Tooltip title={t('dashboard.resetLayout')}>
              <Button type="text" icon={<ReloadOutlined />}>
                {t('dashboard.resetLayout')}
              </Button>
            </Tooltip>
          </Popconfirm>
        )}

        <Button
          type={editing ? 'primary' : 'default'}
          icon={editing ? <CheckOutlined /> : <EditOutlined />}
          onClick={onToggleEditing}
        >
          {editing ? t('dashboard.doneEditing') : t('dashboard.editLayout')}
        </Button>
      </div>
    </div>
  );
}

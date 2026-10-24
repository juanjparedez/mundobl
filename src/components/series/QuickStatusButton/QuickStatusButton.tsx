'use client';

import { Dropdown, Tooltip, type MenuProps } from 'antd';
import {
  BookOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { MouseEvent, KeyboardEvent } from 'react';
import './QuickStatusButton.css';

export type QuickStatusAction = 'QUIERO_VER' | 'VISTA' | 'WATCHING' | 'CLEAR';

interface QuickStatusButtonProps {
  /** Estado actual de la serie para este usuario (o este navegador). */
  status: string | undefined;
  labels: {
    trigger: string;
    wantToWatch: string;
    watching: string;
    watched: string;
    clear: string;
  };
  onAction: (action: QuickStatusAction) => void;
  className?: string;
}

const stop = (event: MouseEvent | KeyboardEvent) => event.stopPropagation();

/**
 * Agregar una serie a la lista desde una tarjeta, sin abrir la ficha: asi
 * quien llega con una lista de otra plataforma carga 20 series en dos
 * minutos. "La estoy viendo" abre la ficha a proposito: ahi se elige por
 * que capitulo va, en vez de dejarla en Viendo con progreso 0.
 */
export function QuickStatusButton({
  status,
  labels,
  onAction,
  className = '',
}: QuickStatusButtonProps) {
  const active = status !== undefined && status !== 'SIN_VER';
  const items: MenuProps['items'] = [
    status !== 'QUIERO_VER'
      ? {
          key: 'QUIERO_VER',
          icon: <BookOutlined />,
          label: labels.wantToWatch,
        }
      : null,
    { key: 'WATCHING', icon: <PlayCircleOutlined />, label: labels.watching },
    status !== 'VISTA'
      ? { key: 'VISTA', icon: <CheckOutlined />, label: labels.watched }
      : null,
    active
      ? { key: 'CLEAR', icon: <CloseCircleOutlined />, label: labels.clear }
      : null,
  ].filter((item) => item !== null);

  return (
    <span onClick={stop} onKeyDown={stop} className="quick-status">
      <Dropdown
        trigger={['click']}
        menu={{
          items,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            onAction(key as QuickStatusAction);
          },
        }}
      >
        <Tooltip title={labels.trigger}>
          <button
            type="button"
            className={`${className} quick-status__btn${
              active ? ' quick-status__btn--active' : ''
            }`}
            aria-label={labels.trigger}
            aria-haspopup="menu"
          >
            {active ? <CheckOutlined /> : <PlusOutlined />}
          </button>
        </Tooltip>
      </Dropdown>
    </span>
  );
}

'use client';

import { Drawer, Switch, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  OVERVIEW_SECTIONS,
  type OverviewSectionKey,
} from './useSectionVisibility';
import './CustomizeDrawer.css';

interface Props {
  open: boolean;
  onClose: () => void;
  isVisible: (key: OverviewSectionKey) => boolean;
  onToggle: (key: OverviewSectionKey) => void;
  onReset: () => void;
}

/** Panel lateral con un switch por seccion del overview. Permite al
 *  user mostrar/ocultar widgets de su perfil sin tocar el grid
 *  configurable de /perfil/dashboard. La preferencia persiste en
 *  localStorage (ver useSectionVisibility). */
export function CustomizeDrawer({
  open,
  onClose,
  isVisible,
  onToggle,
  onReset,
}: Props) {
  return (
    <Drawer
      title="Personalizar mi perfil"
      placement="right"
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 360 } }}
      className="customize-drawer"
    >
      <p className="customize-drawer__hint">
        Mostrá u ocultá los paneles de tu perfil. Tus preferencias se guardan en
        este dispositivo.
      </p>

      <ul className="customize-drawer__list">
        {OVERVIEW_SECTIONS.map((section) => (
          <li key={section.key} className="customize-drawer__item">
            <span className="customize-drawer__label">{section.label}</span>
            <Switch
              size="small"
              checked={isVisible(section.key)}
              onChange={() => onToggle(section.key)}
            />
          </li>
        ))}
      </ul>

      <div className="customize-drawer__footer">
        <Button icon={<ReloadOutlined />} onClick={onReset} size="small" block>
          Restaurar todos
        </Button>
      </div>
    </Drawer>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import { FloatButton } from 'antd';
import {
  AppstoreAddOutlined,
  CheckOutlined,
  LayoutOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  DashboardGrid,
  WidgetPickerDrawer,
  useDashboardLayout,
  type DashboardLayouts,
} from '@/components/dashboard';
import { FloatButtonPortal } from '@/components/common/FloatButtonPortal/FloatButtonPortal';
import { useLocale } from '@/lib/providers/LocaleProvider';
import {
  PROFILE_GRID_TABS,
  PROFILE_TAB_LAYOUT_VERSION,
  widgetsOfTab,
  type ProfileGridTabId,
} from '../profileWidgets';
import './ProfileGridTab.css';

export interface ProfileGridTabProps {
  tab: ProfileGridTabId;
  /** 'user' | 'admin': cada rol guarda su propio layout por pestaña. */
  audience: 'user' | 'admin';
  widgetProps: Record<string, Record<string, unknown>>;
}

/** Una pestaña del perfil con grilla de paneles. Conserva la edicion del
 *  dashboard anterior (mover, agrandar, quitar, sumar y restablecer), pero
 *  acotada a los paneles de esa pestaña y con su propio layout guardado. */
export function ProfileGridTab({
  tab,
  audience,
  widgetProps,
}: ProfileGridTabProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dashboardKey = `profile-${audience}-tab-${tab}-v${PROFILE_TAB_LAYOUT_VERSION}`;
  const { layouts, setLayouts, removeWidget, addWidget, reset, widgetIds } =
    useDashboardLayout(dashboardKey, PROFILE_GRID_TABS[tab]);
  const allowedIds = useMemo(() => widgetsOfTab(tab), [tab]);

  // RGL dispara onLayoutChange tambien por cambios programaticos (breakpoint,
  // montaje). drag/resize solo existen con editing=true, asi que fuera de
  // edicion no se persiste nada.
  const handleLayoutsChange = useCallback(
    (next: DashboardLayouts) => {
      if (editing) setLayouts(next);
    },
    [editing, setLayouts]
  );

  return (
    <>
      <DashboardGrid
        layouts={layouts}
        widgetProps={widgetProps}
        editing={editing}
        onLayoutsChange={handleLayoutsChange}
        onRemoveWidget={removeWidget}
        rowHeight={36}
        gap={10}
      />

      <WidgetPickerDrawer
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addWidget}
        alreadyAdded={widgetIds}
        allowedIds={allowedIds}
      />

      {/* Edicion de layout como FAB: sigue el scroll (pedido de Flor). Fuera
       *  de edicion es un boton; al editar, Agregar / Restablecer / Listo. */}
      <FloatButtonPortal>
        {editing ? (
          <FloatButton.Group
            shape="circle"
            className="mb-profile-grid-tab__fab"
          >
            <FloatButton
              icon={<AppstoreAddOutlined />}
              tooltip={t('profileDashboard.addWidget')}
              aria-label={t('profileDashboard.addWidget')}
              onClick={() => setPickerOpen(true)}
            />
            <FloatButton
              icon={<ReloadOutlined />}
              tooltip={t('profileDashboard.resetLayout')}
              aria-label={t('profileDashboard.resetLayout')}
              onClick={reset}
            />
            <FloatButton
              type="primary"
              icon={<CheckOutlined />}
              tooltip={t('profileDashboard.editLayoutDone')}
              aria-label={t('profileDashboard.editLayoutDone')}
              onClick={() => setEditing(false)}
            />
          </FloatButton.Group>
        ) : (
          <FloatButton
            icon={<LayoutOutlined />}
            tooltip={t('profileDashboard.editLayout')}
            aria-label={t('profileDashboard.editLayout')}
            className="mb-profile-grid-tab__fab"
            onClick={() => setEditing(true)}
          />
        )}
      </FloatButtonPortal>
    </>
  );
}

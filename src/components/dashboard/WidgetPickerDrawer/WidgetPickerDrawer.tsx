'use client';

import { useMemo } from 'react';
import { Drawer, Empty, Tag } from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { ActionCard } from '@/components/design-system';
import { WidgetRegistry } from '../WidgetRegistry/WidgetRegistry';
import type { WidgetCategory, WidgetMode } from '../types';
import type { Role } from '@/generated/prisma';
import './WidgetPickerDrawer.css';

export interface WidgetPickerDrawerProps {
  /** Drawer abierto. */
  open: boolean;
  /** Cierra el drawer (sin agregar nada). */
  onClose: () => void;
  /** Llamado al elegir un widget — recibe id + defaultSize del registry. */
  onPick: (
    id: string,
    size: { w: number; h: number; minW?: number; minH?: number }
  ) => void;
  /** Filtros aplicados al listado del registry. */
  filter?: {
    roles?: Role[];
    mode?: WidgetMode;
    category?: WidgetCategory;
  };
  /** Set opcional de ids permitidos. Si se pasa, solo aparecen widgets
   *  cuyo id este incluido. Usado por /perfil para limitar el picker
   *  segun el modo basico/avanzado/admin. */
  allowedIds?: Set<string>;
  /** Ids de widgets ya presentes en el dashboard (se muestran deshabilitados). */
  alreadyAdded?: string[];
}

export function WidgetPickerDrawer({
  open,
  onClose,
  onPick,
  filter,
  allowedIds,
  alreadyAdded,
}: WidgetPickerDrawerProps) {
  const { t } = useLocale();

  const widgets = useMemo(() => {
    const list = WidgetRegistry.list({
      roles: filter?.roles,
      mode: filter?.mode,
      category: filter?.category,
    });
    if (!allowedIds) return list;
    return list.filter((w) => allowedIds.has(w.id));
  }, [filter?.roles, filter?.mode, filter?.category, allowedIds]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('dashboard.pickerTitle')}
      placement="right"
      width={420}
      className="mb-widget-picker-drawer"
    >
      {widgets.length === 0 ? (
        <Empty description={t('dashboard.pickerEmpty')} />
      ) : (
        <div className="mb-widget-picker-drawer__list">
          {widgets.map((w) => {
            const isAdded = alreadyAdded?.includes(w.id);
            return (
              <ActionCard
                key={w.id}
                icon={isAdded ? <CheckCircleOutlined /> : <PlusOutlined />}
                title={t(w.labelKey)}
                description={
                  isAdded
                    ? t('dashboard.pickerAlreadyAdded')
                    : w.descriptionKey
                      ? t(w.descriptionKey)
                      : undefined
                }
                badge={
                  isAdded ? null : (
                    <Tag color="default" style={{ marginInlineEnd: 0 }}>
                      {w.category}
                    </Tag>
                  )
                }
                onClick={
                  isAdded
                    ? undefined
                    : () => {
                        onPick(w.id, w.defaultSize);
                        onClose();
                      }
                }
                aria-label={t(w.labelKey)}
              />
            );
          })}
        </div>
      )}
    </Drawer>
  );
}

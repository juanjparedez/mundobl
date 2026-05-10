'use client';

import { CloseOutlined, HolderOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useDashboardItem } from '../DashboardItemContext';
import type { WidgetSlotProps } from '../types';
import './Widget.css';

/**
 * Wrapper de cada widget dentro del DashboardGrid.
 *
 * Renderiza un panel con header opcional (icono + titulo + acciones), un
 * drag handle (visible solo en editing) y un boton de remove (solo en
 * editing). El body recibe el contenido del widget.
 *
 * Si esta dentro de un DashboardGrid, el modo edicion + drag handle +
 * onRemove vienen automaticamente via DashboardItemContext. Si se usa
 * standalone (fuera de un grid), se pueden pasar como props.
 *
 * Cero strings hardcodeados — `title` viene traducido desde la pagina.
 * Solo el aria-label del drag/remove usa una clave i18n compartida.
 */
export function Widget({
  title,
  icon,
  actions,
  children,
  noPadding = false,
  fade = false,
  editing: editingProp,
  onRemove: onRemoveProp,
  dragHandleClassName: dragHandleClassNameProp,
}: WidgetSlotProps) {
  const { t } = useLocale();
  const ctx = useDashboardItem();

  // Context wins over props when present.
  const editing = ctx?.editing ?? editingProp ?? false;
  const onRemove = ctx?.onRemove ?? onRemoveProp;
  const dragHandleClassName =
    ctx?.dragHandleClassName ?? dragHandleClassNameProp;

  return (
    <article
      className={`mb-widget${editing ? ' mb-widget--editing' : ''}${fade ? ' mb-widget--fade' : ''}`}
      role="region"
    >
      {(title || editing) && (
        <header className="mb-widget__header">
          {editing && dragHandleClassName && (
            <span
              className={`mb-widget__drag-handle ${dragHandleClassName}`}
              role="presentation"
              aria-label={t('dashboard.dragHandleAria')}
              title={t('dashboard.dragHandleAria')}
            >
              <HolderOutlined aria-hidden />
            </span>
          )}
          {icon && (
            <span className="mb-widget__icon" aria-hidden>
              {icon}
            </span>
          )}
          {title && <h3 className="mb-widget__title">{title}</h3>}
          {(actions || (editing && onRemove)) && (
            <div className="mb-widget__actions">
              {actions}
              {editing && onRemove && (
                <button
                  type="button"
                  className="mb-widget__remove"
                  onClick={onRemove}
                  aria-label={t('dashboard.removeWidgetAria')}
                  title={t('dashboard.removeWidgetAria')}
                >
                  <CloseOutlined aria-hidden />
                </button>
              )}
            </div>
          )}
        </header>
      )}
      <div
        className={`mb-widget__body${noPadding ? ' mb-widget__body--flush' : ''}`}
      >
        {children}
      </div>
    </article>
  );
}

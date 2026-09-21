'use client';

import Link from 'next/link';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useReorderablePrefs } from '@/components/carousel/useReorderablePrefs';
import type { TranslationKey } from '@/i18n/messages';
import {
  ADMIN_GROUPS,
  destinationsOf,
  type AdminDestination,
  type AdminGroupId,
} from '../adminDestinations';
import './AdminShortcuts.css';

export interface AdminShortcutMetric {
  /** Contador principal de la tarjeta (ej. cantidad de series). */
  count?: number;
  /** Pendiente accionable. `labelKey` interpola {count}. */
  alert?: { count: number; labelKey: TranslationKey };
}

export interface AdminShortcutsProps {
  /** Metricas por id de destino. El server las calcula; el registro de
   *  destinos no sabe nada de datos. */
  metrics: Record<string, AdminShortcutMetric | undefined>;
  /** Mismo flag que el grid de widgets. Fuera de edicion las tarjetas son
   *  links normales y no hay ningun handle de arrastre a la vista. */
  editing: boolean;
}

interface CardProps {
  dest: AdminDestination;
  metric?: AdminShortcutMetric;
  editing: boolean;
}

function ShortcutCard({ dest, metric, editing }: CardProps) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dest.id, disabled: !editing });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const body = (
    <>
      <div className="admin-tool-card__head">
        <span className="admin-tool-card__icon" aria-hidden>
          {dest.icon}
        </span>
        {metric?.count !== undefined && (
          <span className="admin-tool-card__count">{metric.count}</span>
        )}
      </div>
      <div className="admin-tool-card__title">{t(dest.labelKey)}</div>
      {metric?.alert && (
        <div className="admin-tool-card__alert">
          {interpolateMessage(t(metric.alert.labelKey), {
            count: metric.alert.count,
          })}
        </div>
      )}
    </>
  );

  // En edicion la tarjeta deja de ser un link: navegar mientras se
  // reordena seria un accidente garantizado.
  if (editing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`admin-tool-card admin-tool-card--editing${
          isDragging ? ' admin-tool-card--dragging' : ''
        }`}
        data-dest={dest.id}
      >
        <button
          type="button"
          className="admin-tool-card__handle"
          aria-label={t('adminShortcuts.dragAria')}
          title={t('adminShortcuts.dragAria')}
          {...attributes}
          {...listeners}
        >
          <HolderOutlined aria-hidden />
        </button>
        {body}
      </div>
    );
  }

  return (
    <Link
      ref={setNodeRef}
      style={style}
      href={dest.href}
      className="admin-tool-card"
      data-dest={dest.id}
    >
      {body}
    </Link>
  );
}

function ShortcutGroup({
  groupId,
  titleKey,
  metrics,
  editing,
}: {
  groupId: AdminGroupId;
  titleKey: TranslationKey;
  metrics: AdminShortcutsProps['metrics'];
  editing: boolean;
}) {
  const { t } = useLocale();
  const pool = destinationsOf(groupId);
  const poolIds = pool.map((d) => d.id);

  // El orden se persiste por grupo: reordenar es intra-grupo, mover una
  // tarjeta a otro grupo romperia la semantica de los grupos.
  // `reconcile` del hook ya cubre el caso de un destino agregado o
  // quitado en un deploy posterior con orden viejo guardado.
  const { order, reorder } = useReorderablePrefs(
    `mb-admin-shortcuts:${groupId}`,
    poolIds
  );

  const sensors = useSensors(
    // distance:8 discrimina tap de arrastre en touch — sin esto, tocar
    // una tarjeta para navegar dispara un drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const byId = new Map(pool.map((d) => [d.id, d]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((d): d is AdminDestination => Boolean(d));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = [...order];
    next.splice(to, 0, ...next.splice(from, 1));
    reorder(next);
  };

  return (
    <section className="admin-shortcuts__section" data-group={groupId}>
      <h2 className="admin-shortcuts__section-title">{t(titleKey)}</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="admin-shortcuts__grid">
            {ordered.map((dest) => (
              <ShortcutCard
                key={dest.id}
                dest={dest}
                metric={metrics[dest.id]}
                editing={editing}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

/**
 * Atajos de /admin, agrupados y reordenables.
 *
 * Los destinos salen del registro unico (`adminDestinations`), el mismo
 * que alimenta la nav — antes eran dos listas separadas que se
 * desincronizaban. Las metricas llegan del Server Component; el orden
 * de cada grupo lo personaliza el usuario y se persiste por localStorage
 * (`useReorderablePrefs`, el mismo hook que usan los carruseles).
 */
export function AdminShortcuts({ metrics, editing }: AdminShortcutsProps) {
  return (
    <>
      {ADMIN_GROUPS.map((group) => (
        <ShortcutGroup
          key={group.id}
          groupId={group.id}
          titleKey={group.titleKey}
          metrics={metrics}
          editing={editing}
        />
      ))}
    </>
  );
}

'use client';

import type { ReactNode } from 'react';
import { Drawer, Switch, Button } from 'antd';
import { ReloadOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ReorderConfigDrawer.css';

export interface ReorderConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Items en su orden de pool original — el caller ya resuelve el label
   *  (t() la clave correspondiente); este componente no sabe de i18n. */
  items: Array<{ id: string; label: ReactNode }>;
  order: string[];
  hidden: Set<string>;
  onReorder: (order: string[]) => void;
  onToggleHidden: (id: string) => void;
  onReset: () => void;
  title: ReactNode;
  hint: ReactNode;
  resetLabel: ReactNode;
  dragHandleAria: string;
}

interface SortableRowProps {
  id: string;
  label: ReactNode;
  visible: boolean;
  dragHandleAria: string;
  onToggle: () => void;
}

function SortableRow({
  id,
  label,
  visible,
  dragHandleAria,
  onToggle,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="reorder-config-drawer__item">
      <span
        className="reorder-config-drawer__handle"
        aria-label={dragHandleAria}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </span>
      <span className="reorder-config-drawer__label">{label}</span>
      <Switch size="small" checked={visible} onChange={onToggle} />
    </li>
  );
}

/** Panel lateral generico para reordenar/ocultar un set de items (drag
 *  handle por fila via @dnd-kit + Switch de visibilidad + reset) —
 *  mismo patron que CustomizeDrawer (perfil), generalizado para que lo
 *  use cualquier feature con un pool de items configurable (hoy: el
 *  carrusel de /catalogo y el de /ver, cada uno con su propio
 *  storageKey/pool via useReorderablePrefs). No conoce nada de la
 *  forma de los items ni de i18n — todo texto llega resuelto por props. */
export function ReorderConfigDrawer({
  open,
  onClose,
  items,
  order,
  hidden,
  onReorder,
  onToggleHidden,
  onReset,
  title,
  hint,
  resetLabel,
  dragHandleAria,
}: ReorderConfigDrawerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const labelById = new Map(items.map((it) => [it.id, it.label]));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <Drawer
      title={title}
      placement="right"
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 360 } }}
      className="reorder-config-drawer"
    >
      <p className="reorder-config-drawer__hint">{hint}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="reorder-config-drawer__list">
            {order.map((id) => (
              <SortableRow
                key={id}
                id={id}
                label={labelById.get(id) ?? id}
                visible={!hidden.has(id)}
                dragHandleAria={dragHandleAria}
                onToggle={() => onToggleHidden(id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="reorder-config-drawer__footer">
        <Button icon={<ReloadOutlined />} onClick={onReset} size="small" block>
          {resetLabel}
        </Button>
      </div>
    </Drawer>
  );
}

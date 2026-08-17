'use client';

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
import { useLocale } from '@/lib/providers/LocaleProvider';
import { CATALOG_CAROUSEL_CATEGORIES } from '../catalogCarouselCategories';
import './CarouselConfigDrawer.css';

interface CarouselConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  order: string[];
  hidden: Set<string>;
  onReorder: (order: string[]) => void;
  onToggleHidden: (id: string) => void;
  onReset: () => void;
}

interface SortableRowProps {
  id: string;
  label: string;
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
    <li ref={setNodeRef} style={style} className="carousel-config-drawer__item">
      <span
        className="carousel-config-drawer__handle"
        aria-label={dragHandleAria}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </span>
      <span className="carousel-config-drawer__label">{label}</span>
      <Switch size="small" checked={visible} onChange={onToggle} />
    </li>
  );
}

/** Panel lateral para reordenar/ocultar las categorias del carrusel de
 *  /catalogo — mismo patron que CustomizeDrawer (perfil), con drag
 *  handle por fila (@dnd-kit) para el reordenamiento. */
export function CarouselConfigDrawer({
  open,
  onClose,
  order,
  hidden,
  onReorder,
  onToggleHidden,
  onReset,
}: CarouselConfigDrawerProps) {
  const { t } = useLocale();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const labelById = new Map(
    CATALOG_CAROUSEL_CATEGORIES.map((c) => [c.id, t(c.labelKey)])
  );

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
      title={t('catalogCarousel.drawerTitle')}
      placement="right"
      open={open}
      onClose={onClose}
      styles={{ wrapper: { width: 360 } }}
      className="carousel-config-drawer"
    >
      <p className="carousel-config-drawer__hint">
        {t('catalogCarousel.drawerHint')}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="carousel-config-drawer__list">
            {order.map((id) => (
              <SortableRow
                key={id}
                id={id}
                label={labelById.get(id) ?? id}
                visible={!hidden.has(id)}
                dragHandleAria={t('catalogCarousel.dragHandleAria')}
                onToggle={() => onToggleHidden(id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="carousel-config-drawer__footer">
        <Button icon={<ReloadOutlined />} onClick={onReset} size="small" block>
          {t('catalogCarousel.resetButton')}
        </Button>
      </div>
    </Drawer>
  );
}

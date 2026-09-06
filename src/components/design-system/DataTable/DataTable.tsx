'use client';

import { useMemo, useState, type Key, type ReactNode } from 'react';
import { Table, Pagination, Checkbox, Button } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import type { ColumnType, TablePaginationConfig } from 'antd/es/table';
import type {
  TableRowSelection,
  ExpandableConfig,
} from 'antd/es/table/interface';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { EmptyState } from '../EmptyState/EmptyState';
import './DataTable.css';

/**
 * Rol de una columna cuando la tabla colapsa a tarjetas en mobile.
 *
 * - `title`   → encabezado de la tarjeta (una por tarjeta; si hay varias,
 *               se apilan arriba).
 * - `meta`    → fila de chips/badges debajo del titulo, sin etiqueta.
 * - `body`    → par etiqueta/valor en el cuerpo (default).
 * - `actions` → se ancla al pie de la tarjeta, sin etiqueta.
 * - `hidden`  → no se muestra en mobile (ruido de escritorio).
 */
export type DataTableColumnRole =
  | 'title'
  | 'meta'
  | 'body'
  | 'actions'
  | 'hidden';

export type DataTableColumn<T> = ColumnType<T> & {
  /** Rol en la tarjeta mobile. Default: `'body'`. */
  mobile?: DataTableColumnRole;
};

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  dataSource: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  /** Estado vacio. Ya traducido por la pagina. */
  empty?: ReactNode;
  /** Cuantas filas por pagina. Default 20. `false` desactiva la paginacion. */
  pageSize?: number | false;
  /** Texto del total, ya traducido. Recibe total y rango visible. */
  showTotal?: TablePaginationConfig['showTotal'];
  /** Opciones del selector de tamanio de pagina. Default 10/20/50/100. */
  pageSizeOptions?: string[];
  /**
   * Paginacion controlada (server-side). Al pasar `total`, DataTable deja
   * de paginar localmente: asume que `dataSource` ya es la pagina actual y
   * delega el cambio de pagina en `onPageChange`.
   */
  page?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  /** Ancho minimo de la tabla en escritorio. Default `'max-content'`. */
  scrollX?: number | 'max-content';
  /** Alto maximo con scroll propio (listas largas dentro de un drawer o
   *  modal). Aplica tanto a la tabla como a la lista de tarjetas. */
  scrollY?: number | string;
  /**
   * Tablas de pocas columnas que ya entran en un telefono no necesitan
   * colapsar: con esto se mantiene la tabla en todos los tamanios.
   */
  disableMobileCards?: boolean;
  /** Breakpoint del colapso. Default: el de tablet del proyecto (768px). */
  mobileQuery?: string;
  /**
   * Seleccion multiple. En escritorio se pasa tal cual a AntD; en modo
   * tarjetas se dibuja un checkbox en la cabecera de cada tarjeta, para
   * que flujos como "fusionar tags/generos" sigan siendo usables en
   * telefono y no solo en escritorio.
   */
  rowSelection?: TableRowSelection<T>;
  /** Fila expandible. En modo tarjetas es un toggle dentro de la tarjeta. */
  expandable?: ExpandableConfig<T>;
  /** aria-label del boton de expandir, ya traducido por la pagina. */
  expandAriaLabel?: string;
  /** Clase por fila. En modo tarjetas se aplica a la tarjeta. */
  rowClassName?: (record: T, index: number) => string;
  onRowClick?: (record: T) => void;
  className?: string;
  /** Tamanio de los controles, alineado con la densidad de la app. */
  size?: 'small' | 'middle' | 'large';
}

/**
 * Lee el valor crudo de una celda respetando `dataIndex` simple o anidado.
 *
 * `dataIndex` se toma como `unknown` a proposito: el tipo real de AntD es
 * `DataIndex<T>`, que incluye `DeepNamePath<T>` — un tipo recursivo que,
 * indexado sobre un generico sin resolver, hace explotar el chequeo de
 * tipos (tsc se queda sin heap). Aca alcanza con validar en runtime.
 */
function readCell(record: unknown, dataIndex: unknown): unknown {
  if (dataIndex === undefined || dataIndex === null) return undefined;
  const path: unknown[] = Array.isArray(dataIndex) ? dataIndex : [dataIndex];
  let current: unknown = record;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof key !== 'string' && typeof key !== 'number') return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/**
 * Resuelve el contenido visible de una celda reutilizando el `render` que
 * la columna ya define, para que la tarjeta mobile y la fila de escritorio
 * nunca se desincronicen.
 */
function renderCell<T>(
  column: DataTableColumn<T>,
  record: T,
  index: number
): ReactNode {
  const raw = readCell(record, column.dataIndex);
  if (typeof column.render === 'function') {
    const out = column.render(raw, record, index);
    // AntD permite devolver { children, props } para spans de celda.
    if (out && typeof out === 'object' && 'children' in out) {
      return (out as { children: ReactNode }).children;
    }
    return out as ReactNode;
  }
  if (raw === null || raw === undefined || raw === '') return null;
  return raw as ReactNode;
}

function resolveKey<T>(
  record: T,
  rowKey: DataTableProps<T>['rowKey'],
  index: number
): string {
  if (typeof rowKey === 'function') return rowKey(record);
  const value = record[rowKey];
  return value === undefined || value === null ? String(index) : String(value);
}

/**
 * Tabla del design system.
 *
 * En escritorio es una `Table` de AntD comun. Por debajo del breakpoint
 * de tablet colapsa a una lista de tarjetas, para que las tablas anchas
 * dejen de resolverse con scroll horizontal — que es el modo en que hoy
 * se rompen en telefono, el principal dispositivo de consumo del sitio.
 *
 * Las columnas se declaran UNA sola vez: la tarjeta reutiliza el mismo
 * `render` y solo lee el hint `mobile` para saber donde ubicar cada dato.
 */
export function DataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  empty,
  pageSize = 20,
  showTotal,
  pageSizeOptions = ['10', '20', '50', '100'],
  page: controlledPage,
  total: controlledTotal,
  onPageChange,
  scrollX = 'max-content',
  scrollY,
  disableMobileCards = false,
  mobileQuery = '(max-width: 768px)',
  rowSelection,
  expandable,
  expandAriaLabel,
  rowClassName,
  onRowClick,
  className,
  size,
}: DataTableProps<T>) {
  const isMobile = useMediaQuery(mobileQuery);
  const useCards = isMobile && !disableMobileCards;
  const [localPage, setLocalPage] = useState(1);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // Con `total` la paginacion la maneja la pagina (server-side); sin el,
  // DataTable pagina la lista que recibe.
  const isControlled = controlledTotal !== undefined;
  const page = isControlled ? (controlledPage ?? 1) : localPage;
  const setPage = (next: number) => {
    if (isControlled) onPageChange?.(next, perPage);
    else setLocalPage(next);
  };

  const perPage = pageSize === false ? dataSource.length : pageSize;
  const rowTotal = controlledTotal ?? dataSource.length;
  const pageCount =
    perPage > 0 ? Math.max(1, Math.ceil(rowTotal / perPage)) : 1;
  // Al filtrar, la pagina guardada puede quedar fuera de rango: se clampea
  // al renderizar en vez de corregir el estado desde un efecto, que
  // dispararia un render en cascada.
  const safePage = Math.min(page, pageCount);

  const grouped = useMemo(() => {
    const titles: DataTableColumn<T>[] = [];
    const metas: DataTableColumn<T>[] = [];
    const bodies: DataTableColumn<T>[] = [];
    const actions: DataTableColumn<T>[] = [];

    // El hint `mobile` es opcional: sin el, se infiere un layout razonable
    // (primera columna = titulo, columna de acciones al pie, resto en el
    // cuerpo). Asi migrar una tabla no obliga a anotar cada columna, y las
    // paginas refinan solo donde el default no alcanza.
    let titleTaken = columns.some((col) => col.mobile === 'title');

    columns.forEach((col) => {
      let role = col.mobile;
      if (!role) {
        const id = String(col.key ?? col.dataIndex ?? '').toLowerCase();
        if (/^(actions|acciones|action)$/.test(id)) {
          role = 'actions';
        } else if (!titleTaken) {
          role = 'title';
          titleTaken = true;
        } else {
          role = 'body';
        }
      }

      switch (role) {
        case 'title':
          titles.push(col);
          break;
        case 'meta':
          metas.push(col);
          break;
        case 'actions':
          actions.push(col);
          break;
        case 'hidden':
          break;
        default:
          bodies.push(col);
      }
    });
    return { titles, metas, bodies, actions };
  }, [columns]);

  const paginationConfig: TablePaginationConfig | false =
    pageSize === false
      ? false
      : {
          pageSize,
          showSizeChanger: true,
          pageSizeOptions,
          showTotal,
          ...(isControlled
            ? {
                current: page,
                total: controlledTotal,
                onChange: onPageChange,
              }
            : {}),
        };

  if (!useCards) {
    return (
      <Table<T>
        className={className}
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey as string | ((record: T) => string)}
        loading={loading}
        size={size}
        pagination={paginationConfig}
        rowSelection={rowSelection}
        expandable={expandable}
        rowClassName={rowClassName}
        scroll={{ x: scrollX, y: scrollY }}
        locale={empty ? { emptyText: empty } : undefined}
        onRow={
          onRowClick
            ? (record) => ({ onClick: () => onRowClick(record) })
            : undefined
        }
      />
    );
  }

  if (!loading && dataSource.length === 0) {
    return (
      <div className={className}>
        {empty ?? <EmptyState title="" fullHeight={false} />}
      </div>
    );
  }

  // Seleccion en modo tarjetas: se replica el contrato de AntD para que la
  // pagina no tenga que distinguir entre tarjeta y tabla.
  const selectedKeys = (rowSelection?.selectedRowKeys ?? []).map(String);

  const toggleSelection = (record: T, key: string, checked: boolean) => {
    if (!rowSelection?.onChange) return;
    const current = rowSelection.selectedRowKeys ?? [];
    const nextKeys: Key[] = checked
      ? [...current, key]
      : current.filter((k) => String(k) !== key);
    const nextRows = dataSource.filter((row, i) =>
      nextKeys.map(String).includes(resolveKey(row, rowKey, i))
    );
    rowSelection.onChange(nextKeys, nextRows, { type: 'single' });
  };

  const toggleExpanded = (key: string, record: T) => {
    const isOpen = expandedKeys.includes(key);
    setExpandedKeys((prev) =>
      isOpen ? prev.filter((k) => k !== key) : [...prev, key]
    );
    expandable?.onExpand?.(!isOpen, record);
  };

  // Si la paginacion es controlada, `dataSource` YA es la pagina actual.
  const visible =
    pageSize === false || isControlled
      ? dataSource
      : dataSource.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className={['mb-data-table', className].filter(Boolean).join(' ')}>
      <ul
        className="mb-data-table__cards"
        aria-busy={loading}
        style={
          scrollY === undefined
            ? undefined
            : { maxHeight: scrollY, overflowY: 'auto' }
        }
      >
        {visible.map((record, index) => {
          const key = resolveKey(record, rowKey, index);
          const titleNodes = grouped.titles.map((col) =>
            renderCell(col, record, index)
          );
          const metaNodes = grouped.metas
            .map((col) => renderCell(col, record, index))
            .filter(Boolean);
          const bodyRows = grouped.bodies
            .map((col) => ({ col, node: renderCell(col, record, index) }))
            .filter((row) => row.node !== null && row.node !== undefined);
          const actionNodes = grouped.actions.map((col) =>
            renderCell(col, record, index)
          );

          const isSelected = selectedKeys.includes(key);
          const isExpanded = expandedKeys.includes(key);
          const canExpand =
            !!expandable?.expandedRowRender &&
            (expandable.rowExpandable?.(record) ?? true);

          return (
            <li
              key={key}
              className={[
                'mb-data-table__card',
                isSelected ? 'mb-data-table__card--selected' : '',
                rowClassName?.(record, index) ?? '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {rowSelection && (
                <Checkbox
                  className="mb-data-table__card-check"
                  checked={isSelected}
                  {...rowSelection.getCheckboxProps?.(record)}
                  onChange={(e) =>
                    toggleSelection(record, key, e.target.checked)
                  }
                />
              )}
              {onRowClick ? (
                <button
                  type="button"
                  className="mb-data-table__card-hit"
                  onClick={() => onRowClick(record)}
                >
                  <span className="mb-data-table__card-title">
                    {titleNodes}
                  </span>
                </button>
              ) : (
                titleNodes.length > 0 && (
                  <div className="mb-data-table__card-title">{titleNodes}</div>
                )
              )}

              {metaNodes.length > 0 && (
                <div className="mb-data-table__card-meta">{metaNodes}</div>
              )}

              {bodyRows.length > 0 && (
                <dl className="mb-data-table__card-body">
                  {bodyRows.map((row) => (
                    <div
                      key={String(row.col.key ?? row.col.title)}
                      className="mb-data-table__card-row"
                    >
                      <dt className="mb-data-table__card-label">
                        {row.col.title as ReactNode}
                      </dt>
                      <dd className="mb-data-table__card-value">{row.node}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {canExpand && (
                <div className="mb-data-table__card-expand">
                  <Button
                    type="text"
                    size="small"
                    aria-expanded={isExpanded}
                    aria-label={expandAriaLabel}
                    icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
                    onClick={() => toggleExpanded(key, record)}
                  />
                </div>
              )}

              {canExpand && isExpanded && (
                <div className="mb-data-table__card-expanded">
                  {expandable?.expandedRowRender?.(record, index, 0, true)}
                </div>
              )}

              {actionNodes.length > 0 && (
                <div className="mb-data-table__card-actions">{actionNodes}</div>
              )}
            </li>
          );
        })}
      </ul>

      {pageSize !== false && (
        <div className="mb-data-table__pagination">
          <Pagination
            current={safePage}
            onChange={setPage}
            total={rowTotal}
            pageSize={perPage}
            showSizeChanger={false}
            showTotal={showTotal}
            size="small"
            hideOnSinglePage
          />
        </div>
      )}
    </div>
  );
}

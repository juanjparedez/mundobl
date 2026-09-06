import Link from 'next/link';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import './PeoplePagination.css';

export interface PeoplePaginationProps {
  page: number;
  totalPages: number;
  /** Hrefs ya construidos en el servidor, preservando los filtros activos.
   *  Se pasan armados (y no una funcion) porque este componente se renderiza
   *  desde un client component y las funciones no cruzan el limite RSC. */
  prevHref: string;
  nextHref: string;
  prevLabel: string;
  nextLabel: string;
  /** Ya interpolado: "Pagina 2 de 25". */
  indicatorLabel: string;
}

/**
 * Paginacion con `<Link>` reales (no botones): son navegables con el teclado,
 * se pueden abrir en pestaña nueva y las sigue un crawler — que es como se
 * descubren las fichas de personas, hoy huerfanas del grafo interno de links.
 */
export function PeoplePagination({
  page,
  totalPages,
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
  indicatorLabel,
}: PeoplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="people-pagination" aria-label={indicatorLabel}>
      {page > 1 ? (
        <Link
          href={prevHref}
          prefetch={false}
          className="people-pagination__link"
          rel="prev"
        >
          <LeftOutlined /> {prevLabel}
        </Link>
      ) : (
        <span className="people-pagination__link people-pagination__link--disabled">
          <LeftOutlined /> {prevLabel}
        </span>
      )}

      <span className="people-pagination__indicator">{indicatorLabel}</span>

      {page < totalPages ? (
        <Link
          href={nextHref}
          prefetch={false}
          className="people-pagination__link"
          rel="next"
        >
          {nextLabel} <RightOutlined />
        </Link>
      ) : (
        <span className="people-pagination__link people-pagination__link--disabled">
          {nextLabel} <RightOutlined />
        </span>
      )}
    </nav>
  );
}

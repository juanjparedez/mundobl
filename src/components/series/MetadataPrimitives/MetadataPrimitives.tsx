'use client';

import { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tag } from 'antd';
import './MetadataPrimitives.css';

export type CatalogFilterParam =
  | 'country'
  | 'type'
  | 'format'
  | 'genre'
  | 'language'
  | 'productionCompany'
  | 'director'
  | 'actor'
  | 'tag'
  | 'year';

function buildCatalogHref(
  param: CatalogFilterParam,
  value: string | number
): string {
  const search = new URLSearchParams({ [param]: String(value) });
  return `/catalogo?${search.toString()}`;
}

interface MetadataChipProps {
  filter: CatalogFilterParam;
  value: string | number;
  label?: ReactNode;
  color?: string;
  icon?: ReactNode;
}

/**
 * Chip que navega al catálogo con un filtro pre-aplicado.
 * Es un Ant Tag con onClick — preserva el wrapping/margen nativo
 * y no rompe el flow al envolverlo en un Link.
 */
export function MetadataChip({
  filter,
  value,
  label,
  color,
  icon,
}: MetadataChipProps) {
  const router = useRouter();
  const href = buildCatalogHref(filter, value);

  const handleClick = (e: MouseEvent<HTMLSpanElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    router.push(href);
  };

  return (
    <Tag
      color={color}
      icon={icon}
      className="metadata-chip"
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {label ?? value}
    </Tag>
  );
}

interface MetadataLinkProps {
  filter: CatalogFilterParam;
  value: string | number;
  children: ReactNode;
}

export function MetadataLink({ filter, value, children }: MetadataLinkProps) {
  return (
    <Link href={buildCatalogHref(filter, value)} className="metadata-link">
      {children}
    </Link>
  );
}

interface MetadataChipListProps {
  filter: CatalogFilterParam;
  items: Array<{
    key: string | number;
    value: string | number;
    label?: ReactNode;
    color?: string;
    icon?: ReactNode;
  }>;
}

export function MetadataChipList({ filter, items }: MetadataChipListProps) {
  return (
    <>
      {items.map((item) => (
        <MetadataChip
          key={item.key}
          filter={filter}
          value={item.value}
          label={item.label}
          color={item.color}
          icon={item.icon}
        />
      ))}
    </>
  );
}

interface MetadataLinkListProps {
  filter: CatalogFilterParam;
  items: Array<{
    key: string | number;
    value: string | number;
    label: ReactNode;
  }>;
  separator?: string;
}

export function MetadataLinkList({
  filter,
  items,
  separator = ', ',
}: MetadataLinkListProps) {
  return (
    <>
      {items.map((item, index) => (
        <span key={item.key}>
          <MetadataLink filter={filter} value={item.value}>
            {item.label}
          </MetadataLink>
          {index < items.length - 1 && separator}
        </span>
      ))}
    </>
  );
}

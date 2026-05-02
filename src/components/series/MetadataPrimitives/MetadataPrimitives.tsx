'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
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

export function MetadataChip({
  filter,
  value,
  label,
  color,
  icon,
}: MetadataChipProps) {
  return (
    <Link
      href={buildCatalogHref(filter, value)}
      className="metadata-chip"
      aria-label={`Filtrar catálogo por ${filter}: ${label ?? value}`}
    >
      <Tag color={color} icon={icon} className="metadata-chip__tag">
        {label ?? value}
      </Tag>
    </Link>
  );
}

interface MetadataLinkProps {
  filter: CatalogFilterParam;
  value: string | number;
  children: ReactNode;
}

export function MetadataLink({ filter, value, children }: MetadataLinkProps) {
  return (
    <Link
      href={buildCatalogHref(filter, value)}
      className="metadata-link"
      aria-label={`Filtrar catálogo por ${filter}: ${children}`}
    >
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
    <span className="metadata-chip-list">
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
    </span>
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
    <span className="metadata-link-list">
      {items.map((item, index) => (
        <span key={item.key}>
          <MetadataLink filter={filter} value={item.value}>
            {item.label}
          </MetadataLink>
          {index < items.length - 1 && separator}
        </span>
      ))}
    </span>
  );
}

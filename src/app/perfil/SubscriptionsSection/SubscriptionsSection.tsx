'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Empty, Input, Popconfirm, Spin, Tooltip } from 'antd';
import {
  BellFilled,
  BellOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { CountryFlag } from '@/components/common/CountryFlag/CountryFlag';
import { useMessage } from '@/hooks/useMessage';
import { isSupabaseImageUrl } from '@/lib/image-helpers';
import './SubscriptionsSection.css';

interface SubscriptionItem {
  subscriptionId: number;
  subscribedAt: string;
  series: {
    id: number;
    title: string;
    imageUrl: string | null;
    imagePosition: string | null;
    year: number | null;
    type: string;
    country: { name: string; code: string | null } | null;
  };
  lastActivityAt: string | null;
}

function relativeTime(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 1) return 'recien';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.round(h / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  return new Date(iso).toLocaleDateString();
}

export function SubscriptionsSection() {
  const message = useMessage();
  const [items, setItems] = useState<SubscriptionItem[] | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/series/subscribed');
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data: { items: SubscriptionItem[] } = await res.json();
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUnsubscribe = async (item: SubscriptionItem) => {
    setUnsubscribingId(item.series.id);
    // Optimistic
    setItems((prev) =>
      prev ? prev.filter((x) => x.series.id !== item.series.id) : prev
    );
    try {
      const res = await fetch(`/api/series/${item.series.id}/subscribe`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('failed');
      message.success(`Te desuscribiste de ${item.series.title}`);
    } catch {
      message.error('No pudimos actualizar la suscripcion. Reintentando…');
      void refresh();
    } finally {
      setUnsubscribingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => x.series.title.toLowerCase().includes(q));
  }, [items, search]);

  if (items === null) {
    return (
      <div className="subscriptions-section__loading">
        <Spin />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        image={<BellOutlined className="subscriptions-section__empty-icon" />}
        description="No estas suscrito a ninguna serie todavia"
      >
        <span className="subscriptions-section__hint">
          Tocá la campana en cualquier ficha de serie para empezar a recibir
          avisos.
        </span>
      </Empty>
    );
  }

  return (
    <div className="subscriptions-section">
      <div className="subscriptions-section__toolbar">
        <span className="subscriptions-section__count">
          <BellFilled /> {items.length} suscripcion
          {items.length === 1 ? '' : 'es'}
        </span>
        {items.length > 6 && (
          <Input.Search
            placeholder="Buscar por titulo"
            allowClear
            onChange={(e) => setSearch(e.target.value)}
            className="subscriptions-section__search"
            size="small"
          />
        )}
      </div>

      {filtered && filtered.length === 0 ? (
        <Empty description="No hay coincidencias para tu busqueda" />
      ) : (
        <ul className="subscriptions-list">
          {filtered?.map((item) => (
            <li key={item.subscriptionId} className="subscription-card">
              <Link
                href={`/series/${item.series.id}`}
                className="subscription-card__link"
                prefetch={false}
              >
                <div className="subscription-card__cover">
                  {item.series.imageUrl ? (
                    <Image
                      src={item.series.imageUrl}
                      alt=""
                      fill
                      sizes="80px"
                      quality={50}
                      unoptimized={isSupabaseImageUrl(item.series.imageUrl)}
                      style={{
                        objectFit: 'cover',
                        objectPosition: item.series.imagePosition ?? 'center',
                      }}
                    />
                  ) : (
                    <div className="subscription-card__cover-placeholder">
                      <PlayCircleOutlined />
                    </div>
                  )}
                </div>
                <div className="subscription-card__body">
                  <span className="subscription-card__title">
                    {item.series.title}
                  </span>
                  <div className="subscription-card__meta">
                    {item.series.country && (
                      <span>
                        <CountryFlag
                          code={item.series.country.code}
                          size="small"
                        />{' '}
                        {item.series.country.name}
                      </span>
                    )}
                    {item.series.year && <span>{item.series.year}</span>}
                  </div>
                  <span className="subscription-card__activity">
                    <ClockCircleOutlined />
                    {item.lastActivityAt
                      ? `ultima novedad ${relativeTime(item.lastActivityAt, '')}`
                      : `suscrito ${relativeTime(item.subscribedAt, 'recien')}`}
                  </span>
                </div>
              </Link>
              <Tooltip title="Cancelar suscripcion">
                <Popconfirm
                  title={`Dejar de seguir "${item.series.title}"?`}
                  description="No vas a recibir mas avisos sobre esta serie."
                  okText="Cancelar suscripcion"
                  cancelText="Volver"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleUnsubscribe(item)}
                >
                  <Button
                    type="text"
                    icon={<BellFilled />}
                    loading={unsubscribingId === item.series.id}
                    className="subscription-card__unsub"
                    aria-label="Cancelar suscripcion"
                  />
                </Popconfirm>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

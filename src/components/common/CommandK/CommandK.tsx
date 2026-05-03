'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Empty, Spin } from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UserOutlined,
  VideoCameraOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './CommandK.css';

interface SearchResults {
  series: Array<{
    id: number;
    title: string;
    year: number | null;
    type: string;
  }>;
  actors: Array<{ id: number; name: string }>;
  directors: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string; category: string | null }>;
}

interface FlatItem {
  key: string;
  group: 'series' | 'actors' | 'directors' | 'tags';
  label: string;
  hint?: string;
  href: string;
}

const EMPTY_RESULTS: SearchResults = {
  series: [],
  actors: [],
  directors: [],
  tags: [],
};

function flatten(results: SearchResults): FlatItem[] {
  const items: FlatItem[] = [];
  results.series.forEach((s) =>
    items.push({
      key: `s:${s.id}`,
      group: 'series',
      label: s.title,
      hint: [s.year, s.type].filter(Boolean).join(' · '),
      href: `/series/${s.id}`,
    })
  );
  results.actors.forEach((a) =>
    items.push({
      key: `a:${a.id}`,
      group: 'actors',
      label: a.name,
      href: `/actores/${a.id}`,
    })
  );
  results.directors.forEach((d) =>
    items.push({
      key: `d:${d.id}`,
      group: 'directors',
      label: d.name,
      href: `/directores/${d.id}`,
    })
  );
  results.tags.forEach((t) =>
    items.push({
      key: `t:${t.id}`,
      group: 'tags',
      label: t.name,
      hint: t.category ?? undefined,
      href: `/tags/${t.id}`,
    })
  );
  return items;
}

const GROUP_ICONS = {
  series: <AppstoreOutlined />,
  actors: <UserOutlined />,
  directors: <VideoCameraOutlined />,
  tags: <TagsOutlined />,
};

export function CommandK() {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastReqIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = flatten(results);

  // Toggle global con Cmd/Ctrl+K (y "/" si el foco no está en input).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (e.key === '/' && !isTyping && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Reset al cerrar / focus al abrir
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY_RESULTS);
      setActiveIndex(0);
      return;
    }
    // un microtask después para que el Modal monte el input
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  // Debounce + fetch
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      startTransition(() => {
        setResults(EMPTY_RESULTS);
        setLoading(false);
      });
      return;
    }
    const timeout = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const reqId = ++lastReqIdRef.current;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) return;
        const data = (await res.json()) as SearchResults;
        if (reqId === lastReqIdRef.current) {
          setResults(data);
          setActiveIndex(0);
        }
      } catch {
        /* aborted or network — ignore */
      } finally {
        if (reqId === lastReqIdRef.current) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [query, open]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) navigateTo(item.href);
    }
  };

  const groupLabel = (g: FlatItem['group']): string => {
    switch (g) {
      case 'series':
        return t('cmdk.groupSeries');
      case 'actors':
        return t('cmdk.groupActors');
      case 'directors':
        return t('cmdk.groupDirectors');
      case 'tags':
        return t('cmdk.groupTags');
    }
  };

  const grouped = (['series', 'actors', 'directors', 'tags'] as const)
    .map((g) => ({ group: g, items: items.filter((i) => i.group === g) }))
    .filter(({ items }) => items.length > 0);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      width={620}
      destroyOnHidden
      className="cmdk-modal"
      maskClosable
      centered
    >
      <Input
        ref={inputRef as never}
        size="large"
        prefix={<SearchOutlined />}
        suffix={loading ? <Spin size="small" /> : null}
        placeholder={t('cmdk.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="cmdk-input"
        aria-label={t('cmdk.placeholder')}
      />

      <div className="cmdk-results" role="listbox">
        {query.trim().length < 2 ? (
          <div className="cmdk-hint">{t('cmdk.hintMinChars')}</div>
        ) : items.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('cmdk.empty')}
          />
        ) : (
          grouped.map(({ group, items: groupItems }) => (
            <div key={group} className="cmdk-group">
              <div className="cmdk-group__title">
                {GROUP_ICONS[group]}
                <span>{groupLabel(group)}</span>
              </div>
              <ul className="cmdk-list">
                {groupItems.map((item) => {
                  const flatIndex = items.indexOf(item);
                  const isActive = flatIndex === activeIndex;
                  return (
                    <li
                      key={item.key}
                      role="option"
                      aria-selected={isActive}
                      className={`cmdk-item${isActive ? ' cmdk-item--active' : ''}`}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => navigateTo(item.href)}
                    >
                      <span className="cmdk-item__label">{item.label}</span>
                      {item.hint && (
                        <span className="cmdk-item__hint">{item.hint}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="cmdk-footer">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> {t('cmdk.navigate')}
        </span>
        <span>
          <kbd>↵</kbd> {t('cmdk.select')}
        </span>
        <span>
          <kbd>Esc</kbd> {t('cmdk.close')}
        </span>
      </div>
    </Modal>
  );
}

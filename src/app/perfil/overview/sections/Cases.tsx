'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BugOutlined,
  BulbOutlined,
  PlusOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import './Cases.css';

interface Case {
  id: number;
  title: string;
  type: string;
  status: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  bug: <BugOutlined />,
  feature: <PlusOutlined />,
  idea: <BulbOutlined />,
};

const TYPE_LABEL: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  idea: 'Idea',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En revisión',
  COMPLETED: 'Cerrado',
  REJECTED: 'Rechazado',
};

const STATUS_TONE: Record<string, string> = {
  OPEN: 'open',
  IN_PROGRESS: 'progress',
  COMPLETED: 'done',
  REJECTED: 'reject',
};

/** "Mis casos de feedback" del style-guide. Compacto: tipo + titulo +
 *  status pill. Reusa /api/feedback/my-cases. */
export function OverviewCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feedback/my-cases?pageSize=5')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cases: Case[] } | null) => {
        if (cancelled || !data) return;
        setCases(data.cases ?? []);
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overview-cases">
      <header className="overview-cases__head">
        <h3 className="overview-cases__title">
          <CommentOutlined /> Mis casos de feedback
        </h3>
        <Link href="/feedback" className="overview-cases__see-all">
          Ver todos
        </Link>
      </header>

      {loading ? (
        <div className="overview-cases__empty">Cargando...</div>
      ) : cases.length === 0 ? (
        <div className="overview-cases__empty">
          No reportaste casos todavía.
        </div>
      ) : (
        <ul className="overview-cases__list">
          {cases.slice(0, 4).map((c) => (
            <li key={c.id} className="overview-cases__item">
              <span className="overview-cases__type">
                {TYPE_ICON[c.type] ?? <BugOutlined />}{' '}
                {TYPE_LABEL[c.type] ?? c.type}
              </span>
              <span className="overview-cases__title-text" title={c.title}>
                {c.title}
              </span>
              <span
                className={`overview-cases__status overview-cases__status--${STATUS_TONE[c.status] ?? 'open'}`}
              >
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Tooltip } from 'antd';
import {
  EditOutlined,
  InstagramOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  TwitterOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Widget } from '@/components/dashboard';
import { EmptyState } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import type { UserSocials } from '../../../types';
import './SocialsWidget.css';

interface SocialEntry {
  key: keyof UserSocials;
  label: string;
  icon: React.ReactNode;
  /** Genera la URL pública dado el handle. Si el handle ya es una URL
   *  completa (empieza con http) la usamos tal cual; sino prependeamos
   *  el prefix del sitio. */
  buildUrl: (handle: string) => string;
  /** Color de marca usado en el icono. Token CSS — viene de variables.css. */
  tone: string;
}

const SOCIAL_DEFS: SocialEntry[] = [
  {
    key: 'twitter',
    label: 'Twitter / X',
    icon: <TwitterOutlined />,
    buildUrl: (h) =>
      h.startsWith('http') ? h : `https://x.com/${h.replace(/^@/, '')}`,
    tone: 'twitter',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <InstagramOutlined />,
    buildUrl: (h) =>
      h.startsWith('http') ? h : `https://instagram.com/${h.replace(/^@/, '')}`,
    tone: 'instagram',
  },
  {
    key: 'letterboxd',
    label: 'Letterboxd',
    icon: <PlayCircleOutlined />,
    buildUrl: (h) =>
      h.startsWith('http')
        ? h
        : `https://letterboxd.com/${h.replace(/^@/, '')}`,
    tone: 'letterboxd',
  },
  {
    key: 'mal',
    label: 'MyAnimeList',
    icon: <YoutubeOutlined />,
    buildUrl: (h) =>
      h.startsWith('http')
        ? h
        : `https://myanimelist.net/profile/${h.replace(/^@/, '')}`,
    tone: 'mal',
  },
  {
    key: 'mdl',
    label: 'MyDramaList',
    icon: <LinkOutlined />,
    buildUrl: (h) =>
      h.startsWith('http')
        ? h
        : `https://mydramalist.com/profile/${h.replace(/^@/, '')}`,
    tone: 'mdl',
  },
];

export interface SocialsWidgetProps {
  /** Socials precargados del fetch inicial del perfil. Opcional — el
   *  widget refetchea on-mount si se pasa undefined (modo standalone). */
  socials?: UserSocials | null;
}

/** Widget "Mis redes" del mock my-profile.png. Lista de handles del user
 *  con icono + click va al perfil publico de cada plataforma. Si el
 *  user no configuro ninguna red, empty state con CTA "Agregar". Edicion
 *  inline via Modal con 5 inputs (uno por plataforma) — PATCH a
 *  /api/user/me. Persiste en User.socials (Json field, migracion
 *  20260511063142_add_user_socials). */
export function SocialsWidget({ socials: initialSocials }: SocialsWidgetProps) {
  const { t } = useLocale();
  const message = useMessage();
  const [socials, setSocials] = useState<UserSocials>(initialSocials ?? {});
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Refrescar el state cuando cambia el initialSocials (re-render del
  // padre por mode switch / refetch).
  useEffect(() => {
    if (initialSocials !== undefined) {
      setSocials(initialSocials ?? {});
    }
  }, [initialSocials]);

  const configured = SOCIAL_DEFS.filter((s) => {
    const v = socials[s.key];
    return typeof v === 'string' && v.length > 0;
  });

  const openEdit = () => {
    // Pre-fill draft con los valores actuales (handles, no URLs).
    const next: Record<string, string> = {};
    for (const def of SOCIAL_DEFS) {
      const v = socials[def.key];
      next[def.key] = typeof v === 'string' ? v : '';
    }
    setDraft(next);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const def of SOCIAL_DEFS) {
        const v = draft[def.key]?.trim() ?? '';
        payload[def.key] = v.length > 0 ? v : null;
      }
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socials: payload }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || t('socials.saveError'));
      }
      const data = (await res.json()) as { socials: UserSocials | null };
      setSocials(data.socials ?? {});
      message.success(t('socials.saveSuccess'));
      setEditOpen(false);
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('socials.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Widget
      title={t('socials.title')}
      icon={<LinkOutlined />}
      noPadding
      actions={
        <Tooltip title={t('socials.editTooltip')}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={openEdit}
            aria-label={t('socials.editTooltip')}
          />
        </Tooltip>
      }
    >
      <div className="mb-socials">
        {configured.length === 0 ? (
          <EmptyState
            title={t('socials.emptyTitle')}
            description={t('socials.emptyHint')}
            variant="soft"
            fullHeight={false}
            action={
              <Button type="primary" onClick={openEdit}>
                {t('socials.emptyCta')}
              </Button>
            }
          />
        ) : (
          <ul className="mb-socials__list">
            {configured.map((def) => {
              const handle = socials[def.key] as string;
              return (
                <li key={def.key} className="mb-socials__item">
                  <a
                    href={def.buildUrl(handle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mb-socials__link mb-socials__link--${def.tone}`}
                  >
                    <span className="mb-socials__icon" aria-hidden>
                      {def.icon}
                    </span>
                    <span className="mb-socials__meta">
                      <span className="mb-socials__platform">{def.label}</span>
                      <span className="mb-socials__handle">@{handle}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={editOpen}
        title={t('socials.editTitle')}
        onCancel={() => setEditOpen(false)}
        onOk={() => {
          void handleSave();
        }}
        confirmLoading={saving}
        okText={t('socials.saveButton')}
        cancelText={t('socials.cancelButton')}
      >
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-tertiary)',
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          {t('socials.editHint')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SOCIAL_DEFS.map((def) => (
            <div key={def.key}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ marginRight: 6 }}>{def.icon}</span>
                {def.label}
              </label>
              <Input
                value={draft[def.key] ?? ''}
                placeholder={t('socials.handlePlaceholder')}
                maxLength={60}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [def.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </Modal>
    </Widget>
  );
}

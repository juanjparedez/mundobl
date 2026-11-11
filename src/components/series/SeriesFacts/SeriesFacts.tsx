'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Segmented, Switch, Tooltip } from 'antd';
import { CheckCircleFilled, EyeOutlined } from '@ant-design/icons';
import { signIn, useSession } from 'next-auth/react';
import { PanelCard, SectionHeader } from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import {
  SERIES_FACTS,
  type ResolvedFacts,
  type SeriesFactKey,
} from '@/lib/series-facts';
import type { SeriesFactsView } from '@/lib/series-facts-store';
import './SeriesFacts.css';

interface SeriesFactsProps {
  seriesId: number;
}

interface FactsState extends SeriesFactsView {
  canEdit: boolean;
}

const UNKNOWN = '__unknown';

function parseView(data: unknown): FactsState | null {
  if (!data || typeof data !== 'object') return null;
  const { facts, mine, canEdit } = data as Record<string, unknown>;
  if (!facts || typeof facts !== 'object') return null;
  return {
    facts: facts as ResolvedFacts,
    mine: (mine && typeof mine === 'object' ? mine : {}) as FactsState['mine'],
    canEdit: canEdit === true,
  };
}

/**
 * "Datos de la serie": ¿se besan?, ¿escenas intimas?, final... con emoji.
 * Votan las cuentas; se muestra el valor del equipo o el consenso.
 */
export function SeriesFacts({ seriesId }: SeriesFactsProps) {
  const { t } = useLocale();
  const message = useMessage();
  const { status } = useSession();
  const [state, setState] = useState<{
    seriesId: number;
    view: FactsState;
  } | null>(null);
  const [revealed, setRevealed] = useState<SeriesFactKey[]>([]);
  const [open, setOpen] = useState(false);
  const [official, setOfficial] = useState(false);
  const [saving, setSaving] = useState<SeriesFactKey | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    const controller = new AbortController();
    fetch(`/api/series/${seriesId}/facts`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        const view = parseView(data);
        if (view) setState({ seriesId, view });
      })
      .catch(() => null);
    return () => controller.abort();
  }, [seriesId, status]);

  const view = state?.seriesId === seriesId ? state.view : null;
  if (!view) return null;

  const valueLabel = (key: SeriesFactKey, value: string) =>
    t(`seriesFacts.values.${key}.${value}` as Parameters<typeof t>[0]);

  const save = async (key: SeriesFactKey, choice: string) => {
    setSaving(key);
    try {
      const response = await fetch(`/api/series/${seriesId}/facts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fact: key,
          value: choice === UNKNOWN ? null : choice,
          official: official && view.canEdit,
        }),
      });
      const next = response.ok ? parseView(await response.json()) : null;
      if (!next) throw new Error('save');
      setState({ seriesId, view: { ...next, canEdit: view.canEdit } });
    } catch {
      void message.error(t('seriesFacts.saveError'));
    } finally {
      setSaving(null);
    }
  };

  const contribute = () => {
    if (status !== 'authenticated') {
      void signIn('google', {
        callbackUrl: window.location.pathname + window.location.search,
      });
      return;
    }
    setOpen(true);
  };

  return (
    <PanelCard
      className="series-facts"
      header={
        <SectionHeader
          title={t('seriesFacts.title')}
          subtitle={t('seriesFacts.subtitle')}
          size="sm"
          actions={
            <Button size="small" onClick={contribute}>
              {t('seriesFacts.contribute')}
            </Button>
          }
        />
      }
    >
      <ul className="series-facts__list">
        {SERIES_FACTS.map(({ key, emoji, spoiler }) => {
          const fact = view.facts[key];
          const hidden = spoiler && fact.value && !revealed.includes(key);
          return (
            <li key={key} className="series-facts__item">
              <span className="series-facts__emoji" aria-hidden>
                {emoji}
              </span>
              <span className="series-facts__label">
                {t(`seriesFacts.facts.${key}`)}
              </span>
              {!fact.value ? (
                <span className="series-facts__empty">
                  {t('seriesFacts.empty')}
                </span>
              ) : hidden ? (
                <button
                  type="button"
                  className="series-facts__spoiler"
                  onClick={() => setRevealed((prev) => [...prev, key])}
                >
                  <EyeOutlined aria-hidden /> {t('seriesFacts.revealSpoiler')}
                </button>
              ) : (
                <Tooltip
                  title={
                    fact.source === 'staff'
                      ? t('seriesFacts.staffSource')
                      : t('seriesFacts.communitySource', { n: fact.votes })
                  }
                >
                  <span className="series-facts__value">
                    {valueLabel(key, fact.value)}
                    {fact.source === 'staff' && (
                      <CheckCircleFilled
                        className="series-facts__verified"
                        aria-label={t('seriesFacts.staffSource')}
                      />
                    )}
                  </span>
                </Tooltip>
              )}
            </li>
          );
        })}
      </ul>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Button type="primary" onClick={() => setOpen(false)}>
            {t('seriesFacts.done')}
          </Button>
        }
        title={t('seriesFacts.modalTitle')}
        destroyOnHidden
      >
        <p className="series-facts__hint">{t('seriesFacts.modalHint')}</p>
        {view.canEdit && (
          <label className="series-facts__official">
            <Switch size="small" checked={official} onChange={setOfficial} />
            <span>
              {t('seriesFacts.official')}
              <span className="series-facts__official-hint">
                {t('seriesFacts.officialHint')}
              </span>
            </span>
          </label>
        )}
        <div className="series-facts__form">
          {SERIES_FACTS.map(({ key, emoji, values }) => {
            const current = official
              ? view.facts[key].source === 'staff'
                ? (view.facts[key].value ?? UNKNOWN)
                : UNKNOWN
              : (view.mine[key] ?? UNKNOWN);
            return (
              <div key={key} className="series-facts__field">
                <span className="series-facts__field-label">
                  <span aria-hidden>{emoji}</span>{' '}
                  {t(`seriesFacts.facts.${key}`)}
                </span>
                <Segmented
                  block
                  size="small"
                  value={current}
                  disabled={saving === key}
                  onChange={(choice) => void save(key, String(choice))}
                  options={[
                    ...values.map((value) => ({
                      value,
                      label: valueLabel(key, value),
                    })),
                    { value: UNKNOWN, label: t('seriesFacts.unknown') },
                  ]}
                />
              </div>
            );
          })}
        </div>
      </Modal>
    </PanelCard>
  );
}

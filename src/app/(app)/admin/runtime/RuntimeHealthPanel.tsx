'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Popconfirm, Spin, Tooltip } from 'antd';
import { ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import {
  PanelCard,
  SectionHeader,
  Chip,
  DataTable,
  EmptyState,
  type ChipTone,
  type DataTableColumn,
} from '@/components/design-system';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { interpolateMessage } from '@/lib/i18n-format';
import { useMessage } from '@/hooks/useMessage';
import type { TranslationKey } from '@/i18n/messages';
import type { RuntimeHealth, StatusIndicator } from '@/lib/runtime-health';
import type { CronRun } from '@/lib/cron-runs';
import './RuntimeHealthPanel.css';

const GITHUB_COMMIT_URL = 'https://github.com/juanjparedez/mundobl/commit/';

const STATUS_TONE: Record<StatusIndicator, ChipTone> = {
  none: 'success',
  minor: 'warning',
  major: 'error',
  critical: 'error',
  unknown: 'neutral',
};

const STATUS_LABEL: Record<StatusIndicator, TranslationKey> = {
  none: 'adminRuntime.statusOperational',
  minor: 'adminRuntime.statusMinor',
  major: 'adminRuntime.statusMajor',
  critical: 'adminRuntime.statusMajor',
  unknown: 'adminRuntime.noData',
};

const WORKFLOW_LABEL: Record<string, TranslationKey> = {
  backup: 'adminRuntime.workflowBackup',
  smoke: 'adminRuntime.workflowSmoke',
};

const INTEGRATION_LABEL: Record<string, TranslationKey> = {
  cron: 'adminRuntime.integrationCron',
  youtube: 'adminRuntime.integrationYoutube',
  gemini: 'adminRuntime.integrationGemini',
  email: 'adminRuntime.integrationEmail',
  push: 'adminRuntime.integrationPush',
  storage: 'adminRuntime.integrationStorage',
};

/** Una corrida de GitHub Actions → tono y rotulo del chip. */
function workflowChip(
  status: string | null,
  conclusion: string | null
): { tone: ChipTone; label: TranslationKey } {
  if (conclusion === 'success')
    return { tone: 'success', label: 'adminRuntime.runSuccess' };
  if (conclusion === 'failure' || conclusion === 'timed_out')
    return { tone: 'error', label: 'adminRuntime.runFailure' };
  if (conclusion === 'skipped')
    return { tone: 'warning', label: 'adminRuntime.runSkipped' };
  if (conclusion === 'cancelled')
    return { tone: 'neutral', label: 'adminRuntime.runCancelled' };
  if (status === 'in_progress' || status === 'queued')
    return { tone: 'info', label: 'adminRuntime.runInProgress' };
  return { tone: 'neutral', label: 'adminRuntime.noData' };
}

export function RuntimeHealthPanel() {
  const { t, locale } = useLocale();
  const message = useMessage();
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/runtime/health', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHealth((await res.json()) as RuntimeHealth);
      setFailed(false);
    } catch (error) {
      console.error('Error loading runtime health:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/admin/runtime/cron/playability', {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = (await res.json()) as { probed: number; scanned: number };
      message.success(
        interpolateMessage(t('adminRuntime.cronRunNowDone'), {
          probed: String(result.probed),
          scanned: String(result.scanned),
        })
      );
    } catch (error) {
      console.error('Error running playability job:', error);
      message.error(t('adminRuntime.cronRunNowError'));
    } finally {
      setRunning(false);
      void load();
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString(locale);

  const cronColumns: DataTableColumn<CronRun>[] = [
    {
      title: t('adminRuntime.cronColDate'),
      key: 'at',
      mobile: 'title',
      render: (_: unknown, run: CronRun) => formatDate(run.at),
    },
    {
      title: t('adminRuntime.cronColResult'),
      key: 'ok',
      render: (_: unknown, run: CronRun) => (
        <Chip tone={run.ok ? 'success' : 'error'} size="sm">
          {run.ok ? t('adminRuntime.cronOk') : t('adminRuntime.cronFailed')}
        </Chip>
      ),
    },
    {
      title: t('adminRuntime.cronColTrigger'),
      key: 'trigger',
      render: (_: unknown, run: CronRun) =>
        run.summary.trigger === 'manual'
          ? t('adminRuntime.cronTriggerManual')
          : t('adminRuntime.cronTriggerSchedule'),
    },
    {
      title: t('adminRuntime.cronColDuration'),
      key: 'duration',
      render: (_: unknown, run: CronRun) =>
        `${(run.durationMs / 1000).toFixed(1)} s`,
    },
    {
      title: t('adminRuntime.cronColDetail'),
      key: 'detail',
      render: (_: unknown, run: CronRun) => {
        if (!run.ok) return run.error ?? '—';
        const detail =
          run.job === 'logs'
            ? interpolateMessage(t('adminRuntime.cronDetailLogs'), {
                deleted: String(run.summary.deleted ?? 0),
              })
            : run.job === 'news'
              ? interpolateMessage(t('adminRuntime.cronDetailNews'), {
                  created: String(run.summary.created ?? 0),
                })
              : interpolateMessage(t('adminRuntime.cronDetail'), {
                  probed: String(run.summary.probed ?? 0),
                  scanned: String(run.summary.scanned ?? 0),
                  changed: String(run.summary.changed ?? 0),
                });
        return run.summary.budgetExhausted
          ? `${detail} · ${t('adminRuntime.cronBacklog')}`
          : detail;
      },
    },
  ];

  const refreshButton = (
    <Button
      icon={<ReloadOutlined />}
      onClick={() => void load()}
      loading={loading && health !== null}
    >
      {t('adminRuntime.healthRefresh')}
    </Button>
  );

  return (
    <section className="runtime-health">
      <SectionHeader
        title={t('adminRuntime.healthTitle')}
        subtitle={t('adminRuntime.healthSubtitle')}
        size="sm"
        actions={refreshButton}
      />

      {loading && !health ? (
        <PanelCard>
          <div className="runtime-health__loading">
            <Spin />
          </div>
        </PanelCard>
      ) : failed || !health ? (
        <PanelCard>
          <EmptyState
            title={t('adminRuntime.healthLoadError')}
            fullHeight={false}
          />
        </PanelCard>
      ) : (
        <>
          <PanelCard
            header={
              <SectionHeader
                title={t('adminRuntime.cronTitle')}
                subtitle={t('adminRuntime.cronHint')}
                size="sm"
                as="h3"
                actions={
                  <Popconfirm
                    title={t('adminRuntime.cronRunNow')}
                    description={t('adminRuntime.cronRunNowConfirm')}
                    onConfirm={() => void handleRunNow()}
                  >
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={running}
                    >
                      {t('adminRuntime.cronRunNow')}
                    </Button>
                  </Popconfirm>
                }
              />
            }
          >
            <p className="runtime-health__next">
              {t('adminRuntime.cronNext')}:{' '}
              <strong>{formatDate(health.cron.nextRunAt)}</strong>
            </p>
            {health.cron.runs.length === 0 ? (
              <EmptyState
                title={t('adminRuntime.cronEmpty')}
                fullHeight={false}
              />
            ) : (
              <DataTable
                dataSource={health.cron.runs}
                columns={cronColumns}
                rowKey="at"
                pageSize={false}
                size="small"
              />
            )}
          </PanelCard>

          <div className="runtime-health__grid">
            <PanelCard
              header={
                <SectionHeader
                  title={t('adminRuntime.depsTitle')}
                  size="sm"
                  as="h3"
                />
              }
            >
              <ul className="runtime-health__list">
                <li>
                  <span>{t('adminRuntime.depDatabase')}</span>
                  {health.database.ok ? (
                    <Chip tone="success" size="sm">
                      {`${health.database.latencyMs} ms`}
                    </Chip>
                  ) : (
                    <Chip tone="error" size="sm">
                      {t('adminRuntime.depDatabaseDown')}
                    </Chip>
                  )}
                </li>
                {health.statusPages.map((page) => (
                  <li key={page.name}>
                    <a href={page.url} target="_blank" rel="noreferrer">
                      {page.name}
                    </a>
                    {/* La descripcion es el texto del propio proveedor. */}
                    <Tooltip title={page.description || undefined}>
                      <span>
                        <Chip tone={STATUS_TONE[page.indicator]} size="sm">
                          {t(STATUS_LABEL[page.indicator])}
                        </Chip>
                      </span>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </PanelCard>

            <PanelCard
              header={
                <SectionHeader
                  title={t('adminRuntime.workflowsTitle')}
                  size="sm"
                  as="h3"
                />
              }
            >
              <ul className="runtime-health__list">
                {health.workflows.map((wf) => {
                  const chip = workflowChip(wf.status, wf.conclusion);
                  const label = WORKFLOW_LABEL[wf.key];
                  return (
                    <li key={wf.key}>
                      <span>
                        {wf.url ? (
                          <a href={wf.url} target="_blank" rel="noreferrer">
                            {label ? t(label) : wf.key}
                          </a>
                        ) : label ? (
                          t(label)
                        ) : (
                          wf.key
                        )}
                        {wf.at && (
                          <span className="runtime-health__muted">
                            {formatDate(wf.at)}
                          </span>
                        )}
                      </span>
                      <Chip tone={chip.tone} size="sm">
                        {t(chip.label)}
                      </Chip>
                    </li>
                  );
                })}
              </ul>
            </PanelCard>

            <PanelCard
              header={
                <SectionHeader
                  title={t('adminRuntime.deployTitle')}
                  size="sm"
                  as="h3"
                />
              }
            >
              <ul className="runtime-health__list">
                <li>
                  <span>{t('adminRuntime.deployEnv')}</span>
                  <Chip size="sm">{health.deployment.env}</Chip>
                </li>
                <li>
                  <span>{t('adminRuntime.deployRegion')}</span>
                  <span>{health.deployment.region ?? '—'}</span>
                </li>
                <li>
                  <span>{t('adminRuntime.deployCommit')}</span>
                  {health.deployment.commitSha ? (
                    <a
                      href={`${GITHUB_COMMIT_URL}${health.deployment.commitSha}`}
                      target="_blank"
                      rel="noreferrer"
                      title={health.deployment.commitMessage ?? undefined}
                    >
                      {health.deployment.commitSha}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </li>
              </ul>
              {health.deployment.commitMessage && (
                <p className="runtime-health__muted runtime-health__commit">
                  {health.deployment.commitMessage}
                </p>
              )}
            </PanelCard>

            <PanelCard
              header={
                <SectionHeader
                  title={t('adminRuntime.integrationsTitle')}
                  size="sm"
                  as="h3"
                />
              }
            >
              <ul className="runtime-health__list">
                {health.integrations.map((integration) => (
                  <li key={integration.key}>
                    <span>
                      {INTEGRATION_LABEL[integration.key]
                        ? t(INTEGRATION_LABEL[integration.key])
                        : integration.key}
                    </span>
                    <Chip
                      tone={integration.configured ? 'success' : 'error'}
                      size="sm"
                    >
                      {integration.configured
                        ? t('adminRuntime.integrationConfigured')
                        : t('adminRuntime.integrationMissing')}
                    </Chip>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>
        </>
      )}
    </section>
  );
}

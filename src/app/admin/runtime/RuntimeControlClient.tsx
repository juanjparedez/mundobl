'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Empty, Select, Space, Spin, Switch, Table, Tag } from 'antd';
import {
  AlertOutlined,
  DashboardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { PanelCard, SectionHeader, StatCard } from '@/components/design-system';
import { AdminNav } from '../AdminNav';
import { useLocale } from '@/lib/providers/LocaleProvider';
import { useMessage } from '@/hooks/useMessage';
import '../admin.css';
import './RuntimeControlClient.css';

type RuntimeState = {
  enabled: boolean;
  forced: boolean;
  autoEnabled: boolean;
  windowMs: number;
  hitThreshold: number;
  cooldownMs: number;
  hitsInWindow: number;
  freezeRemainingMs: number;
  manual: {
    forceFreezeRemainingMs: number;
    disableAiRemainingMs: number;
    disableLoggingRemainingMs: number;
    disableAnonLoggingRemainingMs: number;
  };
};

type RuntimeStatusResponse = {
  ok: boolean;
  state: RuntimeState;
  serverTime: number;
};

type RuntimeErrorItem = {
  id: number;
  action: string;
  path: string;
  method: string | null;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
  } | null;
};

type RuntimeErrorsResponse = {
  ok: boolean;
  errors: RuntimeErrorItem[];
  total: number;
  page: number;
  pageSize: number;
  serverTime: number;
};

type OverrideKey = 'forceFreeze' | 'disableAI' | 'disableLogging' | 'disableAnonLogging';

const TTL_OPTIONS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '120m', value: 120 },
];

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function RuntimeControlClient() {
  const { t } = useLocale();
  const message = useMessage();

  const [status, setStatus] = useState<RuntimeStatusResponse | null>(null);
  const [errors, setErrors] = useState<RuntimeErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [errorsTotal, setErrorsTotal] = useState(0);
  const [errorsPage, setErrorsPage] = useState(1);
  const [errorsPageSize, setErrorsPageSize] = useState(10);
  const [savingKey, setSavingKey] = useState<OverrideKey | null>(null);
  const [ttlByKey, setTtlByKey] = useState<Record<OverrideKey, number>>({
    forceFreeze: 30,
    disableAI: 30,
    disableLogging: 30,
    disableAnonLogging: 30,
  });

  const loadRuntimeData = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await fetch('/api/admin/runtime/status', {
        cache: 'no-store',
      });

      if (!statusRes.ok) {
        throw new Error('runtime_load_failed');
      }

      const statusData = (await statusRes.json()) as RuntimeStatusResponse;
      setStatus(statusData);
    } catch {
      message.error(t('adminRuntime.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  const loadErrors = useCallback(
    async (page: number, pageSize: number) => {
      setErrorsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        const response = await fetch(`/api/admin/runtime/errors?${params}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('runtime_errors_load_failed');
        }

        const data = (await response.json()) as RuntimeErrorsResponse;
        setErrors(data.errors);
        setErrorsTotal(data.total);
        setErrorsPage(data.page);
        setErrorsPageSize(data.pageSize);
      } catch {
        message.error(t('adminRuntime.loadError'));
      } finally {
        setErrorsLoading(false);
      }
    },
    [message, t]
  );

  useEffect(() => {
    loadRuntimeData();
  }, [loadRuntimeData]);

  useEffect(() => {
    loadErrors(errorsPage, errorsPageSize);
  }, [errorsPage, errorsPageSize, loadErrors]);

  const updateOverride = useCallback(
    async (key: OverrideKey, enabled: boolean) => {
      setSavingKey(key);
      try {
        const minutes = ttlByKey[key];
        const payload: Record<string, boolean | number> = {};

        if (key === 'forceFreeze') {
          payload.forceFreeze = enabled;
          payload.forceFreezeMinutes = minutes;
        } else if (key === 'disableAI') {
          payload.disableAI = enabled;
          payload.disableAIMinutes = minutes;
        } else if (key === 'disableLogging') {
          payload.disableLogging = enabled;
          payload.disableLoggingMinutes = minutes;
        } else {
          payload.disableAnonLogging = enabled;
          payload.disableAnonLoggingMinutes = minutes;
        }

        const response = await fetch('/api/admin/runtime/overrides', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('runtime_save_failed');
        }

        const data = (await response.json()) as RuntimeStatusResponse;
        setStatus(data);
        message.success(t('adminRuntime.saveSuccess'));
      } catch {
        message.error(t('adminRuntime.saveError'));
      } finally {
        setSavingKey(null);
      }
    },
    [message, t, ttlByKey]
  );

  const statusTiles = useMemo(() => {
    if (!status) return [];

    return [
      {
        key: 'enabled',
        label: t('adminRuntime.stateEnabled'),
        value: status.state.enabled
          ? t('adminRuntime.stateOn')
          : t('adminRuntime.stateOff'),
        icon: <ThunderboltOutlined />,
      },
      {
        key: 'forced',
        label: t('adminRuntime.stateForced'),
        value: status.state.forced
          ? t('adminRuntime.stateOn')
          : t('adminRuntime.stateOff'),
        icon: <DashboardOutlined />,
      },
      {
        key: 'auto',
        label: t('adminRuntime.stateAuto'),
        value: status.state.autoEnabled
          ? t('adminRuntime.stateOn')
          : t('adminRuntime.stateOff'),
        icon: <ReloadOutlined />,
      },
      {
        key: 'hits',
        label: t('adminRuntime.hitsInWindow'),
        value: `${status.state.hitsInWindow} / ${status.state.hitThreshold}`,
        icon: <AlertOutlined />,
      },
    ];
  }, [status, t]);

  const manualState = status?.state.manual;

  const errorColumns: ColumnsType<RuntimeErrorItem> = [
    {
      title: t('adminRuntime.errorWhen'),
      key: 'createdAt',
      width: 180,
      render: (_, record) => new Date(record.createdAt).toLocaleString(),
    },
    {
      title: t('adminLogs.columnUser'),
      key: 'user',
      width: 180,
      render: (_, record) =>
        record.user ? (
          <div className="runtime-admin-user-cell">
            <Avatar icon={<UserOutlined />} size={22} />
            <span>{record.user.nickname || record.user.name || record.user.id}</span>
          </div>
        ) : (
          <span className="runtime-admin-anonymous">-</span>
        ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 220,
      render: (value: string) => <Tag color="red">{value}</Tag>,
    },
    {
      title: t('adminRuntime.errorPath'),
      key: 'path',
      render: (_, record) => (
        <div>
          <div className="runtime-admin-path">{record.path}</div>
          {record.method && <div className="runtime-admin-method">{record.method}</div>}
        </div>
      ),
    },
    {
      title: t('adminRuntime.errorDetails'),
      dataIndex: 'metadata',
      key: 'metadata',
      render: (value: string | null) => (
        <div className="runtime-admin-metadata">{value || '-'}</div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />

        <div className="runtime-admin-page">
          <SectionHeader
            title={t('adminRuntime.pageTitle')}
            subtitle={t('adminRuntime.pageSubtitle')}
            icon={<ThunderboltOutlined />}
            actions={
              <Button
                icon={<ReloadOutlined />}
                onClick={loadRuntimeData}
                loading={loading}
              >
                {t('adminRuntime.refresh')}
              </Button>
            }
          />

          {loading && !status ? (
            <PanelCard>
              <div className="runtime-admin-loading">
                <Spin />
                <span>{t('adminRuntime.loading')}</span>
              </div>
            </PanelCard>
          ) : (
            <>
              <PanelCard
                header={
                  <SectionHeader
                    title={t('adminRuntime.statusSection')}
                    size="sm"
                  />
                }
              >
                <div className="runtime-admin-stats-grid">
                  {statusTiles.map((tile) => (
                    <StatCard
                      key={tile.key}
                      label={tile.label}
                      value={tile.value}
                      icon={tile.icon}
                    />
                  ))}
                </div>

                {status && (
                  <div className="runtime-admin-status-extra">
                    <Tag color={status.state.freezeRemainingMs > 0 ? 'gold' : 'default'}>
                      {t('adminRuntime.freezeRemaining')}: {formatRemaining(status.state.freezeRemainingMs)}
                    </Tag>
                    <span className="runtime-admin-updated-at">
                      {t('adminRuntime.updatedAt')}: {new Date(status.serverTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </PanelCard>

              <PanelCard
                header={
                  <SectionHeader
                    title={t('adminRuntime.controlsSection')}
                    size="sm"
                  />
                }
              >
                <div className="runtime-admin-controls">
                  <RuntimeToggleRow
                    title={t('adminRuntime.manualForce')}
                    remainingMs={manualState?.forceFreezeRemainingMs ?? 0}
                    ttl={ttlByKey.forceFreeze}
                    onTtlChange={(value) =>
                      setTtlByKey((prev) => ({ ...prev, forceFreeze: value }))
                    }
                    busy={savingKey === 'forceFreeze'}
                    onEnable={() => updateOverride('forceFreeze', true)}
                    onDisable={() => updateOverride('forceFreeze', false)}
                  />

                  <RuntimeToggleRow
                    title={t('adminRuntime.manualAi')}
                    remainingMs={manualState?.disableAiRemainingMs ?? 0}
                    ttl={ttlByKey.disableAI}
                    onTtlChange={(value) =>
                      setTtlByKey((prev) => ({ ...prev, disableAI: value }))
                    }
                    busy={savingKey === 'disableAI'}
                    onEnable={() => updateOverride('disableAI', true)}
                    onDisable={() => updateOverride('disableAI', false)}
                  />

                  <RuntimeToggleRow
                    title={t('adminRuntime.manualLogging')}
                    remainingMs={manualState?.disableLoggingRemainingMs ?? 0}
                    ttl={ttlByKey.disableLogging}
                    onTtlChange={(value) =>
                      setTtlByKey((prev) => ({ ...prev, disableLogging: value }))
                    }
                    busy={savingKey === 'disableLogging'}
                    onEnable={() => updateOverride('disableLogging', true)}
                    onDisable={() => updateOverride('disableLogging', false)}
                  />

                  <RuntimeToggleRow
                    title={t('adminRuntime.manualAnonLogging')}
                    remainingMs={manualState?.disableAnonLoggingRemainingMs ?? 0}
                    ttl={ttlByKey.disableAnonLogging}
                    onTtlChange={(value) =>
                      setTtlByKey((prev) => ({ ...prev, disableAnonLogging: value }))
                    }
                    busy={savingKey === 'disableAnonLogging'}
                    onEnable={() => updateOverride('disableAnonLogging', true)}
                    onDisable={() => updateOverride('disableAnonLogging', false)}
                  />
                </div>
              </PanelCard>

              <PanelCard
                header={
                  <SectionHeader title={t('adminRuntime.errorsSection')} size="sm" />
                }
              >
                {errors.length === 0 ? (
                  errorsLoading ? (
                    <div className="runtime-admin-loading">
                      <Spin />
                    </div>
                  ) : (
                    <Empty description={t('adminRuntime.noErrors')} />
                  )
                ) : (
                  <Table<RuntimeErrorItem>
                    rowKey="id"
                    columns={errorColumns}
                    dataSource={errors}
                    loading={errorsLoading}
                    pagination={{
                      current: errorsPage,
                      pageSize: errorsPageSize,
                      total: errorsTotal,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50'],
                      onChange: (page, pageSize) => {
                        setErrorsPage(page);
                        setErrorsPageSize(pageSize);
                      },
                    }}
                    scroll={{ x: 980 }}
                    size="small"
                  />
                )}
              </PanelCard>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface RuntimeToggleRowProps {
  title: string;
  remainingMs: number;
  ttl: number;
  busy: boolean;
  onTtlChange: (value: number) => void;
  onEnable: () => void;
  onDisable: () => void;
}

function RuntimeToggleRow({
  title,
  remainingMs,
  ttl,
  busy,
  onTtlChange,
  onEnable,
  onDisable,
}: RuntimeToggleRowProps) {
  const { t } = useLocale();
  const active = remainingMs > 0;

  return (
    <div className="runtime-admin-control-row">
      <div className="runtime-admin-control-main">
        <div className="runtime-admin-control-title">{title}</div>
        <div className="runtime-admin-control-status">
          <Tag color={active ? 'gold' : 'default'}>
            {active ? formatRemaining(remainingMs) : '0m'}
          </Tag>
        </div>
      </div>

      <Space>
        <Select
          value={ttl}
          options={TTL_OPTIONS}
          onChange={onTtlChange}
          style={{ width: 92 }}
          aria-label={t('adminRuntime.minutesLabel')}
        />
        <Switch
          checked={active}
          checkedChildren={t('adminRuntime.applyOn')}
          unCheckedChildren={t('adminRuntime.applyOff')}
          loading={busy}
          onChange={(checked) => {
            if (checked) onEnable();
            else onDisable();
          }}
        />
      </Space>
    </div>
  );
}

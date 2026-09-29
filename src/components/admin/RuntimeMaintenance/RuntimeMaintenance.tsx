'use client';

import { useState } from 'react';
import { Alert, Button, Popconfirm, Table } from 'antd';
import { PanelCard, SectionHeader } from '@/components/design-system';
import type { TranslationShape } from '@/i18n/messages';
import type { MaintenanceReport } from '@/types/runtime-maintenance';
import './RuntimeMaintenance.css';

interface Props {
  labels: TranslationShape['runtimeMaintenance'];
}

export function RuntimeMaintenance({ labels }: Props) {
  const [report, setReport] = useState<MaintenanceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null
  );

  async function inspect(until?: number) {
    setBusy(true);
    setNotice(null);
    setReport(null);
    try {
      const query = until ? `?until=${until}` : '';
      const response = await fetch(`/api/admin/runtime/maintenance${query}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error();
      setReport((await response.json()) as MaintenanceReport);
    } catch {
      setNotice({ text: labels.error, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function execute(
    action: 'deleteDeployment' | 'purgeLogs',
    deploymentId?: string
  ) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/runtime/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, deploymentId }),
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        result?: { deleted: number; done: boolean };
      };
      setNotice({
        text:
          action === 'purgeLogs' && data.result
            ? `${labels.deleted}: ${data.result.deleted}. ${data.result.done ? labels.done : labels.partial}`
            : labels.done,
        error: false,
      });
      if (deploymentId)
        setReport((current) =>
          current
            ? {
                ...current,
                candidates: current.candidates.filter(
                  (item) => item.id !== deploymentId
                ),
              }
            : null
        );
    } catch {
      setReport(null);
      setNotice({ text: labels.error, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelCard
      header={
        <SectionHeader
          title={labels.title}
          subtitle={labels.description}
          size="sm"
        />
      }
    >
      <div className="runtime-maintenance">
        <p>{labels.policy}</p>
        <Button
          className="runtime-maintenance__review"
          disabled={busy}
          onClick={() => inspect()}
        >
          {labels.production}
        </Button>
        {notice && (
          <Alert
            type={notice.error ? 'error' : 'success'}
            title={notice.text}
            showIcon
          />
        )}
        {report && !report.configured && (
          <Alert type="warning" title={labels.missing} showIcon />
        )}
        {report && (
          <Alert
            type={report.r2Configured ? 'info' : 'warning'}
            title={report.r2Configured ? labels.r2ok : labels.r2missing}
            showIcon
          />
        )}
        {report?.configured && (
          <>
            <p>
              {labels.scanned}: {report.scanned}
            </p>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={report.candidates}
              scroll={{ x: 600 }}
              locale={{ emptyText: labels.empty }}
              columns={[
                {
                  title: labels.deployment,
                  dataIndex: 'url',
                  render: (url: string) => (
                    <span className="runtime-maintenance__url">{url}</span>
                  ),
                },
                {
                  title: labels.created,
                  dataIndex: 'created',
                  render: (created: number) =>
                    new Date(created).toLocaleDateString(),
                },
                {
                  title: labels.action,
                  key: 'action',
                  render: (_, item) => (
                    <Popconfirm
                      title={labels.confirm}
                      description={item.url}
                      okText={labels.remove}
                      cancelText={labels.cancel}
                      onConfirm={() => execute('deleteDeployment', item.id)}
                      disabled={busy}
                    >
                      <Button danger disabled={busy}>
                        {labels.remove}
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
            />
            {report.hasMore && report.next !== null && (
              <Button
                disabled={busy}
                onClick={() => inspect(report.next ?? undefined)}
              >
                {labels.older}
              </Button>
            )}
          </>
        )}
        {busy && <p role="status">{labels.working}</p>}
        <div className="runtime-maintenance__logs">
          <p>{labels.logsHint}</p>
          <Popconfirm
            title={labels.confirmLogs}
            okText={labels.purge}
            cancelText={labels.cancel}
            onConfirm={() => execute('purgeLogs')}
            disabled={busy}
          >
            <Button disabled={busy}>{labels.purge}</Button>
          </Popconfirm>
        </div>
        <Alert type="info" title={labels.freezeHint} showIcon />
      </div>
    </PanelCard>
  );
}

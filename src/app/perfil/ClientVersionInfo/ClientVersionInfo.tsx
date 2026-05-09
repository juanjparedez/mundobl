'use client';

import { useEffect, useState } from 'react';
import { Tag, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './ClientVersionInfo.css';

interface BuildInfo {
  buildId: string;
  version: string;
  env: string;
}

export function ClientVersionInfo() {
  const { t } = useLocale();
  const message = useMessage();
  const [info, setInfo] = useState<BuildInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/build-info', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BuildInfo | null) => {
        if (!cancelled && data) setInfo(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info) return null;

  const summary = `v${info.version} · build ${info.buildId}${info.env !== 'production' ? ` · ${info.env}` : ''}`;

  const handleCopy = async () => {
    const lines = [
      t('clientVersionInfo.versionLine', { version: info.version }),
      t('clientVersionInfo.buildLine', { buildId: info.buildId }),
      t('clientVersionInfo.envLine', { env: info.env }),
      t('clientVersionInfo.userAgentLine', { userAgent: navigator.userAgent }),
      t('clientVersionInfo.urlLine', { url: window.location.href }),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      message.success(t('clientVersionInfo.copySuccessMessage'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error(t('clientVersionInfo.copyErrorMessage'));
    }
  };

  return (
    <div
      className="client-version-info"
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy();
        }
      }}
      aria-label={t('clientVersionInfo.copyDiagnosticLabel')}
    >
      <Tooltip
        title={t('clientVersionInfo.copyTooltip')}
        placement="top"
      >
        <span className="client-version-info__line">
          <span className="client-version-info__label">
            {t('clientVersionInfo.clientVersionLabel')}
          </span>
          <span className="client-version-info__value">{summary}</span>
          {info.env !== 'production' && (
            <Tag color="orange" className="client-version-info__env-tag">
              {info.env}
            </Tag>
          )}
          <span className="client-version-info__copy" aria-hidden="true">
            {copied ? <CheckOutlined /> : <CopyOutlined />}
          </span>
        </span>
      </Tooltip>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Tag, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import './ClientVersionInfo.css';

interface BuildInfo {
  buildId: string;
  version: string;
  env: string;
}

export function ClientVersionInfo() {
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
      `Version: ${info.version}`,
      `Build: ${info.buildId}`,
      `Env: ${info.env}`,
      `User-Agent: ${navigator.userAgent}`,
      `URL: ${window.location.href}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      message.success('Copiado: pegalo en tu reporte de feedback');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('No pudimos copiar al portapapeles');
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
      aria-label="Copiar diagnostico de version"
    >
      <Tooltip
        title="Click para copiar version + dispositivo. Util para reportes de feedback."
        placement="top"
      >
        <span className="client-version-info__line">
          <span className="client-version-info__label">
            Version del cliente
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

'use client';

import { useState } from 'react';
import { Alert, Button, Input, Space, Tag, Typography, message } from 'antd';
import {
  RadarChartOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { DataTable, type DataTableColumn } from '@/components/design-system';
import { OFFICIAL_BL_CHANNELS } from './officialChannels';
import './barrido.css';

type SweepVerdict = 'CANDIDATE' | 'ALREADY_IMPORTED' | 'NOISE' | 'TOO_SHORT';

interface SweepCandidate {
  playlistId: string;
  title: string;
  playlistUrl: string;
  thumbnailUrl: string;
  itemCount: number;
  verdict: SweepVerdict;
  reason: string;
  episodeTitleRatio: number | null;
}

interface SweepResult {
  channelId: string;
  channelName: string;
  totalPlaylists: number;
  candidates: SweepCandidate[];
  warnings: string[];
}

const VERDICT_META: Record<SweepVerdict, { label: string; color: string }> = {
  CANDIDATE: { label: 'Candidata', color: 'green' },
  ALREADY_IMPORTED: { label: 'Ya importada', color: 'blue' },
  TOO_SHORT: { label: 'Muy corta', color: 'orange' },
  NOISE: { label: 'Descartada', color: 'default' },
};

export function BarridoClient() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SweepResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Por defecto no mostramos el ruido: son decenas de filas de
  // "Highlights | ..." que solo estorban. El admin puede abrirlas.
  const [showAll, setShowAll] = useState(false);

  const runSweep = async (channelUrl: string) => {
    if (!channelUrl.trim()) {
      message.warning('Pegá la URL de un canal de YouTube.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/series/sweep-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: channelUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al barrer el canal.');
        return;
      }
      setResult(data as SweepResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const visible = result
    ? showAll
      ? result.candidates
      : result.candidates.filter((c) => c.verdict !== 'NOISE')
    : [];

  const candidateCount =
    result?.candidates.filter((c) => c.verdict === 'CANDIDATE').length ?? 0;

  const columns: DataTableColumn<SweepCandidate>[] = [
    {
      title: 'Playlist',
      dataIndex: 'title',
      key: 'title',
      mobile: 'title',
      render: (_: unknown, row) => (
        <a href={row.playlistUrl} target="_blank" rel="noopener noreferrer">
          {row.title}
        </a>
      ),
    },
    {
      title: 'Videos',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 90,
      mobile: 'meta',
      sorter: (a, b) => a.itemCount - b.itemCount,
      render: (n: number) => <Tag>{n}</Tag>,
    },
    {
      title: 'Veredicto',
      dataIndex: 'verdict',
      key: 'verdict',
      width: 140,
      mobile: 'meta',
      render: (v: SweepVerdict) => (
        <Tag color={VERDICT_META[v].color}>{VERDICT_META[v].label}</Tag>
      ),
    },
    {
      title: 'Por qué',
      dataIndex: 'reason',
      key: 'reason',
      mobile: 'body',
      render: (r: string) => (
        <Typography.Text type="secondary">{r}</Typography.Text>
      ),
    },
    {
      title: 'Acción',
      key: 'action',
      width: 130,
      mobile: 'actions',
      render: (_: unknown, row) =>
        row.verdict === 'CANDIDATE' || row.verdict === 'TOO_SHORT' ? (
          <Link
            href={`/admin/series/importar?url=${encodeURIComponent(row.playlistUrl)}`}
          >
            <Button
              type="primary"
              size="small"
              icon={<CloudDownloadOutlined />}
            >
              Importar
            </Button>
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="barrido">
      <Typography.Title level={2}>Barrido de canal</Typography.Title>
      <Typography.Paragraph type="secondary">
        Enumera todas las playlists de un canal oficial y marca cuáles parecen
        series completas. Es el paso previo al importador: acá elegís qué vale
        la pena y de ahí pasás al preview de siempre.
      </Typography.Paragraph>

      <Space.Compact className="barrido__search">
        <Input
          placeholder="https://www.youtube.com/@gmmtv"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={() => runSweep(url)}
          allowClear
        />
        <Button
          type="primary"
          icon={<RadarChartOutlined />}
          loading={loading}
          onClick={() => runSweep(url)}
        >
          Barrer
        </Button>
      </Space.Compact>

      <div className="barrido__presets">
        <Typography.Text type="secondary">Canales oficiales:</Typography.Text>
        {OFFICIAL_BL_CHANNELS.map((ch) => (
          <Tag
            key={ch.url}
            className="barrido__preset"
            onClick={() => {
              setUrl(ch.url);
              runSweep(ch.url);
            }}
          >
            {ch.name}
            <span className="barrido__preset-country"> {ch.country}</span>
          </Tag>
        ))}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          className="barrido__alert"
          message="No se pudo barrer el canal"
          description={
            <>
              {error}
              {error.includes('API key') || error.includes('expired') ? (
                <div>
                  Renová <code>YOUTUBE_API_KEY</code> en Google Cloud Console y
                  actualizala en <code>.env</code> y en Vercel.
                </div>
              ) : null}
            </>
          }
        />
      )}

      {result && (
        <>
          <Alert
            type={candidateCount > 0 ? 'success' : 'info'}
            showIcon
            icon={<CheckCircleOutlined />}
            className="barrido__alert"
            message={`${result.channelName}: ${candidateCount} candidata(s) de ${result.totalPlaylists} playlists`}
            description={
              result.warnings.length > 0 ? result.warnings.join(' ') : undefined
            }
          />

          <div className="barrido__toolbar">
            <Button size="small" onClick={() => setShowAll((v) => !v)}>
              {showAll
                ? 'Ocultar descartadas'
                : `Ver todas (${result.totalPlaylists})`}
            </Button>
          </div>

          <DataTable<SweepCandidate>
            columns={columns}
            dataSource={visible}
            rowKey="playlistId"
            pageSize={25}
            empty="Este canal no expone playlists que parezcan series."
          />
        </>
      )}
    </div>
  );
}

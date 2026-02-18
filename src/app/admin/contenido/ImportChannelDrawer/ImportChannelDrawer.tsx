'use client';

import { useState, useMemo } from 'react';
import { Drawer, Input, Button, Table, Select, Space, Tag, Alert } from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useMessage } from '@/hooks/useMessage';
import { CATEGORY_OPTIONS } from '@/lib/embed-helpers';
import type { ColumnsType } from 'antd/es/table';
import './ImportChannelDrawer.css';

const LANGUAGE_OPTIONS = [
  { label: 'Español', value: 'ES' },
  { label: 'Inglés', value: 'EN' },
  { label: 'Chino', value: 'ZH' },
  { label: 'Tailandés', value: 'TH' },
  { label: 'Coreano', value: 'KR' },
  { label: 'Japonés', value: 'JP' },
  { label: 'Multi', value: 'Multi' },
];

interface ChannelVideo {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  videoId: string;
  channelName: string;
  channelUrl: string;
  publishedAt: string;
  platform: string;
}

interface SeriesOption {
  value: number;
  label: string;
}

interface ImportChannelDrawerProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  seriesOptions: SeriesOption[];
}

export function ImportChannelDrawer({
  open,
  onClose,
  onImportComplete,
  seriesOptions,
}: ImportChannelDrawerProps) {
  const message = useMessage();
  const [channelUrl, setChannelUrl] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [alreadyImported, setAlreadyImported] = useState<Set<string>>(
    new Set()
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Shared fields
  const [importCategory, setImportCategory] = useState('other');
  const [importLanguage, setImportLanguage] = useState<string | undefined>();
  const [importSeriesId, setImportSeriesId] = useState<number | undefined>();

  const fetchVideos = async (pageToken?: string) => {
    if (!channelUrl.trim()) return;
    setFetchLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contenido/import-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: channelUrl.trim(), pageToken }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al buscar videos');

      const newVideos: ChannelVideo[] = data.videos;
      const imported: string[] = data.alreadyImported;

      if (pageToken) {
        setVideos((prev) => [...prev, ...newVideos]);
      } else {
        setVideos(newVideos);
        setSelectedKeys([]);
      }

      setAlreadyImported((prev) => {
        const next = new Set(prev);
        imported.forEach((id) => next.add(id));
        return next;
      });
      setNextPageToken(data.nextPageToken);
      setTotalResults(data.totalResults);
      setChannelName(data.channelName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar videos');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleImport = async () => {
    if (selectedKeys.length === 0) {
      message.warning('Seleccioná al menos un video');
      return;
    }

    setImportLoading(true);
    try {
      const items = videos
        .filter((v) => selectedKeys.includes(v.videoId))
        .map((v) => ({
          title: v.title,
          url: v.videoUrl,
          platform: v.platform,
          videoId: v.videoId,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          channelName: v.channelName,
          channelUrl: v.channelUrl,
        }));

      const res = await fetch('/api/contenido/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          category: importCategory,
          language: importLanguage,
          seriesId: importSeriesId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');

      message.success(`${data.created} videos importados`);

      // Mark imported and clear selection
      setAlreadyImported((prev) => {
        const next = new Set(prev);
        selectedKeys.forEach((id) => next.add(id));
        return next;
      });
      setSelectedKeys([]);
      onImportComplete();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImportLoading(false);
    }
  };

  const handleClose = () => {
    setChannelUrl('');
    setVideos([]);
    setAlreadyImported(new Set());
    setSelectedKeys([]);
    setNextPageToken(null);
    setChannelName('');
    setError(null);
    setImportCategory('other');
    setImportLanguage(undefined);
    setImportSeriesId(undefined);
    onClose();
  };

  const selectableVideoIds = useMemo(
    () =>
      videos
        .filter((v) => !alreadyImported.has(v.videoId))
        .map((v) => v.videoId),
    [videos, alreadyImported]
  );

  const columns: ColumnsType<ChannelVideo> = [
    {
      title: '',
      dataIndex: 'thumbnailUrl',
      key: 'thumb',
      width: 130,
      render: (url: string) => (
        <img src={url} alt="" className="import-channel__video-thumb" />
      ),
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Fecha',
      dataIndex: 'publishedAt',
      key: 'date',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('es-AR'),
    },
    {
      title: 'Estado',
      key: 'status',
      width: 120,
      render: (_: unknown, record: ChannelVideo) =>
        alreadyImported.has(record.videoId) ? (
          <Tag color="green">Ya importado</Tag>
        ) : null,
    },
  ];

  return (
    <Drawer
      title="Importar desde canal"
      open={open}
      onClose={handleClose}
      width={720}
      destroyOnClose
    >
      <div className="import-channel__url-row">
        <Input
          placeholder="URL del canal de YouTube o Vimeo"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          onPressEnter={() => fetchVideos()}
          disabled={fetchLoading}
        />
        <Button
          type="primary"
          icon={fetchLoading ? <LoadingOutlined /> : <SearchOutlined />}
          onClick={() => fetchVideos()}
          loading={fetchLoading}
        >
          Buscar
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {channelName && (
        <p className="import-channel__channel-info">
          Canal: <strong>{channelName}</strong> · {totalResults} videos totales
        </p>
      )}

      {videos.length > 0 && (
        <>
          <Table
            dataSource={videos}
            columns={columns}
            rowKey="videoId"
            size="small"
            pagination={false}
            scroll={{ y: 400 }}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: (keys) => setSelectedKeys(keys as string[]),
              getCheckboxProps: (record) => ({
                disabled: alreadyImported.has(record.videoId),
              }),
            }}
          />

          {nextPageToken && (
            <div className="import-channel__load-more">
              <Button
                onClick={() => fetchVideos(nextPageToken)}
                loading={fetchLoading}
              >
                Cargar más videos
              </Button>
            </div>
          )}

          <div className="import-channel__shared-fields">
            <span className="import-channel__shared-label">
              Aplicar a todos:
            </span>
            <Select
              placeholder="Categoría"
              options={CATEGORY_OPTIONS}
              value={importCategory}
              onChange={setImportCategory}
              style={{ width: 160 }}
            />
            <Select
              placeholder="Idioma"
              options={LANGUAGE_OPTIONS}
              value={importLanguage}
              onChange={setImportLanguage}
              allowClear
              style={{ width: 130 }}
            />
            <Select
              placeholder="Serie (opcional)"
              options={seriesOptions}
              value={importSeriesId}
              onChange={setImportSeriesId}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              style={{ width: 200 }}
            />
          </div>

          <div className="import-channel__actions">
            {selectedKeys.length > 0 && (
              <Space>
                <Button onClick={() => setSelectedKeys([])}>
                  Deseleccionar todo
                </Button>
                <Button
                  onClick={() => setSelectedKeys(selectableVideoIds)}
                  type="dashed"
                >
                  Seleccionar todos ({selectableVideoIds.length})
                </Button>
              </Space>
            )}
            {selectedKeys.length === 0 && selectableVideoIds.length > 0 && (
              <Button
                onClick={() => setSelectedKeys(selectableVideoIds)}
                type="dashed"
              >
                Seleccionar todos ({selectableVideoIds.length})
              </Button>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleImport}
              loading={importLoading}
              disabled={selectedKeys.length === 0}
            >
              Importar seleccionados ({selectedKeys.length})
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}

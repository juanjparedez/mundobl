'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  Input,
  DatePicker,
  Button,
  Avatar,
  Tag,
  Space,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  BugOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import '../admin.css';
import './logs.css';

const { RangePicker } = DatePicker;

interface LogUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface AccessLogEntry {
  id: number;
  action: string;
  path: string;
  method: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
  user: LogUser | null;
}

const ACTION_COLORS: Record<string, string> = {
  PAGE_VIEW: 'blue',
  LOGIN: 'green',
  LOGOUT: 'orange',
  CREATE: 'cyan',
  UPDATE: 'gold',
  DELETE: 'red',
};

const ACTION_OPTIONS = [
  { label: 'Todas', value: '' },
  { label: 'Page View', value: 'PAGE_VIEW' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Logout', value: 'LOGOUT' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
];

interface UserOption {
  id: string;
  name: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function LogCard({
  log,
  onFilter,
}: {
  log: AccessLogEntry;
  onFilter: (type: 'action' | 'user' | 'ip' | 'path', value: string) => void;
}) {
  const date = new Date(log.createdAt).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="log-card">
      <div className="log-card__header">
        <span className="log-card__date">{date}</span>
        <Tag
          color={ACTION_COLORS[log.action] || 'default'}
          className="logs-table__clickable"
          onClick={() => onFilter('action', log.action)}
        >
          {log.action}
        </Tag>
      </div>
      <div className="log-card__user">
        {log.user ? (
          <div
            className="logs-table__user logs-table__clickable"
            onClick={() => onFilter('user', log.user!.id)}
          >
            <Avatar
              src={log.user.image}
              icon={!log.user.image ? <UserOutlined /> : undefined}
              size={20}
            />
            <span>{log.user.name}</span>
          </div>
        ) : (
          <span className="logs-table__anonymous">Anónimo</span>
        )}
      </div>
      <div
        className="log-card__path logs-table__clickable"
        onClick={() => onFilter('path', log.path)}
      >
        {log.path}
      </div>
      {log.ip && (
        <div
          className="log-card__ip logs-table__clickable"
          onClick={() => onFilter('ip', log.ip!)}
        >
          IP: {log.ip}
        </div>
      )}
    </div>
  );
}

export function LogsClient() {
  const message = useMessage();
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data.map((u: UserOption) => ({ id: u.id, name: u.name })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (actionFilter) params.set('action', actionFilter);
      if (userFilter) params.set('userId', userFilter);
      if (ipFilter) params.set('ip', ipFilter);
      if (pathFilter) params.set('path', pathFilter);
      if (dateRange[0]) params.set('from', dateRange[0]);
      if (dateRange[1]) params.set('to', dateRange[1]);

      const response = await fetch(`/api/admin/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      message.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    actionFilter,
    userFilter,
    ipFilter,
    pathFilter,
    dateRange,
    message,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const applyFilter = (
    type: 'action' | 'user' | 'ip' | 'path',
    value: string
  ) => {
    setPage(1);
    switch (type) {
      case 'action':
        setActionFilter(value);
        break;
      case 'user':
        setUserFilter(value);
        break;
      case 'ip':
        setIpFilter(value);
        break;
      case 'path':
        setPathFilter(value);
        break;
    }
  };

  const handleCleanOldLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?days=90', {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        message.success(data.message);
        fetchLogs();
      }
    } catch (error) {
      message.error('Error al limpiar logs');
      console.error(error);
    }
  };

  const handleCleanScannerLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs?type=scanners', {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        message.success(data.message);
        fetchLogs();
      }
    } catch (error) {
      message.error('Error al limpiar logs de scanners');
      console.error(error);
    }
  };

  const columns: ColumnsType<AccessLogEntry> = [
    {
      title: 'Fecha',
      key: 'createdAt',
      width: 160,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      title: 'Usuario',
      key: 'user',
      width: 180,
      render: (_, record) =>
        record.user ? (
          <div
            className="logs-table__user logs-table__clickable"
            onClick={() => applyFilter('user', record.user!.id)}
            title="Filtrar por este usuario"
          >
            <Avatar
              src={record.user.image}
              icon={!record.user.image ? <UserOutlined /> : undefined}
              size={24}
            />
            <span>{record.user.name}</span>
          </div>
        ) : (
          <span className="logs-table__anonymous">Anónimo</span>
        ),
    },
    {
      title: 'Acción',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Tag
          color={ACTION_COLORS[record.action] || 'default'}
          className="logs-table__clickable"
          onClick={() => applyFilter('action', record.action)}
          title="Filtrar por esta acción"
        >
          {record.action}
        </Tag>
      ),
    },
    {
      title: 'Ruta',
      key: 'path',
      ellipsis: true,
      render: (_, record) => (
        <span
          className="logs-table__clickable"
          onClick={() => applyFilter('path', record.path)}
          title="Filtrar por esta ruta"
        >
          {record.path}
        </span>
      ),
    },
    {
      title: 'IP',
      key: 'ip',
      width: 130,
      responsive: ['lg' as const],
      render: (_, record) =>
        record.ip ? (
          <span
            className="logs-table__clickable"
            onClick={() => applyFilter('ip', record.ip!)}
            title="Filtrar por esta IP"
          >
            {record.ip}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'User Agent',
      dataIndex: 'userAgent',
      key: 'userAgent',
      width: 200,
      ellipsis: true,
      responsive: ['xl' as const],
      render: (ua: string | null) => ua || '-',
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="logs-page">
          <div className="logs-header">
            <h2 className="logs-title">Access Logs</h2>
            <span className="logs-count">{total} registros</span>
          </div>

          <div className="logs-filters">
            <Space wrap size="small">
              <Select
                value={actionFilter}
                onChange={(value) => {
                  setActionFilter(value);
                  setPage(1);
                }}
                options={ACTION_OPTIONS}
                className="logs-filter-select"
                placeholder="Acción"
              />
              <Select
                value={userFilter || undefined}
                onChange={(value) => {
                  setUserFilter(value || '');
                  setPage(1);
                }}
                allowClear
                showSearch
                optionFilterProp="label"
                options={users.map((u) => ({
                  label: u.name || u.id,
                  value: u.id,
                }))}
                className="logs-filter-select"
                placeholder="Usuario"
              />
              <Input
                value={ipFilter}
                onChange={(e) => {
                  setIpFilter(e.target.value);
                  setPage(1);
                }}
                prefix={<SearchOutlined />}
                placeholder="Buscar IP"
                allowClear
                className="logs-filter-input"
              />
              <Input
                value={pathFilter}
                onChange={(e) => {
                  setPathFilter(e.target.value);
                  setPage(1);
                }}
                prefix={<SearchOutlined />}
                placeholder="Buscar ruta"
                allowClear
                className="logs-filter-input"
              />
              <RangePicker
                onChange={(_, dateStrings) => {
                  setDateRange([
                    dateStrings[0] || null,
                    dateStrings[1] || null,
                  ]);
                  setPage(1);
                }}
                className="logs-filter-datepicker"
              />
            </Space>
            <Space wrap size="small" className="logs-actions">
              <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
                Refrescar
              </Button>
              <Button icon={<BugOutlined />} onClick={handleCleanScannerLogs}>
                Limpiar scanners
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleCleanOldLogs}
              >
                Limpiar +90 días
              </Button>
            </Space>
          </div>

          {isMobile ? (
            <div className="logs-cards">
              {loading && (
                <div className="logs-cards__loading">Cargando...</div>
              )}
              {!loading && logs.length === 0 && (
                <div className="logs-cards__empty">Sin resultados</div>
              )}
              {!loading &&
                logs.map((log) => (
                  <LogCard key={log.id} log={log} onFilter={applyFilter} />
                ))}
              {!loading && total > 50 && (
                <div className="logs-cards__pagination">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="logs-cards__page-info">
                    {page} / {Math.ceil(total / 50)}
                  </span>
                  <Button
                    disabled={page >= Math.ceil(total / 50)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                total,
                pageSize: 50,
                onChange: setPage,
                showTotal: (t) => `${t} logs`,
              }}
              size="small"
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

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

export function LogsClient() {
  const message = useMessage();
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
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
  }, [page, actionFilter, userFilter, ipFilter, dateRange, message]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
          <div className="logs-table__user">
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
        <Tag color={ACTION_COLORS[record.action] || 'default'}>
          {record.action}
        </Tag>
      ),
    },
    {
      title: 'Ruta',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      responsive: ['lg' as const],
      render: (ip: string | null) => ip || '-',
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
            <Space wrap>
              <Select
                value={actionFilter}
                onChange={(value) => {
                  setActionFilter(value);
                  setPage(1);
                }}
                options={ACTION_OPTIONS}
                style={{ width: 140 }}
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
                style={{ width: 180 }}
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
                style={{ width: 160 }}
              />
              <RangePicker
                onChange={(_, dateStrings) => {
                  setDateRange([
                    dateStrings[0] || null,
                    dateStrings[1] || null,
                  ]);
                  setPage(1);
                }}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
                Refrescar
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
        </div>
      </div>
    </AppLayout>
  );
}

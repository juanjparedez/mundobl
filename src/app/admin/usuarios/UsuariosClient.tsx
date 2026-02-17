'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Select,
  Avatar,
  Tag,
  Button,
  Popconfirm,
  Space,
  Input,
} from 'antd';
import {
  UserOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import { useMessage } from '@/hooks/useMessage';
import '../admin.css';
import './usuarios.css';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'VISITOR';
  banned: boolean;
  createdAt: string;
}

interface BannedIpData {
  id: number;
  ip: string;
  reason: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MODERATOR: 'Moderador',
  VISITOR: 'Visitante',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

export function UsuariosClient() {
  const message = useMessage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannedIps, setBannedIps] = useState<BannedIpData[]>([]);
  const [newBanIp, setNewBanIp] = useState('');
  const [newBanReason, setNewBanReason] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [message]);

  const fetchBannedIps = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/banned-ips');
      if (response.ok) {
        const data = await response.json();
        setBannedIps(data);
      }
    } catch (error) {
      console.error('Error fetching banned IPs:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBannedIps();
  }, [fetchUsers, fetchBannedIps]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar rol');
      }

      message.success('Rol actualizado');
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, role: newRole as UserData['role'] }
            : user
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Error al cambiar rol'
      );
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !currentlyBanned }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar estado');
      }

      message.success(
        currentlyBanned ? 'Usuario desbaneado' : 'Usuario baneado'
      );
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, banned: !currentlyBanned } : user
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Error al banear usuario'
      );
    }
  };

  const handleBanIp = async () => {
    if (!newBanIp.trim()) {
      message.warning('Ingresá una IP');
      return;
    }
    try {
      const response = await fetch('/api/admin/banned-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: newBanIp.trim(),
          reason: newBanReason.trim() || null,
        }),
      });
      if (!response.ok) throw new Error('Error al bloquear IP');
      const created = await response.json();
      setBannedIps((prev) => [created, ...prev]);
      setNewBanIp('');
      setNewBanReason('');
      message.success('IP bloqueada');
    } catch (error) {
      message.error('Error al bloquear IP');
      console.error(error);
    }
  };

  const handleUnbanIp = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/banned-ips?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al desbloquear IP');
      setBannedIps((prev) => prev.filter((ip) => ip.id !== id));
      message.success('IP desbloqueada');
    } catch (error) {
      message.error('Error al desbloquear IP');
      console.error(error);
    }
  };

  const userColumns: ColumnsType<UserData> = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_, record) => (
        <div className="usuarios-table__user">
          <Avatar
            src={record.image}
            icon={!record.image ? <UserOutlined /> : undefined}
            size={36}
          />
          <div>
            <div className="usuarios-table__name">
              {record.name}
              {record.banned && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  Baneado
                </Tag>
              )}
            </div>
            <div className="usuarios-table__email">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Rol',
      key: 'role',
      width: 200,
      render: (_, record) =>
        record.role === 'ADMIN' ? (
          <Tag color={ROLE_COLORS[record.role]}>{ROLE_LABELS[record.role]}</Tag>
        ) : (
          <Select
            value={record.role}
            onChange={(value) => handleRoleChange(record.id, value)}
            style={{ width: 160 }}
            disabled={record.banned}
            options={[
              { label: 'Visitante', value: 'VISITOR' },
              { label: 'Moderador', value: 'MODERATOR' },
            ]}
          />
        ),
    },
    {
      title: 'Registro',
      key: 'createdAt',
      width: 150,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString('es-ES'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 130,
      render: (_, record) =>
        record.role !== 'ADMIN' ? (
          <Popconfirm
            title={record.banned ? 'Desbanear usuario?' : 'Banear usuario?'}
            description={
              record.banned
                ? 'El usuario podrá acceder nuevamente'
                : 'El usuario no podrá acceder al sitio'
            }
            onConfirm={() => handleToggleBan(record.id, record.banned)}
            okText={record.banned ? 'Desbanear' : 'Banear'}
            cancelText="Cancelar"
            okButtonProps={{ danger: !record.banned }}
          >
            <Button
              size="small"
              danger={!record.banned}
              icon={record.banned ? <CheckCircleOutlined /> : <StopOutlined />}
            >
              {record.banned ? 'Desbanear' : 'Banear'}
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const ipColumns: ColumnsType<BannedIpData> = [
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: 'Razón',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string | null) => reason || '-',
    },
    {
      title: 'Fecha',
      key: 'createdAt',
      width: 150,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString('es-ES'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleUnbanIp(record.id)}
        >
          Desbloquear
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="usuarios-page">
          <h2 className="usuarios-section-title">Usuarios</h2>
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />

          <h2 className="usuarios-section-title" style={{ marginTop: 32 }}>
            IPs Bloqueadas
          </h2>
          <div className="usuarios-ban-form">
            <Space.Compact style={{ flex: 1, maxWidth: 400 }}>
              <Input
                placeholder="IP (ej: 192.168.1.1)"
                value={newBanIp}
                onChange={(e) => setNewBanIp(e.target.value)}
              />
              <Input
                placeholder="Razón (opcional)"
                value={newBanReason}
                onChange={(e) => setNewBanReason(e.target.value)}
                style={{ maxWidth: 200 }}
              />
              <Button type="primary" danger onClick={handleBanIp}>
                Bloquear
              </Button>
            </Space.Compact>
          </div>
          <Table
            columns={ipColumns}
            dataSource={bannedIps}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </AppLayout>
  );
}

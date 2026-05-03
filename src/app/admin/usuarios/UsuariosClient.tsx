'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useLocale } from '@/lib/providers/LocaleProvider';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar/AdminTableToolbar';
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

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  MODERATOR: 'blue',
  VISITOR: 'default',
};

export function UsuariosClient() {
  const message = useMessage();
  const { t } = useLocale();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannedIps, setBannedIps] = useState<BannedIpData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
      message.error(t('adminUsers.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

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

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

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

      message.success(t('adminUsers.roleUpdateSuccess'));
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, role: newRole as UserData['role'] }
            : user
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('adminUsers.roleUpdateError')
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
        currentlyBanned ? t('adminUsers.unbanSuccess') : t('adminUsers.banSuccess')
      );
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, banned: !currentlyBanned } : user
        )
      );
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : t('adminUsers.banError')
      );
    }
  };

  const handleBanIp = async () => {
    if (!newBanIp.trim()) {
      message.warning(t('adminUsers.ipMissingWarning'));
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
      if (!response.ok) throw new Error(t('adminUsers.ipBlockError'));
      const created = await response.json();
      setBannedIps((prev) => [created, ...prev]);
      setNewBanIp('');
      setNewBanReason('');
      message.success(t('adminUsers.ipBlockSuccess'));
    } catch (error) {
      message.error(t('adminUsers.ipBlockError'));
      console.error(error);
    }
  };

  const handleUnbanIp = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/banned-ips?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(t('adminUsers.ipUnblockError'));
      setBannedIps((prev) => prev.filter((ip) => ip.id !== id));
      message.success(t('adminUsers.ipUnblockSuccess'));
    } catch (error) {
      message.error(t('adminUsers.ipUnblockError'));
      console.error(error);
    }
  };

  const userColumns: ColumnsType<UserData> = [
    {
      title: t('adminUsers.columnUser'),
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
                  {t('adminUsers.tagBanned')}
                </Tag>
              )}
            </div>
            <div className="usuarios-table__email">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: t('adminUsers.columnRole'),
      key: 'role',
      width: 200,
      render: (_, record) =>
        record.role === 'ADMIN' ? (
          <Tag color={ROLE_COLORS[record.role]}>{t('adminUsers.roleAdmin')}</Tag>
        ) : (
          <Select
            value={record.role}
            onChange={(value) => handleRoleChange(record.id, value)}
            style={{ width: 160 }}
            disabled={record.banned}
            options={[
              { label: t('adminUsers.roleVisitor'), value: 'VISITOR' },
              { label: t('adminUsers.roleModerator'), value: 'MODERATOR' },
            ]}
          />
        ),
    },
    {
      title: t('adminUsers.columnCreatedAt'),
      key: 'createdAt',
      width: 150,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString('es-ES'),
    },
    {
      title: t('adminUsers.columnActions'),
      key: 'actions',
      width: 130,
      render: (_, record) =>
        record.role !== 'ADMIN' ? (
          <Popconfirm
            title={
              record.banned
                ? t('adminUsers.unbanTitle')
                : t('adminUsers.banTitle')
            }
            description={
              record.banned
                ? t('adminUsers.unbanDescription')
                : t('adminUsers.banDescription')
            }
            onConfirm={() => handleToggleBan(record.id, record.banned)}
            okText={
              record.banned
                ? t('adminUsers.actionUnban')
                : t('adminUsers.actionBan')
            }
            cancelText={t('adminUsers.actionUnban')}
            okButtonProps={{ danger: !record.banned }}
          >
            <Button
              size="small"
              danger={!record.banned}
              icon={
                record.banned ? <CheckCircleOutlined /> : <StopOutlined />
              }
            >
              {record.banned
                ? t('adminUsers.actionUnban')
                : t('adminUsers.actionBan')}
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const ipColumns: ColumnsType<BannedIpData> = [
    {
      title: t('adminUsers.columnIp'),
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: t('adminUsers.columnReason'),
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string | null) => reason || '-',
    },
    {
      title: t('adminUsers.columnDate'),
      key: 'createdAt',
      width: 150,
      render: (_, record) =>
        new Date(record.createdAt).toLocaleDateString('es-ES'),
    },
    {
      title: t('adminUsers.columnActions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleUnbanIp(record.id)}
        >
          {t('adminUsers.actionUnblockIp')}
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />

        <AdminPageHero
          title={t('adminUsers.title')}
          subtitle={t('adminUsers.subtitle')}
          stats={[
            { label: t('adminUsers.statsTotal'), value: users.length },
            {
              label: t('adminUsers.statsBanned'),
              value: users.filter((u) => u.banned).length,
            },
            { label: t('adminUsers.statsIps'), value: bannedIps.length },
          ]}
        />

        <AdminTableToolbar
          filters={null}
          searchPlaceholder={t('adminUsers.searchPlaceholder')}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={() => undefined}
          onSearchClear={() => setSearchTerm('')}
        />

        <h2 className="usuarios-section-title">{t('adminUsers.sectionUsers')}</h2>
        <Table
          columns={userColumns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />

        <h2 className="usuarios-section-title" style={{ marginTop: 32 }}>
          {t('adminUsers.sectionBannedIps')}
        </h2>
        <div className="usuarios-ban-form">
          <Space.Compact style={{ flex: 1, maxWidth: 400 }}>
            <Input
              placeholder={t('adminUsers.ipPlaceholder')}
              value={newBanIp}
              onChange={(e) => setNewBanIp(e.target.value)}
            />
            <Input
              placeholder={t('adminUsers.ipReasonPlaceholder')}
              value={newBanReason}
              onChange={(e) => setNewBanReason(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <Button type="primary" danger onClick={handleBanIp}>
              {t('adminUsers.ipBlockButton')}
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
    </AppLayout>
  );
}

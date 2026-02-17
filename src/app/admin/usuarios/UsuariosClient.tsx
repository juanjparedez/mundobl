'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Select, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageTitle } from '@/components/common/PageTitle/PageTitle';
import { useMessage } from '@/hooks/useMessage';
import './usuarios.css';

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'VISITOR';
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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const columns: ColumnsType<UserData> = [
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
            <div className="usuarios-table__name">{record.name}</div>
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
  ];

  return (
    <div className="usuarios-page">
      <PageTitle title="Gestión de Usuarios" />
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    </div>
  );
}

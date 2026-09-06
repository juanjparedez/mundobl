'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs } from 'antd';
import { TableOutlined, TagsOutlined, BookOutlined } from '@ant-design/icons';
import { AdminPageHero } from '@/components/admin/AdminPageHero/AdminPageHero';
import { AdminNav } from '../AdminNav';
import { SeriesMetadataTab } from './SeriesMetadataTab';
import { TagsTab } from './TagsTab';
import { GenresTab } from './GenresTab';
import '../admin.css';

export function TagsAdminClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams.get('tab') || 'series';
  const filterFromUrl = searchParams.get('filter') || 'all';

  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Actualizar URL sin recargar para que se pueda compartir/recordar
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`/admin/tags?${params.toString()}`, { scroll: false });
  };

  const items = [
    {
      key: 'series',
      label: (
        <span>
          <TableOutlined /> Asignación Rápida por Serie
        </span>
      ),
      children: <SeriesMetadataTab initialFilter={filterFromUrl} />,
    },
    {
      key: 'tags',
      label: (
        <span>
          <TagsOutlined /> Directorio de Etiquetas
        </span>
      ),
      children: <TagsTab />,
    },
    {
      key: 'genres',
      label: (
        <span>
          <BookOutlined /> Directorio de Géneros
        </span>
      ),
      children: <GenresTab />,
    },
  ];

  return (
    <div className="admin-page tags-admin-page">
      <AdminNav />
      <div className="admin-content">
        <AdminPageHero
          title="Gestión de Metadatos: Etiquetas y Géneros"
          subtitle="Revisión de contenido, asignación rápida inline por serie y directorio global de tags y géneros."
        />

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          size="large"
          style={{ marginTop: 16 }}
        />
      </div>
    </div>
  );
}

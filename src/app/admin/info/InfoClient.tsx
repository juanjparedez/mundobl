'use client';

import { useState, useEffect } from 'react';
import { Card, Tag, Avatar, Spin, Empty } from 'antd';
import {
  GithubOutlined,
  CloudOutlined,
  DatabaseOutlined,
  UserOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';
import { AdminNav } from '../AdminNav';
import '../admin.css';
import './info.css';

interface ProjectLinks {
  github: string | null;
  vercel: string | null;
  supabase: string | null;
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  color: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Juan',
    role: 'Desarrollador',
    bio: 'Full-stack developer. Responsable del desarrollo y mantenimiento de MundoBL.',
    color: 'blue',
  },
  {
    name: 'Flor',
    role: 'Product Owner',
    bio: 'Responsable de las ideas, el contenido y la dirección del sitio. La verdadera experta en BLs.',
    color: 'magenta',
  },
];

const LINK_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  github: { label: 'GitHub', icon: <GithubOutlined />, color: '#24292e' },
  vercel: { label: 'Vercel', icon: <CloudOutlined />, color: '#000' },
  supabase: { label: 'Supabase', icon: <DatabaseOutlined />, color: '#3ecf8e' },
};

export function InfoClient() {
  const [links, setLinks] = useState<ProjectLinks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const response = await fetch('/api/admin/info');
        if (response.ok) {
          const data = await response.json();
          setLinks(data.links);
        }
      } catch (error) {
        console.error('Error fetching project info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  const availableLinks = links
    ? Object.entries(links).filter(([, url]) => url !== null)
    : [];

  return (
    <AppLayout>
      <div className="admin-page-wrapper">
        <AdminNav />
        <div className="info-page">
          <div className="info-sections">
            <Card title="Plataformas" className="info-card">
              {loading ? (
                <div className="info-loading">
                  <Spin />
                </div>
              ) : availableLinks.length > 0 ? (
                <div className="info-links">
                  {availableLinks.map(([key, url]) => {
                    const config = LINK_CONFIG[key];
                    return (
                      <a
                        key={key}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        <span className="info-link__icon">{config.icon}</span>
                        <div className="info-link__content">
                          <span className="info-link__label">
                            {config.label}
                          </span>
                          <span className="info-link__url">{url}</span>
                        </div>
                        <LinkOutlined className="info-link__external" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <Empty description="No hay links configurados. Agregá las variables PROJECT_GITHUB_URL, PROJECT_VERCEL_URL, PROJECT_SUPABASE_URL en tu .env" />
              )}
            </Card>

            <Card title="Equipo" className="info-card">
              <div className="info-team">
                {TEAM.map((member) => (
                  <div key={member.name} className="info-member">
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      className="info-member__avatar"
                    />
                    <div className="info-member__content">
                      <div className="info-member__header">
                        <span className="info-member__name">{member.name}</span>
                        <Tag color={member.color}>{member.role}</Tag>
                      </div>
                      <p className="info-member__bio">{member.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

'use client';

import { Layout } from 'antd';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import './AppLayout.css';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <Layout className="app-layout">
      <Sidebar />
      <Layout>
        <Header />
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  );
}

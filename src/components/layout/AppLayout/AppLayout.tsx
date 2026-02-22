'use client';

import { Layout } from 'antd';
import { Sidebar } from '../Sidebar/Sidebar';
import { BottomNav } from '../BottomNav/BottomNav';
import { PrivacyBanner } from '../../common/PrivacyBanner/PrivacyBanner';
import { StaleVersionNotifier } from '../../common/StaleVersionNotifier/StaleVersionNotifier';
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
        <Content className="app-content">{children}</Content>
      </Layout>
      <BottomNav />
      <PrivacyBanner />
      <StaleVersionNotifier />
    </Layout>
  );
}

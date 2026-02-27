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
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      <Sidebar />
      <Layout>
        <Content id="main-content" role="main" className="app-content">
          {children}
        </Content>
      </Layout>
      <BottomNav />
      <PrivacyBanner />
      <StaleVersionNotifier />
    </Layout>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { Layout } from 'antd';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopBar } from '../TopBar/TopBar';
import { BottomNav } from '../BottomNav/BottomNav';
import { AnnouncementDisplay } from '../../common/AnnouncementDisplay/AnnouncementDisplay';
import { PrivacyBanner } from '../../common/PrivacyBanner/PrivacyBanner';
import { StaleVersionNotifier } from '../../common/StaleVersionNotifier/StaleVersionNotifier';
import { LiveRegion } from '../../common/LiveRegion/LiveRegion';
import { OfflineIndicator } from '../../common/OfflineIndicator/OfflineIndicator';
import { useLocale } from '@/lib/providers/LocaleProvider';
import './AppLayout.css';

// Ambos son overlays disparados por teclado (⌘K / ?) montados en TODA pagina
// de la app via AppLayout — pero solo hacen falta cuando el usuario realmente
// abre el atajo. `ssr:false` porque son puramente interactivos (sin valor de
// SEO) y sacarlos del bundle inicial no le cambia nada al primer render.
const CommandK = dynamic(
  () => import('../../common/CommandK/CommandK').then((m) => m.CommandK),
  { ssr: false }
);
const HelpShortcutsModal = dynamic(
  () =>
    import('../../common/HelpShortcutsModal/HelpShortcutsModal').then(
      (m) => m.HelpShortcutsModal
    ),
  { ssr: false }
);

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useLocale();

  return (
    <LiveRegion>
      <Layout className="app-layout">
        <a href="#main-content" className="skip-to-content">
          {t('appLayout.skipToContent')}
        </a>
        <Sidebar />
        <Layout>
          <TopBar />
          <AnnouncementDisplay />
          <Content id="main-content" role="main" className="app-content">
            {children}
          </Content>
        </Layout>
        <BottomNav />
        <PrivacyBanner />
        <StaleVersionNotifier />
        <OfflineIndicator />
        <CommandK />
        <HelpShortcutsModal />
      </Layout>
    </LiveRegion>
  );
}

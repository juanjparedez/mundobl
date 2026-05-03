import { Spin } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout/AppLayout';

export default function CatalogoLoading() {
  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" tip="Cargando catálogo..." />
      </div>
    </AppLayout>
  );
}

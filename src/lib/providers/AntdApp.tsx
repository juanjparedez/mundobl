'use client';

import { App } from 'antd';

/**
 * Wrapper client-side del `App` de antd (provee contexto de message/notification/
 * modal). Debe vivir en un Client Component: desde antd 6.5, importar `App`
 * directamente en el root layout (Server Component) evalúa `createContext` en el
 * grafo server y rompe el build ("createContext is not a function").
 */
export function AntdApp({ children }: { children: React.ReactNode }) {
  return <App>{children}</App>;
}

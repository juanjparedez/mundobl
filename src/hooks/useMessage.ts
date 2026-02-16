'use client';

import { App } from 'antd';

/**
 * Hook para usar message de Ant Design correctamente con contexto de tema
 * Resuelve el warning: "Static function can not consume context like dynamic theme"
 */
export function useMessage() {
  const { message } = App.useApp();
  return message;
}

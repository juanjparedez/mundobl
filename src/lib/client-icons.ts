'use client';

/**
 * Re-export client-side de `@ant-design/icons`.
 *
 * El barrel de `@ant-design/icons` y su `Context` corren `createContext` a nivel
 * de módulo SIN `'use client'`. Importar íconos directamente desde un Server
 * Component evalúa ese módulo en el grafo RSC (donde `React.createContext` no
 * existe) y rompe el build con "createContext is not a function" (regresión de
 * antd 6.5). Este módulo pone el boundary `'use client'` una sola vez: cualquier
 * Server Component que necesite un ícono importa desde acá y queda del lado
 * cliente. Los Client Components pueden seguir importando de '@ant-design/icons'
 * directamente sin problema.
 */
export * from '@ant-design/icons';

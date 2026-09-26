'use client';

import { useServerInsertedHTML } from 'next/navigation';

// Desde que las paginas salen renderizadas del servidor, el <style> de antd
// llega en el stream DESPUES de nuestras hojas, y a igual especificidad le
// gana a nuestros overrides (ej. `.app-sidebar { position: fixed }` perdia
// contra `.ant-layout-sider` y el contenido quedaba corrido 250px).
// Este script lo mueve antes del primer CSS de la app, como cuando antd
// inyectaba todo desde el cliente. Los estilos que antd agrega despues se
// encolan detras de este, asi que tambien quedan antes.
const MOVE_ANTD_STYLES_FIRST = `(function(){var l=document.querySelector('link[rel="stylesheet"][data-precedence]');if(!l)return;document.querySelectorAll('style#antd-cssinjs').forEach(function(s){if(l.compareDocumentPosition(s)&4)l.parentNode.insertBefore(s,l)})})()`;

/** Va adentro de AntdRegistry: su script tiene que salir despues del <style>. */
export function AntdStyleOrder() {
  useServerInsertedHTML(() => (
    <script
      key="antd-style-order"
      dangerouslySetInnerHTML={{ __html: MOVE_ANTD_STYLES_FIRST }}
    />
  ));
  return null;
}

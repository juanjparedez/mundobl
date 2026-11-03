/**
 * Genera la hoja estatica de antd (public/antd.css) con el tema
 * por defecto con el que sale el HTML del servidor.
 *
 * Por que: con AntdRegistry, cada pagina server-rendered llevaba ~285 KB de
 * CSS de antd inline en un <style>. Las ~4.000 fichas ISR (series, /ver,
 * actores, tags, productoras...) guardaban esa copia en cada regeneracion:
 * era mas de la mitad de cada ISR write y del CPU de render, las dos cuotas
 * de Vercel que se pasaron (oct y nov 2026). Como hoja aparte, el navegador y
 * el CDN la bajan una vez con hash inmutable y el HTML queda chico.
 *
 * Corre antes de `next dev` y `next build` (ver package.json). El archivo esta
 * en .gitignore: siempre sale de la version de antd y del tema actuales.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { extractStyle } from '@ant-design/static-style-extract';
import * as antd from 'antd';
import { Button, ConfigProvider } from 'antd';
import { buildDefaultTheme } from '../src/lib/theme.config';

const OUTPUT = join(process.cwd(), 'public', 'antd.css');

const SRC = join(process.cwd(), 'src');

/**
 * Componentes de antd que la app importa de verdad. Extraer los ~80 de antd
 * daba 1,1 MB; con los usados alcanza para la primera pintada. Lo que falte
 * (overlays, componentes que se abren al interactuar) lo sigue inyectando
 * antd en el cliente, como siempre.
 */
function collectUsedComponents(dir: string, found: Set<string>): Set<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectUsedComponents(path, found);
    } else if (/\.tsx?$/.test(entry.name)) {
      const source = readFileSync(path, 'utf8');
      for (const match of source.matchAll(
        /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'antd'/g
      )) {
        for (const raw of match[1].split(',')) {
          const name = raw
            .replace(/^\s*type\s+/, '')
            .split(' as ')[0]
            .trim();
          if (/^[A-Z]/.test(name) && !name.endsWith('Props')) found.add(name);
        }
      }
    }
  }
  return found;
}

const includes = [
  ...collectUsedComponents(SRC, new Set<string>()),
  // App.useApp() los pinta desde el layout en todas las paginas.
  'message',
  'notification',
]
  // Fuera los nombres que son solo tipos (ThemeConfig, UploadFile...).
  .filter((name) => antd[name as keyof typeof antd] !== undefined)
  .sort();

const theme = buildDefaultTheme();

const css = extractStyle({
  includes,
  customTheme: (node) => createElement(ConfigProvider, { theme }, node),
});

// El HTML del servidor usa clases `css-<hash>` que dependen del tema. Si el
// hash de la hoja no es el mismo, la primera pintada sale sin estilos de antd
// hasta que hidrata: mejor que el build falle aca.
const sample = renderToString(
  createElement(ConfigProvider, { theme }, createElement(Button, null, 'x'))
);
const hash = /\bcss-[a-z0-9]+\b/.exec(sample)?.[0];
if (!hash || !css.includes(`.${hash}`)) {
  throw new Error(
    `antd.css no coincide con el tema del servidor (hash ${hash ?? 'ausente'}).`
  );
}

writeFileSync(OUTPUT, css);
console.log(
  `public/antd.css: ${(Buffer.byteLength(css) / 1024).toFixed(0)} KB, ${includes.length} componentes (${hash})`
);

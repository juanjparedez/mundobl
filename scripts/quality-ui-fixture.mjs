import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const bundle = await build({
  stdin: {
    contents: `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {App, ConfigProvider} from 'antd'; import es from 'antd/locale/es_ES';
import {LocaleProvider} from './src/lib/providers/LocaleProvider';
import {SupportAdmin} from './src/components/support/SupportAdmin/SupportAdmin';
import {PosterPreview} from './src/components/common/PosterPreview/PosterPreview';
import {SeriesShareButton} from './src/components/common/SeriesShareButton/SeriesShareButton';
import './src/styles/variables.css';
localStorage.setItem('app-locale','es');
const mode=location.pathname;
const fixture=mode==='/admin' ? <SupportAdmin initial={{draft:{intro:'',purpose:'',thanks:'',methods:[]},version:0,enabled:false,updatedAt:null}}/> : <><PosterPreview src={mode==='/broken'?'/missing.png':'/original.png'} alt="Decoding you — fixture" controls={{zoomIn:"Acercar",zoomOut:"Alejar",close:"Cerrar"}} openLabel="Ampliar imagen" errorLabel="No se pudo cargar la imagen original."><img src="/thumb.png" width="230" alt="Póster de prueba"/></PosterPreview><SeriesShareButton title="Decoding you" path="/series/717-decoding-you"/></>;
if(mode==='/cancel') Object.defineProperty(navigator,'share',{value:async()=>{throw new DOMException('Canceled','AbortError')},configurable:true});
else if(mode==='/native') Object.defineProperty(navigator,'share',{value:async data=>{document.getElementById('result').textContent=JSON.stringify(data)},configurable:true});
else Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
createRoot(document.getElementById('root')).render(<ConfigProvider locale={es}><App><LocaleProvider>{fixture}</LocaleProvider></App></ConfigProvider>);
`,
    loader: 'tsx',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  outdir: 'test-results/quality-ui',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  plugins: [
    {
      name: 'router',
      setup(b) {
        b.onResolve({ filter: /^next\/navigation$/ }, () => ({
          path: 'router',
          namespace: 'mock',
        }));
        b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
          contents: 'export const useRouter = () => ({refresh(){}});',
          loader: 'js',
        }));
      },
    },
  ],
});
const js = bundle.outputFiles.find((f) => f.path.endsWith('.js')).text,
  css = bundle.outputFiles.find((f) => f.path.endsWith('.css')).text;
let state = {
  draft: { intro: '', purpose: '', thanks: '', methods: [] },
  version: 0,
  enabled: false,
  updatedAt: null,
};
createServer(async (req, res) => {
  if (req.url === '/api/admin/patrocinio') {
    if (req.method === 'PATCH') {
      let body = '';
      for await (const chunk of req) body += chunk;
      let input = JSON.parse(body);
      if (input.version !== state.version) {
        res.writeHead(409);
        res.end('{}');
        return;
      }
      state = {
        ...state,
        version: state.version + 1,
        ...(input.action === 'save'
          ? { draft: input.content }
          : input.action === 'publish'
            ? { enabled: true }
            : { enabled: false }),
      };
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(state));
    return;
  }
  if (req.url === '/original.png' || req.url === '/thumb.png') {
    res.setHeader('content-type', 'image/png');
    res.end(readFileSync('public/images/og-image.png'));
    return;
  }
  if (req.url === '/missing.png') {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    'content-type',
    req.url === '/bundle.js'
      ? 'text/javascript'
      : req.url === '/bundle.css'
        ? 'text/css'
        : 'text/html'
  );
  res.end(
    req.url === '/bundle.js'
      ? js
      : req.url === '/bundle.css'
        ? css
        : '<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"><body><div id="root"></div><pre id="result"></pre><script src="/bundle.js"></script></body></html>'
  );
}).listen(3111, '127.0.0.1', () =>
  console.log(
    'Local quality UI fixtures: http://127.0.0.1:3111/admin, /poster, /broken, /native. API here is simulated; database tests run separately.'
  )
);

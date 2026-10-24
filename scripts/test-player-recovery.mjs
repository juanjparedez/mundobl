import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium } from 'playwright';

// Exercise the actual fetch handler, including the fallback that previously
// applied indiscriminately to every navigate request.
const workerSource = await fs.readFile('public/sw.js', 'utf8');
const handlers = new Map();
const deleted = [];
let fetched = 0;
let failNetwork = false;
const shell = new Response('offline MundoBL');
const cache = {
  match: async () => shell,
  put: async () => {},
  keys: async () => [],
};
vm.runInNewContext(workerSource, {
  URL,
  Response,
  Set,
  self: {
    location: { origin: 'https://mundobl.test' },
    addEventListener: (name, handler) => handlers.set(name, handler),
    clients: { claim: async () => {} },
  },
  caches: {
    keys: async () => [
      'mundobl-shell-v8',
      'mundobl-img-v8',
      'mundobl-shell-v9',
      'unrelated-cache',
    ],
    delete: async (key) => {
      deleted.push(key);
      return true;
    },
    open: async () => cache,
  },
  fetch: async () => {
    fetched++;
    if (failNetwork) throw new Error('offline');
    return new Response('network');
  },
});
async function request(url, destination, mode = 'navigate', method = 'GET') {
  let response;
  handlers.get('fetch')({
    request: { url, destination, mode, method },
    respondWith: (value) => {
      response = value;
    },
  });
  return response;
}
for (const origin of [
  'https://mundobl.test',
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
  'https://geo.dailymotion.com',
]) {
  for (const destination of [
    'iframe',
    'frame',
    'embed',
    'object',
    'video',
    'audio',
  ]) {
    assert.equal(await request(`${origin}/video`, destination), undefined);
  }
}
assert.equal(fetched, 0, 'frames/media must bypass the SW entirely');
assert.equal(await request('https://elsewhere.test/', 'document'), undefined);
assert.equal(
  await request('https://mundobl.test/api/user/me', '', 'cors'),
  undefined
);
assert.equal(
  await request('https://mundobl.test/_next/static/app.js', 'script', 'cors'),
  undefined
);
assert.equal(
  await request('https://mundobl.test/api/user', '', 'cors', 'POST'),
  undefined
);
assert.equal(
  await (await request('https://mundobl.test/ver/806', 'document')).text(),
  'network'
);
failNetwork = true;
assert.equal(
  await (await request('https://mundobl.test/ver/806', 'document')).text(),
  'offline MundoBL'
);
let activation;
handlers.get('activate')({
  waitUntil: (promise) => {
    activation = promise;
  },
});
await activation;
assert.deepEqual(deleted, ['mundobl-shell-v8', 'mundobl-img-v8']);
console.log(
  'PASS: SW bypasses embedded players/media; only same-origin pages receive offline fallback; migration preserves unrelated caches.'
);

// Real browser, isolated profile and local fixture. Only the external video
// response is simulated; components, storage, SW registration and reset are real.
const bundle = await build({
  stdin: {
    contents: `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ConfigProvider} from 'antd';
import {EmbedPlayer} from './src/components/common/EmbedPlayer/EmbedPlayer';
import {PlayerRecovery} from './src/components/common/PlayerRecovery/PlayerRecovery';
import {MESSAGES} from './src/i18n/messages';
const strings = MESSAGES.es;
function Fixture() {
  const [attempt, setAttempt] = useState(0);
  return <ConfigProvider><main>
    <EmbedPlayer key={attempt} platform="Vimeo" url="https://vimeo.com/129009162" videoId="129009162" title="Yu and Rachel" openLabel="Abrir en Vimeo"/>
    <PlayerRecovery url="https://vimeo.com/129009162" onRetry={() => setAttempt(n => n + 1)} labels={{...strings.playerRecovery,confirm:strings.playerRecovery.reset,open:'Abrir en Vimeo'}}/>
  </main></ConfigProvider>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);`,
    loader: 'tsx',
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  outdir: 'fixture',
  platform: 'browser',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text;
const tokens = await fs.readFile('src/styles/variables.css', 'utf8');
const server = createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/sw.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(workerSource);
  } else if (req.url === '/bundle.js') {
    res.setHeader('Content-Type', 'text/javascript');
    res.end(js);
  } else if (req.url === '/style.css') {
    res.setHeader('Content-Type', 'text/css');
    res.end(tokens + css);
  } else {
    res.setHeader('Content-Type', 'text/html');
    res.end(
      '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
    );
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseURL = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const errors = [];
let frames = 0;
await context.route('https://player.vimeo.com/**', async (route) => {
  frames++;
  await route.fulfill({
    contentType: 'text/html',
    body: '<p>Provider fixture</p>',
  });
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
page.on('pageerror', (error) => errors.push(error.message));
const button = (name) => page.getByRole('button', { name, exact: false });
const help = () =>
  page.getByText('¿No se ve el video?', { exact: true }).click();
const repair = async () => {
  await button('Reiniciar reproducción').click();
  await button('Reiniciar reproducción').last().click();
  await page.getByRole('tooltip').waitFor({ state: 'hidden' });
};
try {
  await page.goto(baseURL);
  await help();
  await button('Revisar datos locales').click();
  await page
    .getByText('No se encontraron cachés ni una instalación local del sitio.')
    .waitFor();
  await page.evaluate(async () => {
    localStorage.setItem('mundobl.preference.fixture', 'keep-theme');
    localStorage.setItem('mundobl.progress.fixture', 'keep-progress');
    sessionStorage.setItem('keep', 'session-data');
    document.cookie = 'session-fixture=keep; SameSite=Lax; path=/';
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.evaluate(async () => {
    await caches.open('mundobl-recovery-fixture');
  });
  await button('Revisar datos locales').click();
  await page
    .getByText(
      'Hay datos locales de MundoBL. Su presencia es normal y no indica un error.'
    )
    .waitFor();
  const before = frames;
  await button('Recargar reproductor').click();
  await page.waitForFunction(
    () => document.querySelector('iframe')?.contentWindow !== null
  );
  await page.frameLocator('iframe').getByText('Provider fixture').waitFor();
  assert(frames > before, 'retry remounts the real EmbedPlayer');
  await button('Reiniciar reproducción').click();
  await button('Cancelar').click();
  await page.getByRole('tooltip').waitFor({ state: 'hidden' });
  assert(
    (await page.evaluate(() => caches.keys())).includes(
      'mundobl-recovery-fixture'
    )
  );
  const navigation = page.waitForEvent('load');
  await repair();
  await navigation;
  const state = await page.evaluate(async () => ({
    keys: await caches.keys(),
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
    preference: localStorage.getItem('mundobl.preference.fixture'),
    progress: localStorage.getItem('mundobl.progress.fixture'),
    sessionData: sessionStorage.getItem('keep'),
    cookie: document.cookie,
  }));
  assert.deepEqual(state.keys, []);
  assert.equal(state.registrations, 0);
  assert.equal(state.preference, 'keep-theme');
  assert.equal(state.progress, 'keep-progress');
  assert.equal(state.sessionData, 'session-data');
  assert.match(state.cookie, /session-fixture=keep/);
  await help();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
  });
  await repair();
  await page
    .getByRole('alert')
    .getByText(
      'El navegador está sin conexión. Reconectate antes de reiniciar la reproducción.'
    )
    .waitFor();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: async () => {
          throw new Error('storage denied');
        },
      },
    });
  });
  await button('Revisar datos locales').click();
  await page
    .getByRole('alert')
    .getByText(
      'No se pudieron revisar los datos locales. Podés volver a intentarlo.'
    )
    .waitFor();
  await repair();
  await page
    .getByRole('alert')
    .getByText(
      'No se pudo completar el reinicio. Probá de nuevo o abrí el video en la plataforma.'
    )
    .waitFor();
  await page.evaluate(() => {
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: { keys: () => new Promise(() => {}) },
    });
  });
  await button('Revisar datos locales').click();
  await page
    .getByRole('alert')
    .getByText(
      'No se pudieron revisar los datos locales. Podés volver a intentarlo.'
    )
    .waitFor({ timeout: 8000 });
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await button('Reiniciar reproducción').click();
    const popup = page.getByRole('tooltip');
    await popup.waitFor();
    const bounds = await popup.boundingBox();
    assert(
      bounds && bounds.x >= 0 && bounds.x + bounds.width <= width,
      `confirmation fits at ${width}`
    );
    await button('Cancelar').click();
    await popup.waitFor({ state: 'hidden' });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `no horizontal overflow at ${width}`
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS: player retry, inspection, cancellation, real SW/cache reset + reload; cookies, preferences and saved progress preserved; offline/error/timeout handling; widths 320/390/1280. External video response simulated.'
  );
} catch (error) {
  console.error('Browser errors:', errors);
  console.error('Accessibility:', await page.locator('body').ariaSnapshot());
  console.error(
    'Rendered fixture:',
    (await page.locator('body').innerText()).slice(0, 2500)
  );
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

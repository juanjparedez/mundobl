const SHELL_CACHE = 'mundobl-shell-v4';
const IMAGE_CACHE = 'mundobl-img-v4';
const IMAGE_CACHE_MAX_ENTRIES = 250;

const PRECACHE_URLS = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const KEEP = new Set([SHELL_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const toDelete = keys.length - maxEntries;
  for (let i = 0; i < toDelete; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function cacheFirst(request, cacheName, opts = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (
      response &&
      response.ok &&
      (response.type === 'basic' || response.type === 'default')
    ) {
      cache.put(request, response.clone()).then(() => {
        if (opts.maxEntries) trimCache(cacheName, opts.maxEntries);
      });
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navegaciones: network-first con fallback al shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((r) => r ?? Response.error())
      )
    );
    return;
  }

  // Imágenes optimizadas por Next.js: cache-first, mismo origen pero bajo /_next/image
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith('/_next/image')
  ) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE, {
        maxEntries: IMAGE_CACHE_MAX_ENTRIES,
      })
    );
    return;
  }

  // Otros assets de _next (chunks JS/CSS) los maneja el HTTP cache del navegador
  if (url.pathname.startsWith('/_next/')) return;
  if (url.pathname.startsWith('/api/')) return;

  // Solo cacheamos same-origin de aquí en adelante
  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?)$/i.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

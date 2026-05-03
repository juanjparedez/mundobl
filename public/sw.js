const SHELL_CACHE = 'mundobl-shell-v5';
const IMAGE_CACHE = 'mundobl-img-v5';
const REMOTE_IMAGE_CACHE = 'mundobl-remote-img-v5';
const IMAGE_CACHE_MAX_ENTRIES = 250;
const REMOTE_IMAGE_CACHE_MAX_ENTRIES = 500;

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
  const KEEP = new Set([SHELL_CACHE, IMAGE_CACHE, REMOTE_IMAGE_CACHE]);
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
      (response.type === 'basic' ||
        response.type === 'default' ||
        response.type === 'cors')
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

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Navegaciones: network-first con fallback al shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((r) => r ?? Response.error())
      )
    );
    return;
  }

  // Imágenes optimizadas por Next.js: cache-first
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

  // Imágenes remotas servidas directo desde Supabase Storage (cross-origin)
  // Las cacheamos cache-first para no agotar la cuota de transformaciones
  // de Vercel ni el egress del free tier de Supabase.
  if (
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/storage/')
  ) {
    event.respondWith(
      cacheFirst(request, REMOTE_IMAGE_CACHE, {
        maxEntries: REMOTE_IMAGE_CACHE_MAX_ENTRIES,
      })
    );
    return;
  }

  // Resto de _next y APIs: que los maneje el HTTP cache del navegador
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/'))
  ) {
    return;
  }

  // Solo cacheamos same-origin de aquí en adelante
  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    /\.(png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?)$/i.test(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

const SHELL_CACHE = 'mundobl-shell-v8';
const IMAGE_CACHE = 'mundobl-img-v8';
const REMOTE_IMAGE_CACHE = 'mundobl-remote-img-v8';
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
    // Defensivo: si la query es inválida (ej. q=0 cacheado en una versión
    // anterior), saltamos cache y dejamos que el server responda en limpio.
    const q = url.searchParams.get('q');
    const qNum = q === null ? null : Number(q);
    if (qNum !== null && (Number.isNaN(qNum) || qNum < 1 || qNum > 100)) {
      return;
    }
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

// ─────────────────────────────────────────────────────────────────────
// Web Push: handlers de "push" y "notificationclick".
// Recibimos un payload JSON desde el servidor con la forma:
//   { title, body, url, tag, type, data }
// Mostramos la notificacion del SO y al click la abrimos en una
// pestaña existente si el sitio ya esta abierto, o creamos una nueva.
// ─────────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MundoBL', body: event.data.text() };
  }

  const title = payload.title || 'MundoBL';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    // Tag: si llegan varias del mismo tipo, el browser puede agruparlas
    // o reemplazarlas. Usamos type+url como tag por defecto.
    tag: payload.tag || `${payload.type || 'mundobl'}-${payload.url || ''}`,
    // renotify: aunque haya una previa con el mismo tag, vibrar/sonar.
    renotify: false,
    // data viaja al click handler.
    data: {
      url: payload.url || '/notificaciones',
      type: payload.type || null,
      ...(payload.data || {}),
    },
    // En mobile, dejar vibrar avisa mejor que el sonido (que muchas
    // veces esta silenciado por horario).
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    '/notificaciones';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Si hay una pestaña con el mismo origen, focusearla y navegar.
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl, self.location.origin);
          if (clientUrl.origin === target.origin) {
            await client.focus();
            // Solo navegamos si la URL difiere (evita reload innecesario).
            if (clientUrl.pathname + clientUrl.search !== target.pathname + target.search) {
              if ('navigate' in client) {
                await client.navigate(target.toString());
              }
            }
            return;
          }
        } catch {
          /* ignore */
        }
      }
      // Si no hay ninguna pestaña abierta, abrir nueva.
      await self.clients.openWindow(targetUrl);
    })()
  );
});

// Subscripcion expirada o cambiada por el browser: avisamos al server
// para que limpie la fila vieja y el cliente se vuelva a suscribir
// la proxima vez que entre.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldEndpoint = event.oldSubscription?.endpoint;
        if (oldEndpoint) {
          await fetch(
            `/api/push/subscribe?endpoint=${encodeURIComponent(oldEndpoint)}`,
            { method: 'DELETE' }
          ).catch(() => undefined);
        }
      } catch {
        /* best-effort */
      }
    })()
  );
});

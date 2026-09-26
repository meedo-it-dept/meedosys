// MEEDOSys Progressive Web App Service Worker
// Municipality of Malungon - Municipal Economic Enterprise Development Office

const CACHE_NAME = 'meedosys-cache-v2.0.1';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CORE_ASSETS).catch((err) => {
          console.warn('[PWA SW] Pre-cache addAll warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale previous caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[PWA SW] Clearing legacy cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests and browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Never cache Supabase auth or real-time websocket requests
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Static Assets (images, fonts, scripts, css) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf|css|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // HTML Pages / Navigations -> Network-First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback to cached home page shell
        const rootFallback = await caches.match('/');
        if (rootFallback) return rootFallback;

        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>MEEDOSys Offline</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
              .card { background: white; border-radius: 16px; padding: 32px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
              .icon { font-size: 48px; margin-bottom: 12px; }
              h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #0f172a; }
              p { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 20px; }
              button { background: #2563eb; color: white; border: none; font-weight: 700; font-size: 14px; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">📡</div>
              <h1>You are currently offline</h1>
              <p>MEEDOSys could not connect to the municipal server. Please check your cellular data or Wi-Fi connection.</p>
              <button onclick="window.location.reload()">Retry Connection</button>
            </div>
          </body>
          </html>`,
          {
            headers: { 'Content-Type': 'text/html' },
          }
        );
      })
  );
});

// Message Listener for Instant Update Prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

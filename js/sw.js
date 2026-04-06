const CACHE_VERSION = '__GIT_COMMIT_SHORT_SHA__';
const CACHE_NAME = `hakyll-blog-static-${CACHE_VERSION}`;
const PAGE_CACHE_NAME = `hakyll-blog-pages-${CACHE_VERSION}`;

const MANIFEST_PATH = '/favicon/site.webmanifest';
const PRECACHE_URLS = [
  '/css/site.css',
  '/js/toc.js',
  '/js/nav.js',
  '/js/copy-code.js',
  MANIFEST_PATH
];

const STATIC_ASSET_PATTERNS = [
  /\/css\//,
  /\/js\//,
  /\/assets\//,
  /\/favicon\//,
  /\/favicon\.ico$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => null))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([CACHE_NAME, PAGE_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('hakyll-blog-') && !currentCaches.has(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isStaticRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname) || pattern.test(url.host));
}

function isDocumentRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  const acceptHeader = request.headers.get('accept') || '';
  return request.mode === 'navigate' || acceptHeader.includes('text/html');
}

function isManifestRequest(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin && url.pathname === MANIFEST_PATH;
}

function offlineDocumentResponse() {
  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your network connection and try again.</p></body></html>',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store'
      }
    }
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Let the browser fetch manifest directly to avoid SW cold-start overhead.
  if (isManifestRequest(request)) return;

  if (isDocumentRequest(request)) {
    event.respondWith(
      caches.open(PAGE_CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              const contentType = response.headers.get('content-type') || '';
              if (response && response.ok && contentType.includes('text/html')) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached || offlineDocumentResponse());

          if (cached) {
            // Serve cache immediately and refresh page cache in the background.
            event.waitUntil(networkFetch);
            return cached;
          }

          return networkFetch;
        })
      )
    );
    return;
  }

  if (!isStaticRequest(request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached || Response.error());

        // Return cached asset immediately, then refresh in background.
        return cached || networkFetch;
      })
    )
  );
});

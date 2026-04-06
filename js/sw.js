const CACHE_VERSION = '__GIT_COMMIT_SHORT_SHA__';
const CACHE_NAME = `hakyll-blog-static-${CACHE_VERSION}`;

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
  // Activate new versions quickly so users benefit from updated cache logic.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('hakyll-blog-static-') && key !== CACHE_NAME)
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

self.addEventListener('fetch', (event) => {
  const { request } = event;

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
          .catch(() => cached);

        // Return cached asset immediately, then refresh in background.
        return cached || networkFetch;
      })
    )
  );
});

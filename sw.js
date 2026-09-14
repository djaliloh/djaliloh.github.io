/* ============================================================
   Service worker: offline shell for the portfolio.

   Strategy
     · navigations  : network-first, fall back to cache, then /offline.html
     · same-origin  : stale-while-revalidate (CSS / JS / images)
     · third party  : cache-first, refreshed in the background
   ============================================================ */

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const OFFLINE_URL = '/offline.html';

/* Pages and assets pre-cached on install so the site opens offline. */
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/pages/publication.html',
  '/pages/projects.html',
  '/pages/experience.html',
  '/pages/teaching.html',
  '/pages/blog.html',
  '/pages/curriculumv.html',
  '/styles/styles.css',
  '/styles/base/tokens.css',
  '/styles/base/reset.css',
  '/styles/base/utilities.css',
  '/styles/base/print.css',
  '/styles/layout/container.css',
  '/styles/layout/nav.css',
  '/styles/layout/tabbar.css',
  '/styles/layout/footer.css',
  '/styles/components/buttons.css',
  '/styles/components/cards.css',
  '/styles/components/hero.css',
  '/styles/components/publications.css',
  '/styles/components/timeline.css',
  '/styles/components/teaching.css',
  '/assets/js/app.js',
  '/assets/js/modules/config.js',
  '/assets/js/modules/i18n.js',
  '/assets/js/modules/theme.js',
  '/assets/js/modules/nav.js',
  '/assets/js/modules/reveal.js',
  '/assets/js/modules/back-to-top.js',
  '/assets/js/modules/clipboard.js',
  '/assets/js/modules/pwa.js',
  '/assets/i18n/fr.json',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.png',
  '/images/adjalil.jpeg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll() is atomic: one 404 would discard the whole shell, so each
      // asset is requested individually and failures are tolerated.
      .then((cache) => Promise.all(SHELL_ASSETS.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isThirdParty(url) {
  return url.origin !== self.location.origin;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isThirdParty(url)) {
    // Font Awesome / Google Fonts: versioned URLs, safe to serve from cache.
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

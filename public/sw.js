const CACHE = 'mpact-v4'
const PRECACHE = ['/index.html']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) return

  // Navigations (the app shell / HTML) are ALWAYS network-first so new deploys show up
  // immediately — never serve a stale page from cache while online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') || caches.match(event.request))
    )
    return
  }

  // Other GETs (hashed JS/CSS/images): network-first, fall back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE).then(cache => cache.put(event.request, clone)).catch(() => {})
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

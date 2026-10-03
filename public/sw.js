// Kill switch. A previous build shipped a caching service worker that kept serving
// a stale app. This replaces it: clear every cache, unregister this worker, and
// reload open tabs so everyone loads the latest app directly from the network.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    } catch (e) {}
    try { await self.registration.unregister() } catch (e) {}
    const clients = await self.clients.matchAll({ type: 'window' })
    clients.forEach(c => { try { c.navigate(c.url) } catch (e) {} })
  })())
})

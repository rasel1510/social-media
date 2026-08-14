// Self-unregistering service worker
// This replaces any previously registered service worker and immediately unregisters itself
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      ),
      // Unregister this service worker
      self.registration.unregister(),
    ])
  );
});

// Service Worker básico para que el navegador reconozca la PWA
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('fetch', (e) => {});
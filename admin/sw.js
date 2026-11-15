/* Client Hub service worker: makes the hub installable as an app and keeps the look (styles, scripts, icons)
   available offline. Pages and client data are never cached, so nothing private is stored on the phone. */
const CACHE = 'skhub-shell-v1';
const SHELL = ['assets/admin.css', 'assets/admin.js', 'assets/icons/icon-192.png', '../assets/img/logo.png', 'offline.html'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(() => caches.match('offline.html'))); return; }
  if (/\.(css|js|png|svg|woff2?)(\?|$)/.test(r.url)) {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
      const net = fetch(r).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(r, res.clone())); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});

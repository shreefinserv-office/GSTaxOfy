// GStaxOfy Service Worker
// To push an update: bump APP_VERSION below, commit to GitHub.
// Users clicking "Check for Update" will get the new version automatically.

const APP_VERSION = '1.0.0';
const CACHE_NAME  = 'gstaxofy-' + APP_VERSION;
const CACHE_BASE  = 'gstaxofy';

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            const core = [
                './index.html',
                './css/style.css',
                './js/supabase-config.js',
                './js/app.js',
                './js/sidebar.js',
                './js/layout.js',
                './manifest.json',
                './assets/logo.png',
                './assets/icon-192.png',
                './assets/icon-512.png',
                './pages/dashboard.html',
                './pages/Masters/clients.html',
                './pages/Masters/firm-details.html',
                './pages/Masters/users.html',
                './pages/Masters/services.html',
                './pages/Masters/backup.html',
                './pages/audit-log.html',
                './pages/change-password.html',
            ];
            return Promise.allSettled(core.map(url => cache.add(url).catch(() => {})));
        }).then(() => self.skipWaiting())
    );
});

// ── Activate: delete old caches ──────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k.startsWith(CACHE_BASE) && k !== CACHE_NAME)
                    .map(k => {
                        console.log('[SW] Deleting old cache:', k);
                        return caches.delete(k);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ── Message handler ───────────────────────────────────────────
self.addEventListener('message', event => {
    // Called by "Check for Update" button — clears all caches and reloads
    if (event.data && event.data.type === 'CLEAR_CACHE_AND_UPDATE') {
        caches.keys().then(keys => {
            Promise.all(keys.map(k => caches.delete(k))).then(() => {
                self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
                    clients.forEach(c => c.postMessage({ type: 'RELOAD_NOW' }));
                });
            });
        });
    }
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    // Page asking for current SW version
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'SW_VERSION', version: APP_VERSION });
    }
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always network-first for Supabase
    if (url.hostname.includes('supabase.co')) return;

    // Cache-first for everything else
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response.ok && event.request.method === 'GET' &&
                    url.origin === self.location.origin) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                if (event.request.headers.get('accept')?.includes('text/html'))
                    return caches.match('./index.html');
            });
        })
    );
});

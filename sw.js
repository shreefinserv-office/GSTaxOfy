// GStaxOfy Service Worker
// To push an update: bump APP_VERSION below, commit to GitHub.
// Users clicking "Check for Update" will get the new version automatically.

const APP_VERSION = '6.5.3';
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
                './pages/Tasks/manage-tasks.html',
                './pages/Tasks/create-task.html',
                './pages/Invoices/generate.html',
                './pages/Invoices/list.html',
                './pages/Receipts/generate.html',
                './pages/Receipts/list.html',
                './pages/Reports/account-ledger.html',
                './pages/Reports/work-log.html',
                './pages/Reports/receivables.html',
                './pages/Reports/profitability.html',
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
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'SW_VERSION', version: APP_VERSION });
    }
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always network-first for Supabase & CDN resources
    if (url.hostname.includes('supabase.co') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('cdn.jsdelivr.net')) return;

    // Network-first for HTML pages (so updates propagate)
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok && event.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
        );
        return;
    }

    // Cache-first for assets (CSS, JS, images)
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
            }).catch(() => {});
        })
    );
});

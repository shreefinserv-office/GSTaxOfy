// sw.js — GStaxOfy Service Worker
const CACHE_NAME = 'gstaxofy-v1';

// Files to cache for offline shell
const STATIC_ASSETS = [
    '/GStaxOfy/',
    '/GStaxOfy/index.html',
    '/GStaxOfy/css/style.css',
    '/GStaxOfy/js/supabase-config.js',
    '/GStaxOfy/js/app.js',
    '/GStaxOfy/js/sidebar.js',
    '/GStaxOfy/js/layout.js',
    '/GStaxOfy/pages/dashboard.html',
    '/GStaxOfy/pages/Masters/clients.html',
    '/GStaxOfy/pages/Masters/firm-details.html',
    '/GStaxOfy/pages/Masters/users.html',
    '/GStaxOfy/pages/Masters/services.html',
    '/GStaxOfy/pages/audit-log.html',
    '/GStaxOfy/pages/change-password.html',
    '/GStaxOfy/assets/logo.png',
    '/GStaxOfy/assets/icon-192.png',
    '/GStaxOfy/assets/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Install: cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching app shell');
            // Cache individually so one failure doesn't break all
            return Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(() => console.warn('[SW] Failed to cache:', url)))
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always go network-first for Supabase API calls
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'Offline — no network' }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        return;
    }

    // Cache-first for everything else (HTML, CSS, JS, fonts)
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Cache successful GET responses
                if (event.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback for HTML navigation
                if (event.request.destination === 'document') {
                    return caches.match('/GStaxOfy/index.html');
                }
            });
        })
    );
});

// ========================================
// SERVICE WORKER - DISFRACES FANTASÍA
// Caché offline para recursos estáticos
// ========================================

const CACHE_NAME = 'disfraces-fantasia-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/config.js',
    '/logo-tienda.jpg',
    '/facebook-logo.png',
    '/instagram-logo.png',
    '/whatsapp-logo.png',
    '/tiktok-logo.png',
    '/ubicacion-logo.png',
    '/telefono-logo.webp',
    '/correo-logo.png',
    '/reloj-logo.png'
];

// Instalación: precachear recursos estáticos
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precacheando recursos estáticos');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Error cacheando algunos recursos:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: estrategia Cache First, luego Network
self.addEventListener('fetch', (event) => {
    // No cachear requests a Google APIs
    if (event.request.url.includes('googleapis.com') ||
        event.request.url.includes('google.com/gsi')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si está en caché, devolverlo
            if (cachedResponse) {
                return cachedResponse;
            }

            // Si no, hacer fetch de red
            return fetch(event.request).then((networkResponse) => {
                // Cacheear solo si es GET y éxito
                if (event.request.method === 'GET' && networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si falla red y caché, retornar página offline
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Actualización de caché bajo demanda
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

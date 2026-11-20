// ========== SERVICE WORKER — COPIHUE PUNTO DE VENTA ==========
const VERSION = 'copihue-venta-v62';
const CACHE_ESTATICO = [
    '/seba21.html',
    '/manifest-venta.json'
];

// INSTALAR — cachear archivos estáticos
self.addEventListener('install', event => {
    console.log('📦 SW Venta instalando...');
    event.waitUntil(
        caches.open(VERSION).then(cache => {
            return cache.addAll(CACHE_ESTATICO);
        }).then(() => {
            console.log('✅ SW Venta instalado');
            return self.skipWaiting(); // Activar inmediatamente
        })
    );
});

// ACTIVAR — limpiar caches viejos
self.addEventListener('activate', event => {
    console.log('🚀 SW Venta activando...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== VERSION)
                    .map(key => {
                        console.log('🗑 Eliminando cache viejo:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('✅ SW Venta activo');
            return self.clients.claim(); // Tomar control de todas las pestañas
        })
    );
});

// FETCH — estrategia según tipo de recurso
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // La API de Google siempre va a la red (nunca cachear datos en tiempo real)
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({
                    error: true,
                    offline: true,
                    mensaje: 'Sin conexión — los datos se actualizarán cuando vuelva internet'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    if (event.request.method !== 'GET') return;

    // seba21.html y venta.html — Network First:
    // Siempre intentar la red; el cache es solo fallback sin conexión.
    // Así cada deploy se refleja en la próxima carga, sin necesitar doble recarga.
    const esHTML = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');
    if (esHTML) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        // Actualizar cache con la versión nueva (para offline)
                        const clone = response.clone();
                        caches.open(VERSION).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Sin red — servir desde cache (modo offline)
                    return caches.match(event.request)
                        .then(cached => cached || caches.match('/venta.html'));
                })
        );
        return;
    }

    // Todo lo demás (manifest, íconos, imágenes) — Cache First, red como respaldo
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(VERSION).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match('/venta.html'));
        })
    );
});

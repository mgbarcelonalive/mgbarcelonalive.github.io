const CACHE_NAME = 'mg-bcn-live-v22';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/EULA_LICENCIA.txt'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Nunca cachear el stream de audio en directo, vídeos pesados ni los catálogos JSON en vivo
  if (
    url.hostname.includes('trycloudflare.com') ||
    url.pathname.endsWith('/stream') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('plantilla_live.json') ||
    url.pathname.endsWith('videos.json') ||
    url.pathname.endsWith('publicidad.json') ||
    url.pathname.endsWith('eventos_fotos.json') ||
    url.pathname.endsWith('fondos.json')
  ) {
    return;
  }

  // Estrategia Network-First con respaldo en caché para cumplir 100% los requisitos PWA de Android/Chrome e iOS
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
  );
});

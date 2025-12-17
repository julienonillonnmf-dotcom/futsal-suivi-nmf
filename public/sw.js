// Service Worker pour Futsal NMF PWA
// Ce fichier permet à l'app de fonctionner offline

const CACHE_NAME = 'futsal-nmf-v1';
const STATIC_CACHE = 'futsal-nmf-static-v1';

// URLs à mettre en cache au démarrage
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo NMF Rose.png',
  '/vite.svg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('⚠️ Some assets could not be cached:', error);
        // Ne pas bloquer si certains assets ne peuvent pas être cachés
        return cache.addAll(urlsToCache.filter(url => url !== '/Logo NMF Rose.png'));
      });
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { destination, method } = request;

  // Ignorer les POST, PUT, DELETE
  if (method !== 'GET') {
    return;
  }

  // Pour les documents HTML, essayer le réseau d'abord
  if (destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache les réponses réussies
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback au cache si offline
          return caches.match(request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Pour les autres fichiers (JS, CSS, images), cache d'abord
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        // Mettre en cache les réponses réussies
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Pas d'image de fallback pour les images
        if (destination === 'image') {
          return new Response('<svg role="img" aria-label="Image non disponible" viewBox="0 0 100 100"></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
        return new Response('Offline - Contenu non disponible', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// Message depuis le client (optionnel)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker loaded');

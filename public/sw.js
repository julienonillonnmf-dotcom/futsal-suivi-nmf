// public/sw.js - Service Worker avec Push Notifications
// Pour Futsal NMF PWA avec Firebase Cloud Messaging

const CACHE_NAME = 'futsal-nmf-v1';
const STATIC_CACHE = 'futsal-nmf-static-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo NMF Rose.png',
  '/vite.svg'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn('⚠️ Some assets could not be cached:', error);
        return cache.addAll(urlsToCache.filter(url => url !== '/Logo NMF Rose.png'));
      });
    })
  );
  self.skipWaiting();
});

// Activation
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

// Fetch events (offline support)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { destination, method } = request;

  if (method !== 'GET') {
    return;
  }

  if (destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
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

// 🔔 PUSH NOTIFICATION EVENTS
// Réception d'une notification push de Firebase
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');

  if (!event.data) {
    console.warn('⚠️ No push data');
    return;
  }

  let notificationData = {};

  try {
    notificationData = event.data.json();
  } catch (e) {
    console.warn('Could not parse push data as JSON, using text:', e);
    notificationData = {
      title: 'Futsal NMF',
      body: event.data.text(),
    };
  }

  const title = notificationData.title || 'Futsal NMF';
  const options = {
    body: notificationData.body || 'Nouvelle notification',
    icon: '/Logo NMF Rose.png',
    badge: '/Logo NMF Rose.png',
    tag: notificationData.tag || 'futsal-notification',
    requireInteraction: false,
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('✅ Notification clicked', event.notification.tag);
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Voir si l'app est déjà ouverte
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir l'app
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Fermer la notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification.tag);
});

// Message depuis le client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker with Push Notifications loaded');

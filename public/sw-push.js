// Push notification handler for service worker
// This file will be imported by the main service worker

// Force immediate activation on install
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing new version...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Claim all clients immediately on activation
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating new version...');
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            // Delete old versioned caches
            if (cacheName.startsWith('workbox-') || 
                cacheName.includes('-precache-') ||
                cacheName.includes('runtime-')) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  let data = {
    title: 'Igreja da Promessa',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'default',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: {
          url: payload.url || payload.data?.url || '/',
          ...payload.data
        }
      };
    } catch (e) {
      // If not JSON, use text
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  // The subscription has changed, the user needs to re-subscribe
  // This is handled by the frontend usePushNotifications hook
});

// Listen for messages from the main thread to force update
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received skip waiting message');
    self.skipWaiting();
  }
});

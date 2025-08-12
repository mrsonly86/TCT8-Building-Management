// Service Worker for TCT8 Building Management PWA
const CACHE_NAME = 'tct8-building-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/apartments.html',
    '/residents.html',
    '/fees.html',
    '/reports.html',
    '/notifications.html',
    '/css/style.css',
    '/js/main.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/apartments.js',
    '/js/residents.js',
    '/js/fees.js',
    '/js/reports.js',
    '/js/notifications.js',
    '/data/sample-data.json',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Sync offline data when back online
    return new Promise((resolve) => {
        console.log('Background sync triggered');
        resolve();
    });
}

// Push notification handling
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Có thông báo mới từ TCT8 Building',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: 'Xem chi tiết',
                icon: '/assets/icons/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Đóng',
                icon: '/assets/icons/icon-192x192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('TCT8 Building Management', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/notifications.html')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
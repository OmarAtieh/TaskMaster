// Service Worker for offline functionality

const CACHE_NAME = 'taskmaster-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/themes.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/storage-manager.js',
  '/js/graphics.js',
  '/js/sound-effects.js',
  '/js/task-manager.js',
  '/js/category-manager.js',
  '/js/sync-manager.js',
  '/js/notification-manager.js',
  '/js/gamification-system.js',
  '/js/ui-manager.js',
  '/views/tasks.js',
  '/views/daily.js',
  '/views/progress.js',
  '/views/achievements.js',
  '/views/settings.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - respond with cached assets or fetch from network
self.addEventListener('fetch', event => {
  // Skip Google API requests (they need fresh responses)
  if (event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Fetch from network
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Add to cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncData());
  }
});

// Simple function to attempt data sync
function syncData() {
  // This would normally communicate with the main thread
  // to trigger synchronization with Google Sheets
  return Promise.resolve();
}
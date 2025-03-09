//GitHub Pages aware service workers
const BASE_PATH = location.pathname.slice(0, location.pathname.lastIndexOf('/'));

// Service Worker for offline functionality

const CACHE_NAME = 'taskmaster-v1';
const ASSETS_TO_CACHE = [
  '${BASE_PATH}/',
  '${BASE_PATH}/index.html',
  '${BASE_PATH}/manifest.json',
  '${BASE_PATH}/css/styles.css',
  '${BASE_PATH}/css/themes.css',
  '${BASE_PATH}/css/animations.css',
  '${BASE_PATH}/js/app.js',
  '${BASE_PATH}/js/storage-manager.js',
  '${BASE_PATH}/js/graphics.js',
  '${BASE_PATH}/js/sound-effects.js',
  '${BASE_PATH}/js/task-manager.js',
  '${BASE_PATH}/js/category-manager.js',
  '${BASE_PATH}/js/sync-manager.js',
  '${BASE_PATH}/js/notification-manager.js',
  '${BASE_PATH}/js/gamification-system.js',
  '${BASE_PATH}/js/ui-manager.js',
  '${BASE_PATH}/views/tasks.js',
  '${BASE_PATH}/views/daily.js',
  '${BASE_PATH}/views/progress.js',
  '${BASE_PATH}/views/achievements.js',
  '${BASE_PATH}/views/settings.js'
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
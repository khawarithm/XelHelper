const CACHE_NAME = 'survivor-apocalyps-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'game.html',
  'about.html',
  'css/style.css',
  'css/game.css',
  'js/firebase.js',
  'js/main.js',
  'js/ui.js',
  'js/game.js',
  'assets/unit.png',
  'assets/z.png',
  'assets/bgui.png',
  'assets/bgs.png',
  'assets/coin.png',
  'manifest.json'
];

// Install Service Worker & Cache Assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate & Clear Old Cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// Fetch Assets from Cache first, then Network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

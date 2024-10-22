// SW Version
const version = '1.1';

const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js',
];

// SW Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(`static-${version}`).then((cache) => cache.addAll(appAssets))
  );
});

// SW Activate
self.addEventListener('activate', (e) => {
  let cleaned = caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== `static-${version}` && key.match('static-')) {
        return caches.delete(key);
      }
    });
  });

  e.waitUntil(cleaned);
});

// SW Fetch
self.addEventListener('fetch', (e) => {
  // App Shell
  if (e.request.url.match(location.origin)) {
    e.respondWith(staticCache(e.request));
  }

  // Giphy API
  else if (e.request.url.match('https://api.giphy.com/v1/gifs/trending')) {
    e.respondWith(fallbackCache(e.request));
  }

  // Giphy Media
  else if (e.request.url.match('giphy.com/media')) {
    e.respondWith(staticCache(e.request, 'giphy'));
  }
});

// Static Cache Strategy
function staticCache(req, cacheName = `static-${version}`) {
  return caches.match(req).then((cachedRes) => {
    // If response found, return
    if (cachedRes) return cachedRes;

    // Fallback to network
    return fetch(req).then((networkRes) => {
      caches.open(cacheName).then((cache) => cache.put(req, networkRes));

      // Return Clone of Network Response
      return networkRes.clone();
    });
  });
}

// Network with Cache Fallback
function fallbackCache(req) {
  return fetch(req)
    .then((networkRes) => {
      // Check res is OK, else go to cache
      if (!networkRes.ok) throw 'Fetch Error';

      // Update Cache
      caches
        .open(`static-${version}`)
        .then((cache) => cache.put(req, networkRes));

      // Return Clone of Network Response
      return networkRes.clone();
    })
    .catch((err) => caches.match(req));
}

// Clean old Giphys from the 'giphy' cache
function cleanGiphyCache(giphys) {
  caches.open('giphy').then((cache) => {
    // Get all cache entries
    cache.keys().then((keys) => {
      keys.forEach((key) => {
        // If entry is not part of the current giphys, delete
        if (!giphys.includes(key.url)) cache.delete(key);
      });
    });
  });
}

// Listen for message from client
self.addEventListener('message', (e) => {
  // Identify the message
  if (e.data.action === 'cleanGiphyCache') cleanGiphyCache(e.data.giphys);
});

// МЕНЯЕМ ИМЯ КЕША ПРИ КАЖДОМ ОБНОВЛЕНИИ!
const CACHE_NAME = 'jap-lang-v2'; // <-- УВЕЛИЧЬТЕ ВЕРСИЮ!

// Базовые файлы для офлайн-доступа (минимум)
const STATIC_ASSETS = [
  './',
  'index.html',
  // Добавьте критические CSS/JS
];

// Установка: кешируем минимум и активируемся сразу
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация: удаляем старые кеши и берем управление
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Удаляем старый кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🚀 НОВАЯ СТРАТЕГИЯ: Stale-While-Revalidate
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Создаём запрос в сеть для обновления кеша
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Проверяем, что ответ валидный
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            // Клонируем и сохраняем в кеш
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(error => {
          console.log('Сеть недоступна, используем только кеш:', error);
          // Если сеть упала, а в кеше ничего нет - можно вернуть fallback
          return caches.match('/offline.html');
        });

      // ✅ Отдаем из кеша сразу (если есть) или ждем ответ от сети
      return cachedResponse || fetchPromise;
    })
  );
});

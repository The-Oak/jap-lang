// Имя кеша для текущей версии приложения
const CACHE_NAME = 'jap-lang-v1';
// Список всех необходимых для офлайн-работы файлов
const STATIC_ASSETS = [
  './', // Основная страница
  'index.html',
  // Добавьте сюда пути ко всем CSS, JS, шрифтам и критически важным изображениям
  // Например: '/jap-lang/css/style.css', '/jap-lang/js/app.js'
];

// Событие 'install': кешируем статические ресурсы при первой установке
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Активируем SW сразу после установки
  );
});

// Событие 'activate': очищаем старые кеши при обновлении приложения
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Удаляем все кеши, кроме текущего
          }
        })
      );
    }).then(() => self.clients.claim()) // Берем управление всеми открытыми вкладками
  );
});

// Событие 'fetch': стратегия "Сначала из кеша, потом сеть" для офлайн-работы
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если файл найден в кеше, возвращаем его
        if (response) {
          return response;
        }
        // Если нет в кеше, загружаем из сети
        return fetch(event.request)
          .then(networkResponse => {
            // По желанию: можно кешировать новые запросы для будущего использования
            // return caches.open(CACHE_NAME).then(cache => {
            //   cache.put(event.request, networkResponse.clone());
            //   return networkResponse;
            // });
            return networkResponse;
          })
          .catch(() => {
            // Если сеть недоступна и файла нет в кеше, можно показать запасную страницу
            // Например: return caches.match('/jap-lang/offline.html');
          });
      })
  );
});
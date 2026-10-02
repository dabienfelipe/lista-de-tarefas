'use strict';

const CACHE_NAME = 'lista-de-tarefas-v1';
const APP_SHELL = [
  './',
  './index.html',
  './main.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName.startsWith('lista-de-tarefas-') && cacheName !== CACHE_NAME;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.ok) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME)
            .then(function (cache) {
              return cache.put(event.request, responseCopy);
            })
            .catch(function (error) {
              console.error('Não foi possível atualizar o cache offline:', error);
            });
        }

        return response;
      })
      .catch(function () {
        return caches.match(event.request)
          .then(function (cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }

            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return Response.error();
          });
      })
  );
});

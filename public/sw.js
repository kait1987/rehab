/**
 * REHAB Service Worker
 * 
 * 오프라인 지원 및 캐싱을 위한 Service Worker입니다.
 * 네트워크 우선 전략을 사용하며, 실패 시 오프라인 페이지를 표시합니다.
 */

const CACHE_NAME = 'rehab-pwa-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 자산
const urlsToCache = [
  OFFLINE_URL,
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 설치 이벤트: 정적 자산 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching offline page');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트: 네트워크 우선, 실패 시 오프라인 페이지
self.addEventListener('fetch', (event) => {
  // navigate 요청만 처리 (HTML 페이지)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => cache.match(OFFLINE_URL));
        })
    );
    return;
  }

  // 다른 요청은 네트워크 우선
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

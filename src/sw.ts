/// <reference lib="WebWorker" />

export type {}

const sw = self as unknown as ServiceWorkerGlobalScope

const PRECACHE_NAME = 'typing-precache-v1'
const DATA_CACHE_NAME = 'typing-data-v1'
const RUNTIME_CACHE_NAME = 'typing-runtime-v1'

const PRECACHE_URLS: string[] = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon512.png',
  '/data/lessons/en-basic.json',
  '/data/lessons/ja-basic.json',
  '/data/phrases/en.json',
  '/data/phrases/ja.json',
]

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => sw.skipWaiting()),
  )
})

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![PRECACHE_NAME, DATA_CACHE_NAME, RUNTIME_CACHE_NAME].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => sw.clients.claim()),
  )
})

sw.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    sw.skipWaiting()
  }
})

sw.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, PRECACHE_NAME))
    return
  }

  if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE_NAME))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request))
    return
  }

  event.respondWith(cacheFirst(request, RUNTIME_CACHE_NAME))
})

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    return cached
  }

  const response = await fetch(request)
  if (response && response.ok) {
    cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached ?? (await fetchPromise)
}

async function networkFirstWithFallback(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE_NAME)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await caches.match('/index.html')
    if (cached) {
      return cached
    }
    throw error
  }
}

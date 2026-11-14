// 온라인이면 새 파일을 받고, 안 되면 저장해 둔 것으로 연다.
// GitHub Pages 는 10분 동안 브라우저 캐시를 쓰게 해서, 매번 서버에 바뀌었는지 물어본다(no-cache).
const CACHE = 'me-v3';
const SHELL = ['./', 'index.html', 'styles.css', 'js/app.js', 'js/store.js', 'js/logic.js', 'js/templates.js', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    // 새 버전이 깔리면 열려 있는 화면을 한 번 새로 읽어, 옛 파일과 새 파일이 섞이지 않게 한다
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(cs => cs.forEach(c => c.navigate(c.url))));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const res = await fetch(e.request, { cache: 'no-cache' });
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || Response.error();
    }
  }));
});

/* 全站 Service Worker — 预缓存首页，页面 SWR，静态资源 cache-first，CDN network-first */
/*
 * v4：再次提版本，清掉旧缓存。
 *
 * 为什么每个版本都要提：静态资源（.js/.css）走 cache-first，而缓存名带着 VERSION，
 * 只要 VERSION 不变，旧 chunk 就永远不会被清。多次部署后会出现这种错配：
 *   - HTML 走 SWR，很快更新到新版本
 *   - 但页面里正在跑的 JS / CSS 还是缓存里的旧文件
 * 于是实际看到的是旧样式（例：改了好几次 KaTeX 公式溢出，页面却毫无变化）。
 * 提版本号 = 清一次缓存，让客户端拿回一致的 HTML/JS/CSS。
 *
 * 注意 /sw.js 自身也匹配 cache-first 的 .js 规则，所以更新可能被延后一轮，
 * 必要时手动注销 SW 或清站点数据能立即生效。
 */
const VERSION = "v4";
const STATIC_CACHE = `static-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const CDN_CACHE = `cdn-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = ["/", "/zh/", "/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE, CDN_CACHE].includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 跨域 CDN：network-first
  if (url.origin !== self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CDN_CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 静态资源：cache-first
  if (/\.(css|js|woff2?|png|jpg|jpeg|gif|svg|ico|webp|json)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // HTML 页面：SWR
  if (req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      caches.open(PAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          cache.put(req, res.clone());
          return res;
        }).catch(() => cached || caches.match(OFFLINE_URL));
        return cached || network;
      })
    );
  }
});

// 通知客户端缓存状态
self.addEventListener("message", (e) => {
  if (e.data === "getCacheStatus") {
    e.source.postMessage({ type: "cacheStatus", cached: true });
  }
});

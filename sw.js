/* Gym Log — service worker: cachea la app para que abra sin conexión.
   Sube el número de CACHE cada vez que edites index.html, si no el iPhone
   te seguirá mostrando la versión vieja. */
const CACHE = "gymlog-v6";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone@7.24.7/babel.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // uno por uno: si una CDN falla, no se cae la instalación completa
      Promise.all(ARCHIVOS.map(u => c.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // La API nunca se cachea: siempre red.
  if (url.indexOf("script.google.com") !== -1 || url.indexOf("script.googleusercontent.com") !== -1) return;
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return res;
    }).catch(() =>
      // Solo una navegación cae de vuelta al HTML. Una imagen que no carga
      // debe fallar como imagen, no devolver la página entera.
      e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()
    ))
  );
});

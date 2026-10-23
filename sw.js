// Service worker: lets the dashboard open with no internet.
// - The page itself: network first (so updates show up), cached copy if offline or slow.
// - Everything else on this site (adhan sound files): cached copy first, refreshed in the background.
// Data from the weather / prayer / exchange-rate APIs is not handled here (the page caches that itself).

var CACHE = "ipad-dashboard-v19.6";
var CORE = ["./", "./index.html", "./fonts/Fraunces.woff2", "./fonts/Fraunces-Italic.woff2", "./fonts/Jost.woff2", "./fonts/AmiriQuran.woff2", "./quran-data.js", "./css/index.css", "./css/remote.css", "./js/core/shared.js", "./js/core/storage.js", "./js/core/catalog.js", "./js/core/ui.js", "./js/core/network.js", "./js/core/state.js", "./js/core/media-controller.js", "./js/core/status-projection.js", "./js/core/components.js", "./js/core/diagnostics.js", "./js/dashboard/index.js", "./js/azkar.js", "./js/core/remote-storage.js", "./js/remote/remote.js", "./remote.html"];
var OPTIONAL = ["./adhan.mp3", "./adhan-fajr.mp3"];   // fine if these don't exist

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(CORE).then(function () {
        return Promise.all(OPTIONAL.map(function (u) { return c.add(u).catch(function () {}); }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function put(req, res) {
  if (res && res.ok) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
  }
}

function networkFirst(req, ms) {
  return new Promise(function (resolve) {
    var done = false;
    function fromCache(last) {
      caches.match(req, { ignoreSearch: true }).then(function (r) {
        if (done) return;
        if (r) { done = true; resolve(r); }
        else if (last) { done = true; resolve(Response.error()); }
      });
    }
    var timer = setTimeout(function () { fromCache(false); }, ms);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      put(req, res);
      if (!done) { done = true; resolve(res); }
    }, function () {
      clearTimeout(timer);
      fromCache(true);
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function (cached) {
    var net = fetch(req).then(function (res) { put(req, res); return res; }, function () { return null; });
    return cached || net.then(function (res) { return res || Response.error(); });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // leave API calls alone
  if (req.headers.get("range")) return;                 // let the browser handle range requests itself

  var isPage = req.mode === "navigate" || /\.(html?|js|css|webmanifest)$/.test(url.pathname) || url.pathname.slice(-1) === "/";
  e.respondWith(isPage ? networkFirst(req, 4000) : staleWhileRevalidate(req));
});

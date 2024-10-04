const cacheAssetes = [
  "./index.html", "./src/main.js", "./src/style.css",
  "./src/axios.min.js", "./src/bootstrap.css", 
  "./pics/logo.png", "./pics/logo144.png", "./pics/logo192.png", "./pics/logo512.png",
  ]

// self.addEventListener("install", e => {
//   e.waitUntil(
//     caches.open("static").then(cache => {
//       return cache.addAll(cacheAssetes); 
//     })
//   );
// });
  
// self.addEventListener("fetch", e => {
//   e.respondWith(
//     caches.match(e.request).then(response => {
//       return response || fetch(e.request);
//     })
//   );
// })
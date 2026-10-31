/* PhotoBridge v704 service worker — installability without stale application caching. */
const VERSION='photobridge-pwa-v704';
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
/* A real fetch handler keeps the PWA fully installable while every request still goes straight to network. */
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request));
});

/* PhotoBridge v706 service worker — zero-interception network path for responsive PWA navigation. */
const VERSION='photobridge-pwa-v706';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('photobridge-pwa-')&&key!==VERSION)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
/* Keep a fetch listener for PWA compatibility, but do not intercept requests. API and navigation use the browser network stack directly. */
self.addEventListener('fetch',()=>{});

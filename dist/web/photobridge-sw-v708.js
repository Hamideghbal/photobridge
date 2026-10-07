/* PhotoBridge v708 service worker — no fetch interception; browser-native networking. */
const VERSION='photobridge-pwa-v708';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('photobridge-pwa-')&&key!==VERSION)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',()=>{});

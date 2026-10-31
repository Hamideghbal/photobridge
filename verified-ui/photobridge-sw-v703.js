/* PhotoBridge v703 PWA service worker.
   Deliberately does not cache application/API traffic; it only provides the PWA install surface
   without risking stale orders, wallet balances or design data. */
const VERSION='photobridge-pwa-v703';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

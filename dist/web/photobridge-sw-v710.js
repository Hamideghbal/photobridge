/* PhotoBridge v783 service worker — account-scoped Web Push, strong RTL actions and logout cleanup. */
const VERSION='photobridge-pwa-v786';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('photobridge-pwa-')&&key!==VERSION)await caches.delete(key);
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clients){try{client.postMessage({type:'PB_APP_VERSION',version:'786'})}catch{}}
})()));
self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='PB_PUSH_LOGOUT')event.waitUntil((async()=>{try{for(const n of await self.registration.getNotifications())n.close()}catch{};await pb780SetBadge(0)})());
});
self.addEventListener('fetch',()=>{});

async function pb780SetBadge(value){
  try{
    const count=Math.max(0,Number(value||0));
    if(count>0&&self.navigator?.setAppBadge)await self.navigator.setAppBadge(count);
    else if(count===0&&self.navigator?.clearAppBadge)await self.navigator.clearAppBadge();
  }catch{}
}
function pb783Rtl(value){const s=String(value||'');return s?'\u200F'+s:s}
function pb780Target(url,id){
  try{const u=new URL(String(url||'/'),self.location.origin);if(id)u.searchParams.set('pbNotification',String(id));return u.pathname+u.search+u.hash}catch{return String(url||'/')}
}
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?.json?.()||{}}catch{try{data={body:event.data?.text?.()||''}}catch{}}
    const title=pb783Rtl(data.title||'PhotoBridge');
    const body=pb783Rtl(data.body||'اعلان جدید PhotoBridge');
    const tag=String(data.tag||`photobridge-${Date.now()}`);
    const url=String(data.url||'/');
    await pb780SetBadge(data.unreadCount);
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const visible=windows.find(c=>c.visibilityState==='visible');
    if(visible){
      try{visible.postMessage({type:'PB_PUSH_FOREGROUND',payload:{...data,title,body,tag,url}})}catch{}
      return;
    }
    await self.registration.showNotification(title,{
      body,
      tag,
      renotify:true,
      requireInteraction:false,
      silent:false,
      vibrate:[220,100,220],
      dir:'rtl',
      lang:'fa-IR',
      icon:String(data.icon||'/photobridge-icon-192-v783.png'),
      badge:String(data.badge||'/photobridge-icon-96.png'),
      actions:[{action:'open',title:pb783Rtl(data.actionLabel||'مشاهده')}],
      data:{url,event:data.event||'',notificationId:data.notificationId||null,unreadCount:Number(data.unreadCount||0),metadata:data.metadata||{}}
    });
    if(['client_gallery_finalized','client_gallery_approved'].includes(data.event)&&data.notificationId){try{await fetch('/api/customer/notifications/delivered',{method:'POST',credentials:'include',headers:{'content-type':'application/json','x-photobridge-portal':'photographer'},body:JSON.stringify({id:data.notificationId})});}catch{}}
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=pb780Target(event.notification?.data?.url||'/',event.notification?.data?.notificationId||null);
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        if('focus' in client){
          await client.focus();
          if('navigate' in client)await client.navigate(target);
          return;
        }
      }catch{}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target);
  })());
});

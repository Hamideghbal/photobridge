/* PhotoBridge v904R15 — login-safe account-scoped Web Push; rental calls stay dormant until panel auth is ready. */
(()=>{
  'use strict';
  if(window.__PB_PUSH_V728__)return;
  window.__PB_PUSH_V728__=true;
  window.__PB_PUSH_V780__=true;
  window.__PB_PUSH_V782__=true;
  window.__PB_PUSH_V783__=true;

  const SW='/photobridge-sw-v710.js?gallery=r1318&cooperation=r1398';
  const PROMPT_ID='pbPushEnableV728';
  const LAST_SYNC='photobridge:push:last-sync:v783';
  const nativeFetch=window.fetch.bind(window);
  let syncing=false,lastForegroundTag='',lastForegroundAt=0,badgeSyncing=false;

  const role=()=>{const p=location.pathname;if(p.startsWith('/lab')&&!p.startsWith('/lab/login'))return 'lab';if(p.startsWith('/photographer')&&!p.startsWith('/photographer/login')&&!p.startsWith('/photographer/signup'))return 'customer';if(p.startsWith('/equipment-rental'))return 'customer';if(p==='/rental'||p.startsWith('/rental/'))return 'rental';return ''};
  const portal=()=>role()==='lab'?'lab':role()==='customer'?'photographer':role()==='rental'?'rental':'';
  const endpoint=()=>role()==='lab'?'/api/lab/push/subscribe':role()==='customer'?'/api/customer/push/subscribe':role()==='rental'?'/api/rental/push/subscribe':'';
  const notificationsBase=()=>role()==='lab'?'/api/lab/notifications':role()==='customer'?'/api/customer/notifications':role()==='rental'?'/api/rental/notifications':'';
  const token=()=>{try{return sessionStorage.getItem('lablink_test_session')||''}catch{return ''}};
  const impersonation=()=>{try{const raw=sessionStorage.getItem('photobridge_admin_impersonation');return raw?JSON.parse(raw):null}catch{return null}};
  const headers=()=>{const h={'content-type':'application/json'},p=portal(),t=token(),imp=impersonation(),isImp=Boolean(t&&imp);if(p)h['x-photobridge-portal']=p;if(role()==='lab'){const d=localStorage.getItem('photobridge_lab_device_id')||'';if(d)h['x-photobridge-device-id']=d}if(t)h.authorization=`Bearer ${t}`;if(isImp)h['x-photobridge-impersonation']='1';if(isImp&&imp?.role==='lab'&&imp?.labId)h['x-photobridge-impersonation-lab-id']=String(imp.labId);return h};
  const api=async(path,opts={})=>{const r=await nativeFetch(path,{credentials:'include',cache:'no-store',...opts,headers:{...headers(),...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.error||'request_failed'),{status:r.status,data:d});return d};
  const decodeKey=value=>{const pad='='.repeat((4-value.length%4)%4),base=(value+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out};
  const deviceLabel=()=>{const ua=String(navigator.userAgent||''),platform=String(navigator.userAgentData?.platform||navigator.platform||'Mobile'),browser=/Edg\//.test(ua)?'Edge':/CriOS\//.test(ua)?'Chrome iOS':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Browser';return `${platform} · ${browser}`.slice(0,160)};
  const permissionSupported=()=>Boolean('serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'));
  const supported=()=>Boolean(role()&&permissionSupported());

  async function setAppBadge(value){try{const n=Math.max(0,Number(value||0));if(n>0&&navigator.setAppBadge)await navigator.setAppBadge(n);else if(n===0&&navigator.clearAppBadge)await navigator.clearAppBadge()}catch{}}
  async function syncAppBadge(){const base=notificationsBase();if(!base||badgeSyncing)return;if(role()==='rental'&&!(await rentalAuthReady()))return;badgeSyncing=true;try{const d=await api(base);await setAppBadge(Number(d?.unread||0))}catch{}finally{badgeSyncing=false}}
  async function markClickedNotificationRead(){const base=notificationsBase(),params=new URLSearchParams(location.search),id=params.get('pbNotification');if(!base||!id)return;try{await api(`${base}/read`,{method:'POST',body:JSON.stringify({ids:[id]})});window.dispatchEvent(new CustomEvent(`photobridge-notifications-read-${role()}`));await syncAppBadge()}catch{}finally{params.delete('pbNotification');const qs=params.toString();history.replaceState(history.state,'',`${location.pathname}${qs?`?${qs}`:''}${location.hash}`)}}
  async function openInvoiceDeepLink(){const params=new URLSearchParams(location.search),invoiceId=params.get('invoice');if(role()!=='customer'||!invoiceId||location.pathname!=='/photographer/finance/invoices')return;try{sessionStorage.setItem('photobridge:finance:focus-invoice',String(invoiceId));window.dispatchEvent(new CustomEvent('photobridge-finance-focus-invoice',{detail:{invoiceId:String(invoiceId)}}))}catch{} }

  function ensureStyle(){
    if(document.getElementById('pbPushStyleV728'))return;
    const s=document.createElement('style');s.id='pbPushStyleV728';s.textContent=`
      #${PROMPT_ID}{position:fixed;z-index:2147483000;left:12px;right:12px;bottom:84px;margin:auto;max-width:520px;direction:rtl;text-align:right;background:#fff;border:1px solid rgba(49,94,251,.18);box-shadow:0 14px 38px rgba(25,45,85,.18);border-radius:18px;padding:12px;display:flex;align-items:center;gap:10px;font-family:Vazirmatn,IRANSansX,Tahoma,Arial,sans-serif}
      #${PROMPT_ID} img{width:42px;height:42px;border-radius:12px;object-fit:contain;flex:0 0 auto}#${PROMPT_ID} .pbPushText{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}#${PROMPT_ID} .pbPushText b{font-size:14px;color:#111827}#${PROMPT_ID} .pbPushText small{font-size:11px;line-height:1.7;color:#5b6472}#${PROMPT_ID} .pbPushEnable{border:0;border-radius:12px;background:#315efb;color:#fff;font-weight:800;padding:10px 13px;white-space:nowrap;cursor:pointer}#${PROMPT_ID} .pbPushClose{border:0;background:transparent;color:#6b7280;font-size:20px;padding:4px 5px;cursor:pointer}
      .pbPushToastV728{unicode-bidi:plaintext;position:fixed;z-index:2147482999;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 84px);margin:auto;max-width:520px;direction:rtl;text-align:right;background:#fff;border:1px solid rgba(49,94,251,.2);box-shadow:0 12px 32px rgba(25,45,85,.18);border-radius:16px;padding:12px 14px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;font-family:Vazirmatn,IRANSansX,Tahoma,Arial,sans-serif;animation:pbPushIn .18s ease-out}.pbPushToastV728 img{width:36px;height:36px;border-radius:10px;object-fit:contain}.pbPushToastV728 b{display:block;font-size:13px;color:#111827}.pbPushToastV728 p{margin:3px 0 0;font-size:12px;line-height:1.7;color:#4b5563}.pbPushToastV728 .pbPushOpen{border:0;border-radius:10px;background:#eef2ff;color:#315efb;font:inherit;font-weight:800;padding:8px 10px;white-space:nowrap;cursor:pointer}
      @keyframes pbPushIn{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}@media(min-width:821px){#${PROMPT_ID}{bottom:20px}.pbPushToastV728{top:20px;left:20px;right:auto;width:430px}}
    `;document.head.appendChild(s);
  }
  function hidePrompt(){document.getElementById(PROMPT_ID)?.remove()}
  function showPrompt(){if(!supported()||Notification.permission!=='default'||document.getElementById(PROMPT_ID))return;ensureStyle();const el=document.createElement('div');el.id=PROMPT_ID;el.innerHTML=`<img src="/photobridge-icon-192-v783.png" alt=""><div class="pbPushText"><b>اعلان‌های PhotoBridge را فعال کن</b><small>مرحله چاپ، فاکتور، اجاره/فروش تجهیزات و رویدادهای مهم با اعلان اطلاع داده می‌شوند.</small></div><button type="button" class="pbPushEnable">فعال‌سازی</button><button type="button" class="pbPushClose" aria-label="بستن">×</button>`;el.querySelector('.pbPushEnable').addEventListener('click',async()=>{await enable(true)});el.querySelector('.pbPushClose').addEventListener('click',()=>{hidePrompt();try{sessionStorage.setItem('photobridge:push:prompt-dismissed','1')}catch{}});document.body.appendChild(el)}
  function targetWithId(payload){try{const u=new URL(String(payload?.url||'/'),location.origin);if(payload?.notificationId)u.searchParams.set('pbNotification',String(payload.notificationId));return u.pathname+u.search+u.hash}catch{return String(payload?.url||'/')}}
function pb1398LabCooperation(p){return ['collaboration_request','photographer_invite_accepted','photographer_removed_by_admin','photographer_removed_by_lab'].includes(p?.event)}
function pb1398ReadOnly(p){return p?.event==='lab_membership_removed'||p?.event==='collaboration_review'&&(p?.metadata?.status||p?.status)==='rejected'}
  function showToast(payload){
    if(role()==='lab'&&pb1398LabCooperation(payload))return;
    ensureStyle();document.querySelectorAll('.pbPushToastV728').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='pbPushToastV728';
    el.innerHTML='<img src="/photobridge-icon-192-v783.png" alt=""><div><b></b><p></p></div>';
    el.querySelector('b').textContent=String(payload?.title||'PhotoBridge');el.querySelector('p').textContent=String(payload?.body||'اعلان جدید');
    if(!pb1398ReadOnly(payload)){const button=document.createElement('button');button.type='button';button.className='pbPushOpen';button.textContent=String(payload?.actionLabel||'مشاهده');const open=()=>location.assign(targetWithId(payload));button.addEventListener('click',e=>{e.stopPropagation();open()});el.append(button);el.addEventListener('click',open)}else{el.setAttribute('role','status');el.style.cursor='default'}
    document.body.appendChild(el);setTimeout(()=>el.remove(),6500);
  }
  function playForegroundSound(){
    try{const audio=new Audio('/photobridge-notification-v780.wav');audio.volume=.62;audio.play().catch(()=>{})}catch{}
    try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.08,ctx.currentTime+.025);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.55);[740,988,1174].forEach((f,i)=>{const o=ctx.createOscillator();o.type=i===1?'triangle':'sine';o.frequency.value=f;o.connect(gain);o.start(ctx.currentTime+i*.1);o.stop(ctx.currentTime+.1+i*.1)});setTimeout(()=>ctx.close().catch(()=>{}),800)}catch{}
    try{navigator.vibrate?.([180,80,180])}catch{}
  }
  function unlockAudio(){try{const a=new Audio('/photobridge-notification-v780.wav');a.volume=.001;a.play().then(()=>{a.pause();a.currentTime=0}).catch(()=>{})}catch{}try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const c=new Ctx(),g=c.createGain();g.gain.value=.00001;g.connect(c.destination);const o=c.createOscillator();o.connect(g);o.start();o.stop(c.currentTime+.01);setTimeout(()=>c.close().catch(()=>{}),80)}catch{}}
  async function register(){let reg=await navigator.serviceWorker.getRegistration('/');if(!reg)reg=await navigator.serviceWorker.register(SW,{scope:'/',updateViaCache:'none'});try{await reg.update()}catch{}return await navigator.serviceWorker.ready}
  async function rentalAuthReady(){if(role()!=='rental')return true;return window.__PB_RENTAL_PORTAL_AUTH_READY__===true}
  async function syncSubscription(force=false){if(!supported()||Notification.permission!=='granted'||syncing)return false;if(role()==='rental'&&window.__PB_RENTAL_PORTAL_AUTH_READY__!==true)return false;const now=Date.now(),last=Number(localStorage.getItem(LAST_SYNC)||0);if(!force&&now-last<120000){void syncAppBadge();return true}syncing=true;try{const [reg,config]=await Promise.all([register(),api('/api/push/public-key')]);const publicKey=String(config?.publicKey||'');if(!publicKey)throw new Error('missing_public_key');let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(publicKey)});const json=sub.toJSON();await api(endpoint(),{method:'POST',body:JSON.stringify({endpoint:json.endpoint,expirationTime:json.expirationTime||null,keys:json.keys||{},deviceLabel:deviceLabel()})});localStorage.setItem(LAST_SYNC,String(now));localStorage.setItem('photobridge:push:enabled','1');hidePrompt();void syncAppBadge();return true}catch(e){console.warn('[PhotoBridge push] subscribe failed',e?.message||e);return false}finally{syncing=false}}
  async function enable(fromGesture=false){if(!supported())return false;unlockAudio();let permission=Notification.permission;if(permission==='default'&&fromGesture){try{permission=await Notification.requestPermission()}catch{permission=Notification.permission}}if(permission==='granted')return await syncSubscription(true);hidePrompt();return false}
  async function unsubscribeCurrentAccount(){
    const ep=endpoint();
    try{
      // Logout must not wait for an active worker that may never be installed.
      // An existing registration still gets its subscription and worker cleanup.
      const reg=await navigator.serviceWorker?.getRegistration?.('/');
      const sub=await reg?.pushManager?.getSubscription?.();
      if(sub?.endpoint&&ep){
        try{await nativeFetch(ep,{method:'DELETE',credentials:'include',cache:'no-store',headers:headers(),body:JSON.stringify({endpoint:sub.endpoint})})}catch{}
        try{await sub.unsubscribe()}catch{}
      }
      try{reg?.active?.postMessage?.({type:'PB_PUSH_LOGOUT'})}catch{}
    }catch{}
    try{localStorage.removeItem(LAST_SYNC);localStorage.removeItem('photobridge:push:enabled')}catch{}
    try{await setAppBadge(0)}catch{}
    document.querySelectorAll('.pbPushToastV728').forEach(x=>x.remove());hidePrompt();
    return true;
  }
  window.PB783UnsubscribePushForLogout=unsubscribeCurrentAccount;
  if(!window.__PB783_LOGOUT_FETCH_WRAP__){
    window.__PB783_LOGOUT_FETCH_WRAP__=true;
    window.fetch=async function(input,init={}){
      let path='';try{path=typeof input==='string'?new URL(input,location.href).pathname:new URL(input?.url||'',location.href).pathname}catch{}
      const method=String(init?.method||(typeof input!=='string'&&input?.method)||'GET').toUpperCase();
      if(path==='/api/auth/logout'&&method==='POST')await unsubscribeCurrentAccount();
      return nativeFetch(input,init);
    };
  }
  async function prepareForInstall(){
    if(!permissionSupported())return {supported:false,permission:'unsupported',subscribed:false};
    unlockAudio();
    let permission=Notification.permission;
    if(permission==='default'){try{permission=await Notification.requestPermission()}catch{permission=Notification.permission}}
    let subscribed=false;
    if(permission==='granted'&&role())subscribed=await syncSubscription(true);
    return {supported:true,permission,subscribed};
  }
  window.PB782PreparePushForInstall=prepareForInstall;
  window.PB782EnableNotifications=()=>enable(true);
  window.PB782SyncPush=()=>syncSubscription(true);
  function maybePrompt(){if(!supported())return;if(role()==='rental'&&window.__PB_RENTAL_PORTAL_AUTH_READY__!==true){hidePrompt();return}if(Notification.permission==='granted'){void syncSubscription(false);void syncAppBadge();hidePrompt();return}if(Notification.permission==='default'){let dismissed=false;try{dismissed=sessionStorage.getItem('photobridge:push:prompt-dismissed')==='1'}catch{}if(!dismissed)setTimeout(showPrompt,900)}else hidePrompt()}

  navigator.serviceWorker?.addEventListener?.('message',e=>{if(e?.data?.type!=='PB_PUSH_FOREGROUND')return;const payload=e.data.payload||{},tag=String(payload.tag||'');if(tag&&tag===lastForegroundTag&&Date.now()-lastForegroundAt<5000)return;lastForegroundTag=tag;lastForegroundAt=Date.now();void setAppBadge(Number(payload.unreadCount||1));/* PB1399 review broadcast */if(payload.event==='collaboration_review')window.dispatchEvent(new CustomEvent('photobridge-collaboration-review',{detail:payload.metadata||payload}));if(!(role()==='lab'&&pb1398LabCooperation(payload))){playForegroundSound();showToast(payload);}if(role()==='customer'&&['client_gallery_finalized','client_gallery_approved'].includes(payload.event)&&payload.notificationId)void api('/api/customer/notifications/delivered',{method:'POST',body:JSON.stringify({id:payload.notificationId})}).catch(()=>{})});
  document.addEventListener('click',e=>{const bell=e.target?.closest?.('.systemNotificationBell,.mobileNotificationBell');if(!bell||!supported())return;if(Notification.permission==='default')void enable(true);else if(Notification.permission==='granted')void syncSubscription(true)},true);
  window.addEventListener('photobridge-notifications-read-lab',()=>{if(role()==='lab')void syncAppBadge()});
  window.addEventListener('photobridge-notifications-read-customer',()=>{if(role()==='customer')void syncAppBadge()});
  window.addEventListener('photobridge-notifications-read-rental',()=>{if(role()==='rental')void syncAppBadge()});
  addEventListener('focus',()=>{if(Notification.permission==='granted')void syncSubscription(false);void syncAppBadge()},{passive:true});
  addEventListener('pageshow',()=>{maybePrompt();void markClickedNotificationRead();void openInvoiceDeepLink()},{passive:true});
  addEventListener('online',()=>{if(Notification.permission==='granted')void syncSubscription(true)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){maybePrompt();void syncAppBadge()}},{passive:true});
  setInterval(()=>{if(!document.hidden&&Notification.permission==='granted')void syncSubscription(false)},10*60*1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{maybePrompt();void markClickedNotificationRead();void syncAppBadge();void openInvoiceDeepLink()},{once:true});else{maybePrompt();void markClickedNotificationRead();void syncAppBadge();void openInvoiceDeepLink()}
  console.info('[PhotoBridge] v904R15 login-safe Web Push + rental auth gate active');
})();

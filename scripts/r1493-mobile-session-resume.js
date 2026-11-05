/* R1598: resume an authenticated mobile PWA in its active Lab, Store, or Photographer portal.
   No passwords, tokens, or user identities are stored. A remembered role is only a hint;
   every redirect requires a fresh, successful role-specific /api/auth/me response. */
(()=>{
 'use strict';
 const KEY='photobridge:pwa:last-portal';
 const routes={lab:'/lab',rental:'/rental',photographer:'/photographer'};
 let standalone=false;
 try{
   standalone=window===window.top &&
     (navigator.standalone===true||matchMedia('(display-mode: standalone)').matches) &&
     matchMedia('(max-width:820px)').matches;
 }catch{}
 if(!standalone)return;
 const portalFromPath=()=>{
   const p=location.pathname;
   return /^\/lab(?:\/|$)/.test(p)?'lab':
     /^\/rental(?:\/|$)/.test(p)?'rental':
     /^\/photographer(?:\/|$)/.test(p)?'photographer':null;
 };
 const roleForIdentity=(portal,data)=>{
   const u=data?.user;
   if(portal==='lab'&&data?.lab?.id&&['lab_admin','lab_operator','lab_staff'].includes(u?.labRole))return 'lab';
   if(portal==='rental'&&data?.rentalShop?.id&&['shop_admin','shop_operator','shop_staff'].includes(u?.rentalRole))return 'rental';
   if(portal==='photographer'&&u?.labRole==='customer')return 'photographer';
   return null;
 };
 const readHeaders=(input,init)=>{
   try{return new Headers(init?.headers||(input instanceof Request?input.headers:undefined))}
   catch{return new Headers()}
 };
 let resuming=false;
 const originalFetch=window.fetch.bind(window);
 window.fetch=(input,init)=>{
   let url;try{url=new URL(typeof input==='string'?input:input.url,location.href)}catch{}
   const promise=originalFetch(input,init);
   if(!url||url.origin!==location.origin)return promise;
   const logins={'/api/auth/lab-login':'lab','/api/auth/customer-login':'photographer','/api/auth/rental-login':'rental'};
   const loginPortal=logins[url.pathname];
   if(loginPortal){
     promise.then(response=>{if(response.ok)try{localStorage.setItem(KEY,loginPortal)}catch{}}).catch(()=>{});
   }else if(url.pathname==='/api/auth/logout'){
     // The previous Lab preference must not briefly resume after logout.
     promise.then(response=>{if(response.ok)try{localStorage.removeItem(KEY)}catch{}}).catch(()=>{});
   }else if(url.pathname==='/api/auth/me'&&!resuming){
     const portal=readHeaders(input,init).get('x-photobridge-portal');
     // A photographer background request should not change the active role while
     // the installed app is resuming its last Lab/Store session.
     if(routes[portal]&&portal===portalFromPath()){
       promise.then(response=>{
         if(!response.ok)return;
         response.clone().json().then(data=>{
           if(roleForIdentity(portal,data))try{localStorage.setItem(KEY,portal)}catch{}
         }).catch(()=>{});
       }).catch(()=>{});
     }
   }
   return promise;
 };
 const entryPaths=new Set([
   '/','/photographer','/photographer/','/photographer/login','/photographer/login/',
   '/lab','/lab/','/lab/login','/lab/login/',
   '/rental','/rental/','/rental/login','/rental/login/'
 ]);
 const search=new URLSearchParams(location.search);
 if(search.has('logged_out')){try{localStorage.removeItem(KEY)}catch{};return;}
 if(!entryPaths.has(location.pathname)||['token','invite','maintenance_preview','reset','code','redirect'].some(key=>search.has(key)))return;
 resuming=true;
 document.documentElement.classList.add('pb1493SessionResumePending');
 const release=()=>{resuming=false;document.documentElement.classList.remove('pb1493SessionResumePending')};
 const validSession=async portal=>{
   const abort=new AbortController();
   const timeout=setTimeout(()=>abort.abort(),4500);
   try{
     const response=await originalFetch('/api/auth/me',{
       credentials:'include',cache:'no-store',
       headers:{'x-photobridge-portal':portal},signal:abort.signal
     });
     if(!response.ok)return false;
     const data=await response.json().catch(()=>null);
     return Boolean(roleForIdentity(portal,data));
   }catch{return false}finally{clearTimeout(timeout)}
 };
 (async()=>{
   try{
     let preferred='';try{preferred=localStorage.getItem(KEY)||''}catch{}
     const current=portalFromPath();
     // Resolve all sessions concurrently, not three sequential 4.5s waits.
     // If multiple roles are authenticated, use the remembered last active role;
     // otherwise prefer the explicit entry role, then Photographer.
     const portals=['lab','rental','photographer'];
     const verified=await Promise.all(portals.map(portal=>validSession(portal)));
     const valid=portals.filter((portal,i)=>verified[i]);
     const chosen=[preferred,current,'photographer','lab','rental'].find(portal=>valid.includes(portal));
     if(!chosen){
       try{localStorage.removeItem(KEY)}catch{}
       return;
     }
     try{localStorage.setItem(KEY,chosen)}catch{}
     if(location.pathname!==routes[chosen]&&location.pathname!==routes[chosen]+'/'){
       location.replace(routes[chosen]);return;
     }
     // When opening exactly /lab, /rental, or /photographer the existing
     // authenticated React router owns the landing page. Never reload it.
   }finally{release()}
 })();
})();
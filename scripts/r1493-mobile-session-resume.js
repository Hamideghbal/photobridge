/* PB1493: resume the last authenticated PWA role without persisting credentials. */
(()=>{
 'use strict';
 const KEY='photobridge:pwa:last-portal';
 let standalone=false;
 try{standalone=window===window.top&&(navigator.standalone===true||matchMedia('(display-mode: standalone)').matches)&&matchMedia('(max-width:820px)').matches}catch{}
 if(!standalone)return;
 const routes={lab:'/lab',photographer:'/photographer',rental:'/rental'};
 const roleForPath=()=>location.pathname.startsWith('/lab')?'lab':location.pathname.startsWith('/rental')?'rental':location.pathname.startsWith('/photographer')?'photographer':null;
 const roleForIdentity=(portal,data)=>{
  const user=data&&data.user;
  if(portal==='lab'&&user?.labRole==='lab_admin'&&data?.lab?.id)return 'lab';
  if(portal==='photographer'&&user?.labRole==='customer')return 'photographer';
  if(portal==='rental'&&user?.rentalRole==='shop_admin'&&data?.rentalShop?.id)return 'rental';
  return null;
 };
 const readHeaders=(input,init)=>{try{return new Headers(init?.headers||(input instanceof Request?input.headers:undefined))}catch{return new Headers()}};
 const originalFetch=window.fetch.bind(window);
 window.fetch=(input,init)=>{
  let url;try{url=new URL(typeof input==='string'?input:input.url,location.href)}catch{}
  const promise=originalFetch(input,init);
  if(!url||url.origin!==location.origin)return promise;
  if(url.pathname==='/api/auth/lab-login'||url.pathname==='/api/auth/customer-login'||url.pathname==='/api/auth/rental-login'){
   const portal=url.pathname.endsWith('/lab-login')?'lab':url.pathname.endsWith('/rental-login')?'rental':'photographer';
   promise.then(response=>{if(response.ok){try{localStorage.setItem(KEY,portal)}catch{}}}).catch(()=>{});
  }else if(url.pathname==='/api/auth/me'){
   const portal=readHeaders(input,init).get('x-photobridge-portal');
   if(routes[portal])promise.then(response=>{if(!response.ok)return;response.clone().json().then(data=>{const valid=roleForIdentity(portal,data);if(valid)try{localStorage.setItem(KEY,valid)}catch{}}).catch(()=>{})}).catch(()=>{});
  }
  return promise;
 };
 const entryPaths=new Set(['/','/lab','/lab/','/photographer','/photographer/','/rental','/rental/']);
 const query=new URLSearchParams(location.search);
 if(query.has('logged_out')){try{localStorage.removeItem(KEY)}catch{};return}
 if(!entryPaths.has(location.pathname)||query.has('maintenance_preview')||query.has('token')||query.has('invite'))return;
 document.documentElement.classList.add('pb1493SessionResumePending');
 const release=()=>document.documentElement.classList.remove('pb1493SessionResumePending');
 const validSession=async portal=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
  try{
   const response=await originalFetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':portal},signal:controller.signal});
   if(!response.ok)return false;
   const data=await response.json().catch(()=>null);
   return roleForIdentity(portal,data)?data:false;
  }catch{return false}finally{clearTimeout(timer)}
 };
 (async()=>{
  try{
   let preferred='';try{preferred=localStorage.getItem(KEY)||''}catch{}
   const current=roleForPath(),order=[preferred,current,'lab','rental','photographer'].filter((v,i,a)=>routes[v]&&a.indexOf(v)===i);
   for(const portal of order){
    const identity=await validSession(portal);if(!identity)continue;
    try{localStorage.setItem(KEY,portal)}catch{}
    if(location.pathname!==routes[portal]&&location.pathname!==routes[portal]+'/')location.replace(routes[portal]);
    return;
   }
   try{localStorage.removeItem(KEY)}catch{}
  }finally{release()}
 })();
})();

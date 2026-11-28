import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function once(s,a,b){if(s.split(a).length!==2)throw Error("R2108 anchor "+a.slice(0,100));return s.replace(a,()=>b)}
export function patchPicker(s){
 if(s.includes('PB2108 direct photographer lifecycle'))return s;
 s=once(s,"/* PB2107 direct role login */ if(query.has('logged_out')){try{localStorage.removeItem(KEY);sessionStorage.removeItem('pb2092-account-handoff')}catch{};if(currentPortal()==='photographer'&&normalize(location.pathname)!=='/photographer/login'){try{history.replaceState(history.state,'','/photographer/login?logged_out=1')}catch{}}return}\n if(sensitive())return;\n if(normalize(location.pathname)==='/photographer/login'&&!query.has('pb2087AccountEntry'))return;",`/* PB2108 direct photographer lifecycle */
 const directPhotographer=currentPortal()==='photographer'&&!query.has('pb2092Launch')&&(normalize(location.pathname)==='/photographer/login'||query.has('logged_out'))&&!['token','invite','maintenance_preview','reset','code','redirect','walletPayment','pbAdminShop','pbStorePreview','pbDesktopContent','pbEmbeddedStore','impersonation'].some(k=>query.has(k))&&!/(?:impersonation|token|reset)=/i.test(location.hash||'');
 if(query.has('logged_out')){try{localStorage.removeItem(KEY);sessionStorage.removeItem('pb2092-account-handoff')}catch{};if(!directPhotographer)return;if(normalize(location.pathname)!=='/photographer/login'){try{history.replaceState(history.state,'','/photographer/login?logged_out=1')}catch{}}}
 if(sensitive()&&!directPhotographer)return;`);
 s=once(s,'authorized=handoff,blurred=false,watchTimer=0;','authorized=handoff||directPhotographer,blurred=false,watchTimer=0;');
 s=once(s,'if(!handoff){pending();if(document.hidden)needsResume=true;else void check(true)}','if(!handoff&&!directPhotographer){pending();if(document.hidden)needsResume=true;else void check(true)}');
 s=once(s,"originalFetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':portal},signal:abort.signal})","originalFetch(portal==='photographer'?'/api/auth/me?pb2108Probe=1':'/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':portal},signal:abort.signal})");
 return once(s,' // R2092: every new top-level account document is gated, regardless of referrer.',`
 // Explicit login and logout use the verified server response; navigation is not authentication.
 const pb2108Fetch=window.fetch.bind(window);
 let pb2108Logout=null;
 const pb2108Ordinary=()=>{try{return !sessionStorage.getItem('lablink_test_session')&&!sessionStorage.getItem('photobridge_admin_impersonation')}catch{return false}};
 window.fetch=(input,init)=>{
   let url;try{url=new URL(typeof input==='string'?input:input.url,location.href)}catch{}
   const method=String(init?.method||input?.method||'GET').toUpperCase();
   if(!url||url.origin!==location.origin||method!=='POST'||currentPortal()!=='photographer'||!pb2108Ordinary())return pb2108Fetch(input,init);
   const headers=readHeaders(input,init);
   if(headers.has('x-photobridge-impersonation')||headers.has('authorization')||(headers.has('x-photobridge-portal')&&headers.get('x-photobridge-portal')!=='photographer'))return pb2108Fetch(input,init);
   if(url.pathname==='/api/auth/customer-login'){
     return pb2108Fetch(input,init).then(async response=>{
       if(response.ok){const result=await response.clone().json().catch(()=>null);
         if(result?.ok&&result?.me?.user?.labRole==='customer'){
           authorized=true;needsResume=false;wasHidden=false;blurred=false;loginIntent=false;
           query.delete('logged_out');
           try{const next=new URL(location.href);next.searchParams.delete('logged_out');history.replaceState(history.state,'',next.pathname+next.search+next.hash)}catch{}
           try{sessionStorage.removeItem(TICKET)}catch{}
         }
       }return response;
     });
   }
   if(url.pathname!=='/api/auth/logout')return pb2108Fetch(input,init);
   if(!pb2108Logout){
     headers.set('x-photobridge-portal','photographer');
     const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
     let status=null;try{status=document.createElement('div');status.setAttribute('role','status');status.textContent='در حال خروج از حساب عکاسی…';status.style.cssText='position:fixed;bottom:calc(80px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:2147483647;background:#193459;color:white;padding:10px 16px;border-radius:12px;white-space:nowrap;font:14px Tahoma,sans-serif';document.body?.append(status)}catch{}
     pb2108Logout=Promise.resolve().then(()=>pb2108Fetch(input,{...init,headers,credentials:'include',cache:'no-store',signal:controller.signal})).then(async response=>{
       const result=await response.clone().json().catch(()=>null);
       if(!response.ok||result?.ok!==true)throw Error('photographer_logout_not_confirmed');
       authorized=false;needsResume=false;wasHidden=false;blurred=false;
       try{sessionStorage.removeItem(TICKET);localStorage.removeItem(KEY)}catch{}
       return response;
     }).finally(()=>{clearTimeout(timer);status?.remove();pb2108Logout=null});
   }
   return pb2108Logout.then(response=>response.clone());
 };
 // R2092: every new top-level account document is gated, regardless of referrer.`);
}
export function patchServer(s){
 if(s.includes('PB2108 lightweight photographer account probe'))return s;
 const a="if (req.method === 'GET' && url.pathname === '/api/auth/me') {\n        if (!a)\n            return sendJson(res, 200, null);";
 s=once(s,a,a+`
        // PB2108 lightweight photographer account probe: existing auth and membership checks,
        // without avatar, ancillary queries or a Set-Cookie race.
        if (requestPortal(req) === 'photographer' && url.searchParams.get('pb2108Probe') === '1')
            return sendJson(res, 200, { user: { labRole: a.labRole, name: a.name, photographerName: a.name, mustChangePassword: a.mustChangePassword } });`);
 const i=s.indexOf('const loginWithMobile = async (expected) => {'),j=s.indexOf("if (req.method === 'POST' && url.pathname === '/api/auth/lab-login')",i);
 if(i<0||j<=i)throw Error('R2108 login boundary');
 let login=s.slice(i,j);
 login=once(login,"FROM users u LEFT JOIN photographer_profiles pp ON pp.user_id=u.id WHERE u.mobile IS NOT NULL`);","FROM users u LEFT JOIN photographer_profiles pp ON pp.user_id=u.id WHERE u.mobile IS NOT NULL\n          AND ($1::text IS NULL OR right(regexp_replace(translate(u.mobile,'۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩','01234567890123456789'),'[^0-9]','','g'),10)=$1)`, [expected === 'customer' && /^09\\d{9}$/.test(mobile) ? mobile.slice(-10) : null]);");
 return s.slice(0,i)+login+s.slice(j);
}
export function patchPanel(s){if(s.includes('PB2108 lightweight panel probe'))return s;return once(s,"fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'},signal:AbortSignal.timeout(8000)})","fetch('/api/auth/me?pb2108Probe=1',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'},signal:AbortSignal.timeout(8000)})/* PB2108 lightweight panel probe */")}
export function patchBook(s){if(s.includes('PB2108 hidden Store polling'))return s;return once(s,"function refreshVisibleStoreData(force=false){if(pb2100Submitting)return;if(document.hidden","function refreshVisibleStoreData(force=false){/* PB2108 hidden Store polling */try{if(window.frameElement?.closest('.pb1106ContentPanel')?.hidden)return}catch{}if(pb2100Submitting)return;if(document.hidden")}
function write(p,s){const bytes=Buffer.from(s);fs.writeFileSync(p,bytes);for(const [ext,fn,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,fn(bytes));if(!decode(fs.readFileSync(p+ext)).equals(bytes))throw Error('R2108 stale '+p+ext)}}
export function run(){
 for(const p of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
   let s=fs.readFileSync(p,'utf8'),rx=/(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/g;
   if([...s.matchAll(rx)].length!==1)throw Error('R2108 picker count '+p);
   s=s.replace(rx,(_,a,body,b)=>{const out=patchPicker(body);new Function(out);return a+out+b});
   if(p.endsWith('book.html'))s=patchBook(s);
   s=s.replace(/(photobridge-r1106-mobile-store-panel\.js\?[^"'<> \r\n]+)/g,u=>u.includes('rolePerf=r2108')?u:u+'&rolePerf=r2108');
   write(p,s);
 }
 const panel='dist/web/photobridge-r1106-mobile-store-panel.js';const p=patchPanel(fs.readFileSync(panel,'utf8'));new Function(p);write(panel,p);
 const server='dist/api/server.js';fs.writeFileSync(server,patchServer(fs.readFileSync(server,'utf8')));execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
 console.log('[R2108] mobile photographer explicit login lifecycle, confirmed scoped logout, lean account probes and hidden Store polling');
}
if(process.argv[1]?.endsWith('enable-r2108-photographer-mobile-session.mjs'))run();

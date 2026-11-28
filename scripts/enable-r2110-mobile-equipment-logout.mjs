import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2110 anchor '+a.slice(0,100));return s.replace(a,()=>b)}
export function patchPush(s){
 if(s.includes('PB2110 bounded rental push logout'))return s;
 return once(s,"if(role()==='customer'&&matchMedia('(max-width:820px)').matches&&!token()){","/* PB2110 bounded rental push logout */ if(!token()&&!window.pbNativeStorage&&!window.pb2079StorePreview&&((role()==='customer'&&matchMedia('(max-width:820px)').matches)||(role()==='rental'&&matchMedia('(max-width:850px)').matches))){");
}
export function patchPortal(s){
 if(s.includes('PB2110 mobile rental direct logout'))return s;
 const a="async function rentalLogout(){if(window.pb2079StorePreview){window.pb2079StorePreview.back();return;}";
 s=once(s,a,a+`/* PB2110 mobile rental direct logout */
 if(matchMedia('(max-width:850px)').matches&&!window.pbNativeStorage){
   if(window.pb2107RentalLogoutPending)return;
   window.pb2107RentalLogoutPending=true;
   const buttons=[$('#logout'),$('#rentalMobileLogout')].filter(Boolean),old=buttons.map(b=>b.textContent);
   for(const b of buttons){b.disabled=true;b.setAttribute('aria-busy','true');b.textContent='در حال خروج…'}
   stopRentalLiveWatch();
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
   try{
     const result=await api('/api/auth/logout',{method:'POST',headers:{'x-photobridge-portal':'rental','x-photobridge-mobile-logout':'1'},signal:controller.signal});
     if(result?.ok!==true)throw Error('logout_not_confirmed');
     window.__PB_RENTAL_PORTAL_AUTH_READY__=false;
     window.__pbRentalAccount=null;window.__pbRentalProfileImage='';
     try{sessionStorage.removeItem('pb_rental_staff_test');sessionStorage.removeItem('pb2092-account-handoff');localStorage.removeItem('photobridge:pwa:last-portal')}catch{}
     try{showLogin()}catch{}
     location.replace('/rental?logged_out=1');
   }catch{
     window.pb2107RentalLogoutPending=false;
     buttons.forEach((b,i)=>{b.disabled=false;b.removeAttribute('aria-busy');b.textContent=old[i]});
     if(window.__PB_RENTAL_PORTAL_AUTH_READY__)startRentalLiveWatch();
     alert('خروج از حساب تأیید نشد؛ اتصال را بررسی و دوباره تلاش کنید.');
   }finally{clearTimeout(timer)}
   return;
 }
 `);
 return s;
}
export function patchServer(s){
 if(s.includes('PB2110 scoped mobile rental logout'))return s;
 const a="async function api(req, res, url) {";
 return once(s,a,a+`
    // PB2110 scoped mobile rental logout: revoke only the presented rental cookie.
    // No role lookup, store membership query, or rolling session renewal is needed.
    // Explicit admin store previews and Bearer/impersonation flows retain their old handlers.
    if (req.method === 'POST' && url.pathname === '/api/auth/logout' && requestPortal(req) === 'rental' &&
        String(req.headers['x-photobridge-mobile-logout'] || '') === '1' && !bearerToken(req) && pb2079PreviewScope(req) === null) {
        const t = cookie(req, sessionCookieName('rental'));
        if (t) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash(t)]);
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        res.setHeader('set-cookie', sessionCookieName('rental') + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT' + secure);
        return sendJson(res, 200, { ok: true });
    }`);
}
function write(p,s){const b=Buffer.from(s);fs.writeFileSync(p,b);for(const [ext,compress,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,compress(b));if(!decode(fs.readFileSync(p+ext)).equals(b))throw Error('R2110 stale '+p+ext)}}
export function run(){
 const p='dist/web/photobridge-push-v728.js',push=patchPush(fs.readFileSync(p,'utf8'));new Function(push);write(p,push);
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
  let s=fs.readFileSync(file,'utf8');
  if(file.endsWith('portal.html')){s=patchPortal(s);const i=s.indexOf('async function rentalLogout(){'),j=s.indexOf("$('#logout').addEventListener",i);if(i<0||j<=i)throw Error('R2110 logout boundary');new Function(s.slice(i,j))}
  s=s.replace(/photobridge-push-v728\.js(?:\?[^"'<>\s]*)?/g,u=>u.includes('rentalLogout=r2110')?u:u+(u.includes('?')?'&':'?')+'rentalLogout=r2110');write(file,s);
 }
 const server='dist/api/server.js';write(server,patchServer(fs.readFileSync(server,'utf8')));execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
 console.log('[R2110] bounded rental Web Push cleanup, immediate mobile Store logout, direct scoped session revocation, separate admin preview');
}
if(process.argv[1]?.endsWith('enable-r2110-mobile-equipment-logout.mjs'))run();

import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2113 anchor: '+a.slice(0,100));return s.replace(a,()=>b)}
export function patchPicker(s){
 if(s.includes('/* PB2113 rental account probe */'))return s;
 s=once(s,"portal==='photographer'?'/api/auth/me?pb2108Probe=1':'/api/auth/me'","portal==='photographer'?'/api/auth/me?pb2108Probe=1':portal==='rental'?'/api/auth/me?pb2113Probe=1':'/api/auth/me'/* PB2113 rental account probe */");
 s=once(s,"if(selected==='photographer'&&valid?.uncertain)valid=await validSession(selected,8000);","if((selected==='photographer'||selected==='rental')&&valid?.uncertain)valid=await validSession(selected,8000);");
 s=once(s,"const verified=await validSession(portal);","let verified=await validSession(portal);if(portal==='rental'&&verified?.uncertain)verified=await validSession(portal,8000);");

 // R2099 adds the short handoff guard only to index/book; the rental portal
 // does not contain it. R2106 already preserves authorized workspaces in all
 // three documents. Require that common guard, and widen R2099 only if present.
 if(!s.includes('PB2106 preserve selected workspace')||!s.includes('if(authorized&&!checking&&!chooser&&currentPortal())'))throw Error('R2113 R2106 workspace guard missing');
 const legacy="if(currentPortal()==='photographer'&&authorized&&!needsResume&&Date.now()-pb2103SelectedAt<12000";
 if(s.includes(legacy))s=once(s,legacy,"if(['photographer','rental'].includes(currentPortal())&&authorized&&!needsResume&&Date.now()-pb2103SelectedAt<12000");
 return s;
}
export function patchServer(s){
 if(s.includes('/* PB2113 scoped rental identity probe */'))return s;
 const a="return sendJson(res, 200, { user: { labRole: a.labRole, name: a.name, photographerName: a.name, mustChangePassword: a.mustChangePassword } });";
 s=once(s,a,a+`
        /* PB2113 scoped rental identity probe */
        if (requestPortal(req) === 'rental' && url.searchParams.get('pb2113Probe') === '1' && pb2079PreviewScope(req) === null) {
            if (!a.rentalShopId || !['shop_admin','shop_operator','shop_staff','handover_staff'].includes(a.rentalRole))
                return sendJson(res, 200, null);
            const shop = (await pool.query('SELECT id,name FROM equipment_rental_shops WHERE id=$1 AND deleted_at IS NULL', [a.rentalShopId])).rows[0] || null;
            return sendJson(res, 200, shop ? { user: { rentalRole: a.rentalRole, mustChangePassword: a.mustChangePassword }, rentalShop: shop } : null);
        }`);
 return once(s,"expected === 'customer' && /^09\\d{9}$/.test(mobile) ? mobile.slice(-10) : null","(expected === 'customer' || expected === 'rental') && /^09\\d{9}$/.test(mobile) ? mobile.slice(-10) : null");
}
const loginCSS="<style id=\"pb2113RentalLoginTop\">\n@media screen and (max-width:850px){\nhtml:root body:not(.rentalAppReady) #loginView.rentalLoginOverlay:not(.hidden){position:fixed!important;inset:0 0 auto!important;width:100%!important;height:var(--pb-login-height,100dvh)!important;max-height:var(--pb-login-height,100dvh)!important;min-height:0!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;align-items:center!important;margin:0!important;padding:calc(8px + env(safe-area-inset-top)) 10px 8px!important;overflow-y:auto!important;overflow-x:hidden!important;background:radial-gradient(ellipse at 50% 4%,#dceaff 0%,#ecf4ff 36%,#f5f9ff 73%,#f8fbff 100%)!important}\nhtml:root body:not(.rentalAppReady) #loginView.rentalLoginOverlay:not(.hidden)>.authShell{width:min(420px,100%)!important;max-width:420px!important;margin:0 auto!important;padding:0!important;flex:0 0 auto!important;min-height:0!important;transform:none!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm:not(.hidden){display:grid!important;grid-template-columns:max-content minmax(0,1fr)!important;grid-auto-rows:min-content!important;column-gap:9px!important;row-gap:7px!important;align-items:center!important;padding:13px 14px!important;width:100%!important;max-width:100%!important;margin:0!important;background:#fff!important;border:1px solid #d6e4fa!important;border-radius:15px!important;box-shadow:0 18px 48px rgba(35,79,169,.11)!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>*{grid-column:1/-1;min-width:0}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>.unifiedLoginBrand{grid-column:1!important;grid-row:1!important;display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:7px!important;margin:0!important;padding:0 0 0 9px!important;min-height:38px!important;border-inline-end:1px solid #e2e8f2;white-space:nowrap!important;direction:rtl!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm .unifiedLoginLogo{width:34px!important;height:34px!important;flex:0 0 34px!important;object-fit:contain}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>.unifiedLoginBrand b{font-size:16px!important;direction:ltr!important;white-space:nowrap!important;color:#17376f!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>.authTitle{grid-column:2!important;grid-row:1!important;margin:0!important;padding:0!important;text-align:right!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>.authTitle h1{font-size:15px!important;line-height:1.55!important;margin:0!important;color:#17376f!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm>.authTitle p{display:none!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm input:not([type=checkbox]){min-height:38px!important;height:38px!important;font-size:16px!important;background:#f9fbff!important;border-color:#cbdcf5!important}\nhtml:root body:not(.rentalAppReady) #loginView #loginForm button.primary{min-height:40px!important;height:40px!important;background:linear-gradient(135deg,#315efb,#244fc7)!important;color:#fff!important}\nhtml.pbR1302LoginFocus body:not(.rentalAppReady) #loginView #loginForm .authFooterLinks{display:none!important}\n}</style>";
export function patchRental(s){
 if(s.includes('id="pb2113RentalLoginTop"'))return s;
 s=once(s,"await api('/api/auth/rental-login',{method:'POST',body:JSON.stringify(body)});const rentalIdentity=await api('/api/auth/me',{headers:{'x-photobridge-portal':'rental'}});",`const loginResult=await api('/api/auth/rental-login',{method:'POST',body:JSON.stringify(body)});
    const mobileLogin=matchMedia('(max-width:850px)').matches&&!window.pbNativeStorage&&!window.pb2079StorePreview;
    const rentalIdentity=mobileLogin&&loginResult?.ok===true&&loginResult?.me?.user?.rentalRole&&loginResult?.me?.rentalShop?.id?loginResult.me:await api('/api/auth/me',{headers:{'x-photobridge-portal':'rental'}});`);
 const start="$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();message('#loginMsg','');";
 s=once(s,start,start.replace("message('#loginMsg','');","/* PB2113 single login submit */ const form=e.currentTarget,submit=form.querySelector('button.primary');if(form.dataset.pb2113Pending==='1')return;form.dataset.pb2113Pending='1';const old=submit?.textContent;if(submit){submit.disabled=true;submit.textContent='در حال ورود…';}message('#loginMsg','');"));
 const i=s.indexOf('/* PB2113 single login submit */'),j=s.indexOf('async function rentalLogout(){',i);
 if(i<0||j<=i)throw Error('R2113 login boundary');
 s=s.slice(0,i)+once(s.slice(i,j),":'ورود انجام نشد.')}});",":'ورود انجام نشد.')}finally{delete form.dataset.pb2113Pending;if(submit){submit.disabled=false;submit.textContent=old}}});")+s.slice(j);
 const close=s.lastIndexOf('</body>');if(close<0)throw Error('R2113 portal body');
 return s.slice(0,close)+loginCSS+s.slice(close);
}

function write(p,s){const b=Buffer.from(s);fs.writeFileSync(p,b);for(const [ext,enc,dec] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,enc(b));if(!dec(fs.readFileSync(p+ext)).equals(b))throw Error('R2113 stale '+p+ext)}}
export function run(){
 for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
  let s=fs.readFileSync(p,'utf8');const re=/(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/g;
  if([...s.matchAll(re)].length!==1)throw Error('R2113 picker count '+p);
  s=s.replace(re,(_,a,b,c)=>{const out=patchPicker(b);new Function(out);return a+out+c});
  if(p.endsWith('portal.html')){s=patchRental(s);const a=s.indexOf("$('#loginForm').addEventListener('submit'"),b=s.indexOf('async function rentalLogout(){',a);new Function(s.slice(a,b))}
  write(p,s);
 }
 const server='dist/api/server.js';write(server,patchServer(fs.readFileSync(server,'utf8')));execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
 console.log('[R2113] verified Store selection retries, lean identity and top-aligned login');
}
if(process.argv[1]?.endsWith('enable-r2113-mobile-store-entry.mjs'))run();

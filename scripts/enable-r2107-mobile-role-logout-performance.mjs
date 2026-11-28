import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2107 anchor '+a.slice(0,100));return s.replace(a,()=>b)}
export function patchPicker(s){
 if(s.includes('PB2107 direct role login'))return s;
 s=once(s,"if(query.has('logged_out')){try{localStorage.removeItem(KEY)}catch{};return}","/* PB2107 direct role login */ if(query.has('logged_out')){try{localStorage.removeItem(KEY);sessionStorage.removeItem('pb2092-account-handoff')}catch{};if(currentPortal()==='photographer'&&normalize(location.pathname)!=='/photographer/login'){try{history.replaceState(history.state,'','/photographer/login?logged_out=1')}catch{}}return}");
 // Direct login links are deliberate; cold PWA launches still go through the verified role picker.
 s=once(s,"if(sensitive())return;","if(sensitive())return;\n if(normalize(location.pathname)==='/photographer/login'&&!query.has('pb2087AccountEntry'))return;");
 s=once(s,"if(move(routes[portal],true)){moving=true;return}","if(move(portal==='photographer'?'/photographer/login':routes[portal],true)){moving=true;return}");
 // An explicit new Photographer login does not need a second probe of an absent account.
 s=once(s,"const verified=await validSession(portal);","if(portal==='photographer'&&!accounts.some(a=>a.portal===portal)){needsResume=false;wasHidden=false;blurred=false;if(move('/photographer/login',true)){moving=true;return}}\n           const verified=await validSession(portal);");
 return s;
}
export function patchRentalLogout(s){
 if(s.includes('PB2107 confirmed rental logout'))return s;
 const before="try{await api('/api/auth/logout',{method:'POST',headers:{'x-photobridge-portal':'rental'}})}catch{}location.reload()";
 const after="/* PB2107 confirmed rental logout */ if(window.pb2107RentalLogoutPending)return;window.pb2107RentalLogoutPending=true;const buttons=[$('#logout'),$('#rentalMobileLogout')].filter(Boolean),old=buttons.map(b=>b.textContent);for(const b of buttons){b.disabled=true;b.setAttribute('aria-busy','true');b.textContent='در حال خروج…'}try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let result;try{result=await api('/api/auth/logout',{method:'POST',headers:{'x-photobridge-portal':'rental'},signal:controller.signal})}finally{clearTimeout(timer)}if(!result?.ok)throw Error('logout_not_confirmed');try{stopRentalLiveWatch()}catch{}if(matchMedia('(max-width:820px)').matches&&!window.pbNativeStorage){try{showLogin()}catch{}location.replace('/rental?logged_out=1')}else location.reload()}catch{window.pb2107RentalLogoutPending=false;buttons.forEach((b,i)=>{b.disabled=false;b.removeAttribute('aria-busy');b.textContent=old[i]});alert('خروج از حساب تأیید نشد؛ اتصال را بررسی و دوباره تلاش کنید.')}";
 return once(s,before,after);
}
export function patchPanel(s){
 if(s.includes('PB2107 relevant dock mutations'))return s;
 s=once(s,'let dock,dockObserver,selected=null','let dock,dockObserver,pb2107ResizeObserver,selected=null');
 s=once(s,'dockObserver?.disconnect();dock=nav;new ResizeObserver(size).observe(nav);','dockObserver?.disconnect();pb2107ResizeObserver?.disconnect();dock=nav;pb2107ResizeObserver=new ResizeObserver(size);pb2107ResizeObserver.observe(nav);');
 s=once(s,'dockObserver?.disconnect();dock=null;','dockObserver?.disconnect();pb2107ResizeObserver?.disconnect();pb2107ResizeObserver=null;dock=null;');
 s=once(s,'new MutationObserver(pb2103QueueSync).observe(document.body,{childList:true,subtree:true})',"new MutationObserver(records=>{ /* PB2107 relevant dock mutations */ if(dock&&!dock.isConnected){pb2103QueueSync();return}for(const record of records){if(dock&&(record.target===dock||dock.contains(record.target))){pb2103QueueSync();return}for(const node of record.addedNodes){if(node.nodeType===1&&(node.matches?.('.photographerBottomAppNav')||node.querySelector?.('.photographerBottomAppNav'))){pb2103QueueSync();return}}}}).observe(document.body,{childList:true,subtree:true})");
 s=once(s,"new MutationObserver(hideEmbeddedDock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});","new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'){if(record.target.matches?.('#photographerStoreBottomNav,.photographerBottomAppNav')){hideEmbeddedDock();return}}else for(const node of record.addedNodes){if(node.nodeType===1&&(node.matches?.('#photographerStoreBottomNav,.photographerBottomAppNav')||node.querySelector?.('#photographerStoreBottomNav,.photographerBottomAppNav'))){hideEmbeddedDock();return}}}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});");
 return s;
}
export function patchServer(s){
 if(s.includes('PB2107 avoid redundant session writes'))return s;
 const start=s.indexOf('async function auth(req) {'),end=s.indexOf('function requireRole(',start);
 if(start<0||end<=start)throw Error('R2107 auth boundary');
 let part=s.slice(start,end);
 part=once(part,'SELECT u.id,u.name,u.mobile,u.platform_role,u.force_password_change,u.photographer_enabled,','SELECT s.expires_at AS pb2107_session_expiry,u.id,u.name,u.mobile,u.platform_role,u.force_password_change,u.photographer_enabled,');
 // No session cache: all existing membership, expiry, suspension and role checks still execute.
 // For photographer/rental requests, a nearly full rolling session needs no new UPDATE/row lock.
 part=once(part,'if (!adminImpersonation)\n        await pool.query(','/* PB2107 avoid redundant session writes */\n    const pb2107Scoped = portal === "photographer" || portal === "rental";\n    const pb2107Expiry = new Date(r.pb2107_session_expiry).getTime();\n    if (!adminImpersonation && (!pb2107Scoped || !Number.isFinite(pb2107Expiry) || pb2107Expiry < Date.now() + (DAYS * 86400 - 300) * 1000))\n        await pool.query(');
 return s.slice(0,start)+part+s.slice(end);
}
function write(p,s){const bytes=Buffer.from(s);fs.writeFileSync(p,bytes);for(const [ext,fn] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(p+ext))fs.writeFileSync(p+ext,fn(bytes))}
export function run(){
 for(const p of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
  let s=fs.readFileSync(p,'utf8');const rx=/(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/g;
  if([...s.matchAll(rx)].length!==1)throw Error('R2107 picker count '+p);
  s=s.replace(rx,(_,a,body,b)=>{const out=patchPicker(body);new Function(out);return a+out+b});
  if(p.endsWith('portal.html'))s=patchRentalLogout(s);
  s=s.replace(/(photobridge-r1106-mobile-store-panel\.js\?[^"'<>\s]+)/g,u=>u.includes('rolePerf=r2107')?u:u+'&rolePerf=r2107');
  write(p,s);
 }
 const panel='dist/web/photobridge-r1106-mobile-store-panel.js';const p=patchPanel(fs.readFileSync(panel,'utf8'));new Function(p);write(panel,p);
 const server='dist/api/server.js';fs.writeFileSync(server,patchServer(fs.readFileSync(server,'utf8')));execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
 console.log('[R2107] direct mobile role login, confirmed Store logout, relevant dock mutations, bounded rolling session writes');
}
if(process.argv[1]?.endsWith('enable-r2107-mobile-role-logout-performance.mjs'))run();

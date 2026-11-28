import fs from 'node:fs';
import zlib from 'node:zlib';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2109 anchor '+a.slice(0,100));return s.replace(a,()=>b)}
function installNavRead(w){
 if(w.pb2109NavRead)return;
 let epoch=0;const cache=new Map();
 const reset=()=>{epoch++;cache.clear()};
 w.addEventListener('photobridge-auth-session-changed',reset);
 w.pb2109NavRead=(path,opt={})=>{
  const headers=new Headers(opt.headers||{}),portal=headers.get('x-photobridge-portal');
  if(!matchMedia('(max-width:820px)').matches||portal!=='photographer'||headers.has('authorization')||headers.has('x-photobridge-impersonation')||path!=='/api/photographer/navigation-tabs'||(opt.method&&opt.method!=='GET'))return w.fetch(path,opt);
  const key='photographer',now=Date.now(),old=cache.get(key);
  if(old&&(old.pending||now-old.at<5000))return old.promise.then(r=>r.clone());
  const current=epoch,entry={pending:true,at:0,promise:null};
  entry.promise=Promise.resolve().then(()=>w.fetch(path,opt)).then(r=>{
    entry.pending=false;entry.at=Date.now();
    if(!r.ok||current!==epoch){if(cache.get(key)===entry)cache.delete(key)}
    return r;
  },err=>{if(cache.get(key)===entry)cache.delete(key);throw err});
  cache.set(key,entry);return entry.promise.then(r=>r.clone());
 };
}
function relevantNav(records,selector){
 for(const r of records){
  if(r.target?.nodeType===1&&(r.target.matches?.(selector)||r.target.closest?.(selector)))return true;
  if(r.type==='childList')for(const node of [...r.addedNodes,...r.removedNodes])if(node.nodeType===1&&(node.matches?.(selector)||node.querySelector?.(selector)))return true;
 }
 return false;
}
export function patchTabs(s){
 if(s.includes('PB2109 scoped feature navigation'))return s;
 s=once(s,"'use strict';","'use strict';\n/* PB2109 scoped feature navigation */\n("+installNavRead.toString()+")(window);\n"+relevantNav.toString());
 s=once(s,"const r=await fetch(path,{credentials:'include',cache:'no-store',...options,headers:","const r=await window.pb2109NavRead(path,{credentials:'include',cache:'no-store',...options,headers:");
 s=once(s,"new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-label','href']})","new MutationObserver(records=>{if(!photographer()||!matchMedia('(max-width:820px)').matches||relevantNav(records,'.photographerHeaderNav,.photographerHomeModeNav,.photographerBottomAppNav,#pbHomeMobileMenu,#photographerStoreBottomNav'))schedule()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-label','href']})");
 return s;
}
export function patchCrm(s){
 if(s.includes('PB2109 scoped CRM navigation'))return s;
 s=once(s,"  'use strict';","  'use strict';\n/* PB2109 scoped CRM navigation */\n("+installNavRead.toString()+")(window);\n"+relevantNav.toString());
 s=once(s,"const response=await fetch('/api/photographer/navigation-tabs',{","const response=await window.pb2109NavRead('/api/photographer/navigation-tabs',{");
 s=once(s,"    queueMicrotask(render);","    if(media.matches&&/^\\/photographer(?:\\/|$)/.test(location.pathname))requestAnimationFrame(render);else queueMicrotask(render);");
 s=once(s,"const observer=new MutationObserver(schedule);","const observer=new MutationObserver(records=>{if(!media.matches||!/^\\/photographer(?:\\/|$)/.test(location.pathname)||relevantNav(records,'.photographerBottomAppNav,.photographerHeaderNav,.photographerHomeModeNav,#photographerStoreBottomNav,main.photographerMain'))schedule()});");
 // Do not match every descendant of main: only its insertion/removal matters; dock changes are enough thereafter.
 s=once(s,",main.photographerMain'))schedule()", "'))schedule()");
 return s;
}
export function patchWallet(s){
 if(s.includes('PB2109 admin wallet route isolation'))return s;
 return once(s,"'use strict';\nconst ID='pb861AdminStoreWallet';","'use strict';\n/* PB2109 admin wallet route isolation */\nif(!/^\\/admin(?:\\/|$)/.test(location.pathname))return;\nconst ID='pb861AdminStoreWallet';");
}
export function patchPush(s){
 if(s.includes('PB2109 bounded Photographer push cleanup'))return s;
 s=once(s,"async function unsubscribeCurrentAccount(){","async function unsubscribeCurrentAccount(signal){");
 s=once(s,"const reg=await navigator.serviceWorker?.getRegistration?.('/');\n      const sub=await reg?.pushManager?.getSubscription?.();","const reg=await navigator.serviceWorker?.getRegistration?.('/');\n      if(signal?.aborted)return false;\n      try{reg?.active?.postMessage?.({type:'PB_PUSH_LOGOUT'})}catch{}\n      const sub=await reg?.pushManager?.getSubscription?.();\n      if(signal?.aborted)return false;");
 s=once(s,"headers:headers(),body:JSON.stringify({endpoint:sub.endpoint})})","headers:headers(),body:JSON.stringify({endpoint:sub.endpoint}),signal})");
 s=once(s,"try{await sub.unsubscribe()}catch{}","if(signal?.aborted)return false;\n        try{await sub.unsubscribe()}catch{}");
 s=once(s,"if(path==='/api/auth/logout'&&method==='POST')await unsubscribeCurrentAccount();","/* PB2109 bounded Photographer push cleanup */\n      if(path==='/api/auth/logout'&&method==='POST'){\n        if(role()==='customer'&&matchMedia('(max-width:820px)').matches&&!token()){\n          const controller=new AbortController();let timer;\n          try{await Promise.race([unsubscribeCurrentAccount(controller.signal),new Promise(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(false)},1500)})])}finally{clearTimeout(timer)}\n        }else await unsubscribeCurrentAccount();\n      }");
 return s;
}
const files={
 'photobridge-r1099-photographer-tabs.js':patchTabs,
 'photobridge-r1761-crm-nav.js':patchCrm,
 'photobridge-v861-store-wallet-admin.js':patchWallet,
 'photobridge-push-v728.js':patchPush
};
function write(p,s){const b=Buffer.from(s);fs.writeFileSync(p,b);for(const [ext,compress,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,compress(b));if(!decode(fs.readFileSync(p+ext)).equals(b))throw Error('R2109 stale '+p+ext)}}
export function run(){
 for(const [name,patch] of Object.entries(files)){const p='dist/web/'+name,s=patch(fs.readFileSync(p,'utf8'));new Function(s);write(p,s)}
 for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
  let s=fs.readFileSync(p,'utf8');for(const name of Object.keys(files))s=s.replace(new RegExp(name.replace(/\./g,'\\.')+'(?:\\?[^"\\x27<>\\s]*)?','g'),u=>u.includes('latency=r2109')?u:u+(u.includes('?')?'&':'?')+'latency=r2109');
  write(p,s);
 }
 console.log('[R2109] role-scoped admin scripts, single-flight mobile navigation settings, scoped observer scheduling, bounded push logout');
}
if(process.argv[1]?.endsWith('enable-r2109-photographer-mobile-latency.mjs'))run();

// R2087: final website-only mobile session picker, after previous role and auth writers.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
function write(p,s){
 fs.writeFileSync(p,s);const bytes=fs.readFileSync(p);
 for(const [ext,enc,dec] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]]){
  if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,enc(bytes));if(!dec(fs.readFileSync(p+ext)).equals(bytes))throw Error('R2087 stale '+p+ext)}
 }
}
const old=read('scripts/r1493-mobile-session-resume.js');
const cut=old.indexOf(' const entryPaths=new Set([');
if(cut<0)throw Error('R2087 original resume boundary');
const source=old.slice(0,cut).replace("'shop_operator','shop_staff'","'shop_operator','shop_staff','handover_staff'").replace("navigator.standalone===true||matchMedia('(display-mode: standalone)').matches","navigator.standalone===true||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches")+
 read('scripts/r2087-mobile-account-picker.js.txt')+'\n})();\n';
new Function(source);
const css='<style id="pb2087AccountPickerStyle">@media(max-width:820px){html.pb2087AccountPending body #root,html.pb2087AccountPending body #loginView,html.pb2087AccountPending body #appView{visibility:hidden!important;pointer-events:none!important}html.pb2087AccountPending body::after{content:"در حال بررسی حساب‌ها…";position:fixed;inset:0;display:grid;place-items:center;background:#edf5ff;color:#315efb;font:700 15px Vazirmatn,Tahoma,sans-serif;z-index:2147483646;pointer-events:auto}html.pb2087AccountPending body:has(#pb2087AccountPicker)::after{content:"";pointer-events:none}.pb2090AccountNotice{margin:0 0 12px!important;color:#9a5a12!important}.pb2090AccountRetry{min-height:44px;width:100%;background:#fff;border:1px solid #d7e4f7;border-radius:12px;color:#315efb;font:700 14px Vazirmatn,Tahoma,sans-serif;cursor:pointer}#pb2087AccountPicker{position:fixed!important;inset:0!important;margin:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border:0!important;padding:max(24px,env(safe-area-inset-top)) 20px max(24px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important;background:linear-gradient(145deg,#edf5ff,#f8fbff)!important;color:#193459!important;overflow:auto!important;z-index:2147483647!important;font-family:Vazirmatn,Tahoma,sans-serif!important}#pb2087AccountPicker[open]{display:flex!important;align-items:safe center!important;justify-content:center!important}#pb2087AccountPicker::backdrop{background:#edf5ff!important}.pb2087AccountPanel{width:min(420px,100%);margin:auto;text-align:center;direction:rtl}.pb2087AccountBrand{font:800 24px/1.5 Arial,sans-serif;color:#315efb;margin:0 0 32px}.pb2087AccountPanel h1{font-size:22px;margin:0 0 8px}.pb2087AccountPanel p{font-size:14px;color:#62748b;margin:0 0 32px}.pb2087AccountOption{width:100%;min-height:98px;display:grid;grid-template-columns:52px minmax(0,1fr) 24px;direction:rtl;align-items:center;gap:14px;box-sizing:border-box;border:1px solid #d7e4f7;border-radius:18px;padding:15px;background:#fff;color:#193459;box-shadow:0 5px 18px #254c8310;margin:0 0 15px;text-align:right;cursor:pointer;font:inherit}.pb2087AccountOption:focus-visible{outline:3px solid #315efb;outline-offset:2px}.pb2087AccountOption:active,.pb2087AccountOption[aria-pressed="true"]{background:#e6efff;border-color:#315efb}.pb2087AccountOption:disabled{opacity:1;cursor:default}.pb2087AccountIcon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:#e8f0ff;color:#315efb}.pb2087AccountIcon::before{content:"";width:28px;height:28px;background:currentColor;-webkit-mask:var(--pb2088-icon) center/contain no-repeat;mask:var(--pb2088-icon) center/contain no-repeat}.pb2087AccountIcon[data-icon="photographer"]{--pb2088-icon:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%226%22%20width%3D%2218%22%20height%3D%2215%22%20rx%3D%223%22%2F%3E%3Cpath%20d%3D%22M8%206l2-3h4l2%203%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2213%22%20r%3D%224%22%2F%3E%3C%2Fsvg%3E")}.pb2087AccountIcon[data-icon="lab"]{--pb2088-icon:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M7%208V3h10v5M7%2017H4a2%202%200%200%201-2-2v-5a2%202%200%200%201%202-2h16a2%202%200%200%201%202%202v5a2%202%200%200%201-2%202h-3%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%2214%22%20width%3D%2210%22%20height%3D%227%22%20rx%3D%221%22%2F%3E%3Cpath%20d%3D%22M17%2011h1%22%2F%3E%3C%2Fsvg%3E")}.pb2087AccountIcon[data-icon="rental"]{--pb2088-icon:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22black%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3%209l2-6h14l2%206M3%209v2a3%203%200%200%200%206%200%203%203%200%200%200%206%200%203%203%200%200%200%206%200V9H3zM5%2014v7h14v-7M10%2021v-5h4v5%22%2F%3E%3C%2Fsvg%3E")}.pb2087AccountCopy{min-width:0;display:grid;gap:6px;direction:rtl;text-align:right;align-content:center}.pb2087AccountCopy strong{font-size:17px}.pb2087AccountCopy small{font-size:12px;color:#63758c;overflow-wrap:anywhere}.pb2087AccountArrow{display:grid;place-items:center;width:24px;height:24px;color:#315efb;direction:ltr;justify-self:center}.pb2087AccountArrow::before{content:"";width:10px;height:10px;border-left:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg)}}</style>';
const tag='<script id="pb1493MobileSessionResume">'+source.replaceAll('</script>','<\\/script>')+'</script>';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=read(file);
 const rx=/<script id="pb1493MobileSessionResume">[\s\S]*?<\/script>/g;
 const hits=[...html.matchAll(rx)];
 if(hits.length>1)throw Error('R2087 duplicate resume '+file);
 if(hits.length===1)html=html.replace(rx,()=>tag);
 else if(file.endsWith('book.html')){const head=html.indexOf('</head>');if(head<0)throw Error('R2087 book head');html=html.slice(0,head)+tag+html.slice(head)}
 else throw Error('R2087 missing resume '+file);
 const cssRx=/<style id="pb2087AccountPickerStyle">[\s\S]*?<\/style>/g;
 if(html.includes('id="pb2087AccountPickerStyle"'))html=html.replace(cssRx,()=>css);else html=html.replace('<script id="pb1493MobileSessionResume">',css+'<script id="pb1493MobileSessionResume">');
 // Existing R1963 sends neutral PWA launches straight to Photographer.
 // Let this chooser own neutral mobile starts, preserving other environments.
 html=html.replace("if(installed&&p==='/'){location.replace('/photographer');return}","if(installed&&p==='/'&&!matchMedia('(max-width:820px)').matches){location.replace('/photographer');return}");
 if(file==='dist/web/index.html'){
  const entry=/photobridge-r100f5-entry-routing\.js\?[^"'<>\s]+/g;
  if([...html.matchAll(entry)].length!==1)throw Error('R2087 photographer routing asset');
  html=html.replace(entry,u=>u.replace(/&accountPicker=r\d+/g,'')+'&accountPicker=r2090');
 }
 write(file,html);
}
const entryFile='dist/web/photobridge-r100f5-entry-routing.js';
let entry=read(entryFile);
if(!entry.includes('/* PB2087 wait for account selection */')){
 const anchor='  async function route(){';
 if(entry.split(anchor).length!==2)throw Error('R2087 routing anchor');
 entry=entry.replace(anchor,anchor+'\n    /* PB2087 wait for account selection */\n    if(document.documentElement.classList.contains("pb2087AccountPending"))return;');
 const ready="  addEventListener('pb2087-account-ready',()=>setTimeout(route,0));";
 entry=entry.replace(anchor,ready+'\n'+anchor);
}
new Function(entry);write(entryFile,entry);
execFileSync(process.execPath,['--check',entryFile],{stdio:'inherit'});
console.log('[R2090] explicit mobile account selection, foreground resume and retry; no automatic valid-role entry');

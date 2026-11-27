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
const source=old.slice(0,cut).replace("'shop_operator','shop_staff'","'shop_operator','shop_staff','handover_staff'")+
 read('scripts/r2087-mobile-account-picker.js.txt')+'\n})();\n';
new Function(source);
const css='<style id="pb2087AccountPickerStyle">@media(max-width:820px){html.pb2087AccountPending body #root{visibility:hidden!important;pointer-events:none!important}#pb2087AccountPicker{position:fixed!important;inset:0!important;margin:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border:0!important;padding:24px 20px!important;box-sizing:border-box!important;background:linear-gradient(145deg,#edf5ff,#f8fbff)!important;color:#193459!important;overflow:auto!important;z-index:2147483647!important;font-family:Vazirmatn,Tahoma,sans-serif!important}#pb2087AccountPicker[open]{display:flex!important;align-items:safe center!important;justify-content:center!important}#pb2087AccountPicker::backdrop{background:#edf5ff!important}.pb2087AccountPanel{width:min(420px,100%);margin:auto;text-align:center}.pb2087AccountBrand{font:800 24px/1.5 Arial,sans-serif;color:#315efb;margin:0 0 25px}.pb2087AccountPanel h1{font-size:22px;margin:0 0 8px}.pb2087AccountPanel p{font-size:14px;color:#62748b;margin:0 0 26px}.pb2087AccountOption{width:100%;min-height:82px;display:flex;align-items:center;gap:13px;box-sizing:border-box;border:1px solid #d7e4f7;border-radius:16px;padding:13px;background:#fff;color:#193459;box-shadow:0 5px 18px #254c8310;margin:0 0 12px;text-align:right;cursor:pointer;font:inherit}.pb2087AccountOption:focus-visible{outline:3px solid #315efb;outline-offset:2px}.pb2087AccountOption:active{background:#e6efff}.pb2087AccountIcon{display:grid;place-items:center;flex:0 0 46px;height:46px;border-radius:13px;background:#e8f0ff;color:#315efb;font-size:25px}.pb2087AccountCopy{flex:1;min-width:0;display:grid;gap:5px}.pb2087AccountCopy strong{font-size:17px}.pb2087AccountCopy small{font-size:12px;color:#63758c;overflow-wrap:anywhere}.pb2087AccountArrow{color:#315efb;font-size:26px}}</style>';
const tag='<script id="pb1493MobileSessionResume">'+source.replaceAll('</script>','<\\/script>')+'</script>';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=read(file);
 const rx=/<script id="pb1493MobileSessionResume">[\s\S]*?<\/script>/g;
 const hits=[...html.matchAll(rx)];
 if(hits.length>1)throw Error('R2087 duplicate resume '+file);
 if(hits.length===1)html=html.replace(rx,()=>tag);
 else if(file.endsWith('book.html')){const head=html.indexOf('</head>');if(head<0)throw Error('R2087 book head');html=html.slice(0,head)+tag+html.slice(head)}
 else throw Error('R2087 missing resume '+file);
 if(!html.includes('id="pb2087AccountPickerStyle"'))html=html.replace('<script id="pb1493MobileSessionResume">',css+'<script id="pb1493MobileSessionResume">');
 // Existing R1963 sends neutral PWA launches straight to Photographer.
 // Let this chooser own neutral mobile starts, preserving other environments.
 html=html.replace("if(installed&&p==='/'){location.replace('/photographer');return}","if(installed&&p==='/'&&!matchMedia('(max-width:820px)').matches){location.replace('/photographer');return}");
 if(file==='dist/web/index.html'){
  const entry=/photobridge-r100f5-entry-routing\.js\?[^"'<>\s]+/g;
  if([...html.matchAll(entry)].length!==1)throw Error('R2087 photographer routing asset');
  html=html.replace(entry,u=>u.includes('accountPicker=r2087')?u:u+'&accountPicker=r2087');
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
console.log('[R2087] authenticated mobile account selection, single-role fast path, compressed web assets refreshed');

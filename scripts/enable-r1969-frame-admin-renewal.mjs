/* R1969: free frame/chassis subscriptions, without payment or activation side effects. */
import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function once(src,anchor,replacement,label){
 const count=src.split(anchor).length-1;
 if(count!==1)throw Error('[R1969] '+label+' anchor count '+count);
 return src.replace(anchor,()=>replacement);
}
let server=read('dist/api/server.js');
if(!server.includes('const pb1969FrameRenew=')){
 const anchor="    if (req.method === 'POST' && url.pathname === '/api/admin/equipment-rental/shops') {";
 server=once(server,anchor,read('scripts/r1969-frame-admin-renewal-route.txt')+anchor,'isolated frame renewal API');
 write('dist/api/server.js',server);
}
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});

let ui=read('dist/web/photobridge-v904r19-admin-stores.js');
if(!ui.includes('data-pb1969-frame-renew')){
 const btn='\${["frame","chassis","frame_chassis"].includes(String(s.business_category||""))?'
  +JSON.stringify('<button type="button" class="primary" data-pb1969-frame-renew>تمدید دستی رایگان</button>')+':""}';
 ui=once(ui,'<button data-store-domain>',btn+'<button data-store-domain>','frame-only admin button');
 ui=once(ui,"if(e.target.closest('[data-edit]'))return edit(shop);",
  "if(e.target.closest('[data-pb1969-frame-renew]'))return pb1969RenewFrameShop(shop,e.target.closest('[data-pb1969-frame-renew]'));if(e.target.closest('[data-edit]'))return edit(shop);",
  'frame admin button handler');
 ui=once(ui,'async function managerAccess(s){',read('scripts/r1969-frame-admin-renewal-ui.txt')+'\nasync function managerAccess(s){','frame admin action');
 write('dist/web/photobridge-v904r19-admin-stores.js',ui);
}
// R2076: the renewal action is visible next to expiry and in the Edit dialog.
if(!ui.includes('data-pb2076-frame-renew-edit')){
 const editStart=ui.indexOf('function edit(s){'),editEnd=ui.indexOf('async function pb1969RenewFrameShop(',editStart);
 if(editStart<0||editEnd<=editStart)throw Error('[R2076] shop edit dialog missing');
 let edit=ui.slice(editStart,editEnd);
 edit=once(edit,"<form id=\"pb904r19StoreForm\"","${[\"frame\",\"chassis\",\"frame_chassis\"].includes(String(s.business_category||\"\"))?`<div class=\"pb904r19StoreActions\" style=\"display:flex;align-items:center;gap:8px;margin:0 0 12px\"><span data-pb2076-expiry>اعتبار فعالیت: ${s.active_until===null?\"نامحدود\":s.active_until?esc(dt(s.active_until)):\"نامشخص\"}</span><button type=\"button\" class=\"primary\" data-pb2076-frame-renew-edit>تمدید دستی رایگان</button></div>`:\"\"}<form id=\"pb904r19StoreForm\"",'R2076 edit renewal button');
 edit=once(edit,"m.classList.add('open');m.querySelector('#pb904r19StoreSave').onclick","m.classList.add('open');const renewal=m.querySelector('[data-pb2076-frame-renew-edit]');if(renewal)renewal.onclick=async()=>{const current=S.shops.find(x=>String(x.id)===String(s.id))||s;await pb1969RenewFrameShop(current,renewal);const latest=S.shops.find(x=>String(x.id)===String(s.id));const expiry=m.querySelector('[data-pb2076-expiry]');if(expiry&&latest?.active_until)expiry.textContent='اعتبار فعالیت: '+dt(latest.active_until)};m.querySelector('#pb904r19StoreSave').onclick",'R2076 edit renewal handler');
 ui=ui.slice(0,editStart)+edit+ui.slice(editEnd);
 ui=once(ui,"${[\"frame\",\"chassis\",\"frame_chassis\"].includes(String(s.business_category||\"\"))?\"<button type=\\\"button\\\" class=\\\"primary\\\" data-pb1969-frame-renew>تمدید دستی رایگان</button>\":\"\"}<button data-store-domain>",'<button data-store-domain>','R2076 relocate original row action');
 ui=once(ui,"</small></td><td><b>${fa(s.item_count||0)} کالا","</small><div class=\"pb904r19StoreActions\" style=\"margin-top:5px\">${[\"frame\",\"chassis\",\"frame_chassis\"].includes(String(s.business_category||\"\"))?\"<button type=\\\"button\\\" class=\\\"primary\\\" data-pb1969-frame-renew>تمدید دستی رایگان</button>\":\"\"}</div></td><td><b>${fa(s.item_count||0)} کالا",'R2076 renewal beside expiry');
 write('dist/web/photobridge-v904r19-admin-stores.js',ui);
}
execFileSync(process.execPath,['--check','dist/web/photobridge-v904r19-admin-stores.js'],{stdio:'inherit'});

let html=read('dist/web/index.html');
const asset=/photobridge-v904r19-admin-stores\.js\?v=[a-zA-Z0-9_-]+/g;
const matches=[...html.matchAll(asset)];
if(matches.length!==1)throw Error('[R1969] admin-store script src count '+matches.length);
html=html.replace(asset,'photobridge-v904r19-admin-stores.js?v=r2067');
html=html.replace(/(photobridge-v904r19-admin-stores\.js\?v=r2067)(?:&frameRenew=r\d+)?/g,'$1&frameRenew=r2076');
write('dist/web/index.html',html);
if(!server.includes('frame_store_only')||!ui.includes('pb1969RenewFrameShop')||!html.includes('admin-stores.js?v=r2067')){
 throw Error('[R1969] frame renewal release incomplete');
}
// R2067: PB_PERF_FIX runs BEFORE this late writer. The HTTP server prefers
// existing Brotli/gzip siblings, even when the query string changes.
// Refresh the real admin JS and reject any stale encoded representation.
const adminAsset='dist/web/photobridge-v904r19-admin-stores.js';
const bytes=fs.readFileSync(adminAsset);
for(const [suffix,encode,decode] of [
 ['.br',b=>zlib.brotliCompressSync(b,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}),zlib.brotliDecompressSync],
 ['.gz',b=>zlib.gzipSync(b,{level:6}),zlib.gunzipSync]
]){
 const file=adminAsset+suffix;
 fs.writeFileSync(file,encode(bytes));
 if(!decode(fs.readFileSync(file)).equals(bytes))throw Error('[R2067] stale compressed admin store asset '+file);
}
console.log('[R2067] verified frame/chassis manual renewal and matching br/gzip payloads; camera and lab untouched.');

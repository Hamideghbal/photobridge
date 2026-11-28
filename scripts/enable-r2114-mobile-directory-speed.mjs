import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function once(s,a,b){if(s.split(a).length!==2)throw Error('R2114 anchor '+a.slice(0,100));return s.replace(a,()=>b)}
function section(s,a,b,fn){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('R2114 section '+a);return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)}
export function patchServer(s){
 if(s.includes('PB2114 mobile directory'))return s;
 s=section(s,"if (req.method === 'GET' && url.pathname === '/api/customer/equipment-rental/shops')","const customerRentalShopSelect",p=>{
  const i=p.indexOf('const q = await pool.query(`SELECT '),j=p.indexOf('`, [a.userId]);',i);
  if(i<0||j<i)throw Error('R2114 shop query');
  const full=p.slice(i+'const q = await pool.query(`'.length,j);
  const start=full.indexOf('          count(i.id) FILTER'),end=full.indexOf('          EXISTS(SELECT 1 FROM equipment_rental_shop_memberships',start);
  if(start<0||end<=start)throw Error('R2114 inventory projection');
  let lean=full.slice(0,start)+full.slice(end);
  const cols=[];
  lean=lean.replace(/\(SELECT m\.(\w+) FROM equipment_rental_shop_memberships m WHERE m\.shop_id=s\.id AND m\.user_id=\$1 AND m\.role='photographer' LIMIT 1\) (\w+)/g,(_,c,alias)=>{if(c!==alias)throw Error('R2114 membership alias');cols.push(c);return 'pb_member.'+c+' '+alias});
  if(cols.length!==9)throw Error('R2114 membership fields '+cols.length);
  lean=once(lean,'FROM equipment_rental_shops s LEFT JOIN equipment_rental_items i ON i.shop_id=s.id AND i.deleted_at IS NULL',"FROM equipment_rental_shops s LEFT JOIN LATERAL (SELECT "+cols.map(c=>'m.'+c).join(',')+" FROM equipment_rental_shop_memberships m WHERE m.shop_id=s.id AND m.user_id=$1 AND m.role='photographer' LIMIT 1) pb_member ON true");
  lean=once(lean,'GROUP BY s.id ORDER BY connected DESC,active_items DESC,s.created_at DESC','ORDER BY connected DESC,s.created_at DESC,s.id');
  const a=p.indexOf('const scoped = (await photographerInitialInviteType(a.userId))'),b=p.indexOf('const previewAllowed=',j);
  if(a<0||b<=j)throw Error('R2114 origin query');
  const prefix=[
   '/* PB2114 mobile directory */',
   "const mobileDirectory = url.searchParams.get('pbDirectory') === '1';",
   'const originPromise=photographerInitialOriginContext(a.userId);',
   'const [originContext,viewerResult,q,scopedShopIds]=await Promise.all([',
   '  originPromise,',
   "  pool.query('SELECT province,city FROM photographer_profiles WHERE user_id=$1 LIMIT 1',[a.userId]),",
   '  pool.query(mobileDirectory?`'+lean+'`:`'+full+'`,[a.userId]),',
   "  originPromise.then(origin=>origin.originType==='rental'?equipmentRentalInvitedShopIds(pool,a.userId):[])",
   ']);',
   "const scoped=originContext.originType==='rental',invitedShopSet=new Set(scopedShopIds.map(String)),viewer=viewerResult.rows[0]||{};",
   '        '
  ].join('\n        ');
  p=p.slice(0,a)+prefix+p.slice(b);
  p=once(p,"const originContext=await photographerInitialOriginContext(a.userId),primaryShopId=","const primaryShopId=");
  return p;
 });
 s=section(s,"if (req.method === 'GET' && url.pathname === '/api/customer/labs')","const customerLabRequest",p=>{
  const i=p.indexOf('const memberships = canDiscoverLabs'),j=p.indexOf('let labs = [];',i),k=p.indexOf('const originContext=await photographerInitialOriginContext(a.userId);',j);
  if(i<0||j<=i||k<=j)throw Error('R2114 lab query boundaries');
  let m=p.slice(i,j).trim().replace('const memberships = ','').replaceAll('await pool.query','pool.query').replace(/;$/,'');
  let list=p.slice(j,k).trim();
  p=p.slice(0,i)+'/* PB2114 concurrent lab directory reads */\n            const [memberships,labs,originContext]=await Promise.all([\n                '+m+',\n                (async()=>{'+list+'\n                    return labs;\n                })(),\n                photographerInitialOriginContext(a.userId)\n            ]);\n            '+p.slice(k+'const originContext=await photographerInitialOriginContext(a.userId);'.length);
  return p;
 });
 return s;
}
function installEarlyDirectory(frame,kind,q){
 if(window!==window.top||!matchMedia('(max-width:820px)').matches||document.documentElement.classList.contains('pb2087AccountPending'))return;
 const own=new URLSearchParams(location.search);
 const excluded=['pbAdminShop','pbStorePreview','pbDesktopContent','pbDesktopPanel','impersonation','token','invite','reset','code','pbOfficeLogin','walletPayment'];
 if(excluded.some(k=>own.has(k)||q.has(k)))return;
 try{if(sessionStorage.getItem('lablink_test_session')||sessionStorage.getItem('photobridge_admin_impersonation'))return}catch{return}
 const path=kind==='store'?'/api/customer/equipment-rental/shops?pbDirectory=1':'/api/customer/labs';
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 const promise=fetch(path,{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'},signal:controller.signal}).catch(()=>null).finally(()=>clearTimeout(timer));
 // One frame, one request. No browser-wide identity or list cache.
 frame.__pb2114Directory={kind,promise};
}
function notifyReady(kind){
 try{if(window!==window.top&&window.frameElement&&new URLSearchParams(location.search).get('pbEmbeddedStore')==='1')window.parent.dispatchEvent(new window.parent.CustomEvent('photobridge-directory-ready',{detail:{kind,frame:window.frameElement}}))}catch{}
}
export function patchPanel(s){
 if(s.includes('PB2114 frame directory'))return s;
 const anchor="function open(kind,push=true,choose=false){";
 s=once(s,anchor,'/* PB2114 frame directory */\n'+installEarlyDirectory.toString()+`
window.addEventListener('photobridge-directory-ready',event=>{
 const kind=event.detail?.kind,frame=event.detail?.frame,panel=panels.get(kind);
 if(!panel||panel.hidden||selected!==kind||panel.querySelector('iframe')!==frame)return;
 try{if(!validFrame(kind,new URL(frame.contentWindow.location.href)))return}catch{return}
 const loading=panel.querySelector('.pb1106ContentLoading');if(loading)loading.hidden=true;
});
`+anchor);
 const at='frame.src=frame.dataset.pb2099Entry;';
 // Restrict prefetch to initial iframe assignment, not retry or subsequent tabs.
 s=once(s,"q.set('pbEmbeddedStore','1');frame.dataset.pb2099Entry=(kind==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;"+at,"q.set('pbEmbeddedStore','1');frame.dataset.pb2099Entry=(kind==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;installEarlyDirectory(frame,kind,q);"+at);
 return s;
}
export function patchBook(s){
 if(s.includes('PB2114 chooser first paint'))return s;
 const tag=/(<script id="pb1837ChooserPrefetch">)([\s\S]*?)(<\/script>)/g;
 if([...s.matchAll(tag)].length!==1)throw Error('R2114 Store prefetch script');
 s=s.replace(tag,(_,a,b,c)=>a+`
/* PB2114 reuse parent frame request, otherwise fetch early as before */
(()=>{
 const q=new URLSearchParams(location.search);
 if(location.pathname!=='/equipment-rental/book'||window===window.top&&!q.has('pbDesktopContent')&&!q.has('pbEmbeddedStore')&&q.get('pbOfficeLogin')!=='1')return;
 const mobile=matchMedia('(max-width:820px)').matches&&q.get('pbEmbeddedStore')==='1';
 const path='/api/customer/equipment-rental/shops'+(mobile?'?pbDirectory=1':'');
 try{const f=window.frameElement,early=f?.__pb2114Directory;if(mobile&&early?.kind==='store'){delete f.__pb2114Directory;window.__PB1837ShopsRequest=early.promise;return}}catch{}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 window.__PB1837ShopsRequest=fetch(path,{credentials:'same-origin',headers:{'x-photobridge-portal':'photographer'},signal:controller.signal}).catch(()=>null).finally(()=>clearTimeout(timer));
})();
`+c);
 s=once(s,"url==='/api/customer/equipment-rental/shops'?window.__PB1837ShopsRequest:null","(url==='/api/customer/equipment-rental/shops'||url==='/api/customer/equipment-rental/shops?pbDirectory=1')?window.__PB1837ShopsRequest:null");
 s=section(s,'async function boot(){','function rentalDaysV809',p=>{
  p=once(p,"void loadPhotographerIdentity().catch(()=>null);\n    const d=await api('/api/customer/equipment-rental/shops');",`/* PB2114 chooser first paint */
    const mobileDirectory=matchMedia('(max-width:820px)').matches&&params.get('pbEmbeddedStore')==='1';
    if(!mobileDirectory)void loadPhotographerIdentity().catch(()=>null);
    const d=await api('/api/customer/equipment-rental/shops'+(mobileDirectory?'?pbDirectory=1':''));`);
  p=once(p,'    renderShops();renderStoreChooserR96();',`    renderShops();renderStoreChooserR96();
    if(mobileDirectory){
      if(!directShop)(${notifyReady.toString()})('store');
      // Header identity, wallet and notifications must not block the chooser.
      requestAnimationFrame(()=>setTimeout(()=>void loadPhotographerIdentity().catch(()=>null),0));
    }`);
  return p;
 });
 return s;
}
export function patchIndex(s){
 if(s.includes('PB2114 labs frame prefetch'))return s;
 const tag=/(<script id="pb1845LabsPrefetch">)([\s\S]*?)(<\/script>)/g;
 if([...s.matchAll(tag)].length!==1)throw Error('R2114 labs prefetch script');
 return s.replace(tag,(_,a,b,c)=>{
  const anchor=' const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);';
  return a+once(b,anchor,` /* PB2114 labs frame prefetch */
 try{const frame=window.frameElement,early=frame?.__pb2114Directory;if(q.get('pbEmbeddedStore')==='1'&&early?.kind==='print'){delete frame.__pb2114Directory;window.__PBLabsEarly=early.promise.then(response=>response?.ok?response.json():null).catch(()=>null);return}}catch{}
`+anchor)+c;
 });
}
export function patchLabs(s){
 if(s.includes('PB2114 lab directory ready'))return s;
 return section(s,'async function run(force=false,refresh=false){','function onRoute(){',p=>once(p,'      paint(data);\n    }catch(e){','      paint(data);\n      /* PB2114 lab directory ready */ ('+notifyReady.toString()+")('print');\n    }catch(e){"));
}

function write(p,s){const b=Buffer.from(s);fs.writeFileSync(p,b);for(const [ext,enc,dec] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,enc(b));if(!dec(fs.readFileSync(p+ext)).equals(b))throw Error('R2114 stale '+p+ext)}}
export function run(){
 const server='dist/api/server.js',panel='dist/web/photobridge-r1106-mobile-store-panel.js',labs='dist/web/photobridge-v904r99-lab-chooser.js',book='dist/api/equipment-rental-book.html',index='dist/web/index.html';
 for(const [path,patch] of [[server,patchServer],[panel,patchPanel],[labs,patchLabs],[book,patchBook],[index,patchIndex]]){
  let s=patch(fs.readFileSync(path,'utf8'));
  if(path===index||path===book)s=s.replace(/(photobridge-(?:r1106-mobile-store-panel|v904r99-lab-chooser)\.js\?[^"'<> \r\n]+)/g,u=>u.includes('directory=r2114')?u:u+'&directory=r2114');
  if(path===panel||path===labs)new Function(s);
  if(path===book||path===index)for(const m of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){if(m[1].includes('PB2114')&&!m[1].includes('import '))new Function(m[1])}
  write(path,s);
 }
 execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
 console.log('[R2114] lightweight mobile Store directory, concurrent lab reads, early frame requests and chooser-first render');
}
if(process.argv[1]?.endsWith('enable-r2114-mobile-directory-speed.mjs'))run();

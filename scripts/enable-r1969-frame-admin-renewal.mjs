/* R1969: free frame/chassis subscriptions, without payment or activation side effects. */
import fs from 'node:fs';
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
  +JSON.stringify('<button class="primary" data-pb1969-frame-renew>تمدید رایگان</button>')+':""}';
 ui=once(ui,'<button data-store-domain>',btn+'<button data-store-domain>','frame-only admin button');
 ui=once(ui,"if(e.target.closest('[data-edit]'))return edit(shop);",
  "if(e.target.closest('[data-pb1969-frame-renew]'))return pb1969RenewFrameShop(shop,e.target.closest('[data-pb1969-frame-renew]'));if(e.target.closest('[data-edit]'))return edit(shop);",
  'frame admin button handler');
 ui=once(ui,'async function managerAccess(s){',read('scripts/r1969-frame-admin-renewal-ui.txt')+'\nasync function managerAccess(s){','frame admin action');
 write('dist/web/photobridge-v904r19-admin-stores.js',ui);
}
execFileSync(process.execPath,['--check','dist/web/photobridge-v904r19-admin-stores.js'],{stdio:'inherit'});

let html=read('dist/web/index.html');
const asset=/photobridge-v904r19-admin-stores\.js\?v=[a-zA-Z0-9_-]+/g;
const matches=[...html.matchAll(asset)];
if(matches.length!==1)throw Error('[R1969] admin-store script src count '+matches.length);
html=html.replace(asset,'photobridge-v904r19-admin-stores.js?v=r1969');
write('dist/web/index.html',html);
if(!server.includes('frame_store_only')||!ui.includes('pb1969RenewFrameShop')||!html.includes('admin-stores.js?v=r1969')){
 throw Error('[R1969] frame renewal release incomplete');
}
console.log('[R1969] platform admin complimentary frame/chassis renewal installed; camera and lab untouched.');

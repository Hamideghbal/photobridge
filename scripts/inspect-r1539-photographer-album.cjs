const fs=require('fs'),api=fs.readFileSync('dist/api/server.js','utf8'),ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
function seg(source,name,from,to,limit=22000){
 let a=typeof from==='number'?from:source.indexOf(from);
 let b=typeof to==='number'?to:source.indexOf(to,a+1);
 console.log('\n=== '+name+' @'+a+' to '+b+' ===\n'+(a>=0?source.slice(a,Math.min(b>=a?b:a+limit,a+limit)):'NOT FOUND'));
}
seg(api,'ALBUM ORDER SNAPSHOT','async function albumOrderSnapshot(', '\nasync function ',36000);
seg(api,'ALBUM CATALOG','async function albumCatalogForLab(', '\nasync function ',15500);
seg(api,'ALBUM INVOICE ITEMS','function albumInvoiceLineItems(', '\nfunction ',16000);
const fv=ui.indexOf('function Kv('); seg(ui,'PHOTOGRAPHER ALBUM Kv',fv,ui.indexOf('function ',fv+12),26000);
for(const q of ['سایز آلبوم','نوع کاغذ','نوع صحافی','مشخصات آلبوم','albumConfigBlock','albumBinding','bindingPrice']){
 let positions=[],at=-1;while((at=ui.indexOf(q,at+1))>=0&&positions.length<40)positions.push(at);
 console.log('\nFIND '+q+' TOTAL '+positions.length);
 for(const at of positions.slice(-8))console.log(at+' '+ui.slice(Math.max(0,at-300),at+450));
}
const routes=['/api/lab/album-settings','/api/customer/labs/','/api/customer/album','/api/lab/prices'];
for(const q of routes){let at=-1,arr=[];while((at=api.indexOf(q,at+1))>=0&&arr.length<20)arr.push(at);console.log('APIROUTE '+q,arr.map(at=>api.slice(at-140,at+230)));}

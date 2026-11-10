const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('only same-origin Print workspace routes can be retained',()=>{
 const js=fs.readFileSync('scripts/r1461-print-navigation.js','utf8'),start=js.indexOf('const validRoute='),end=js.indexOf('\n function sync',start),code=js.slice(start,end)+'\nvalidRoute(input);';
 const route=input=>vm.runInNewContext(code,{URL,location:{origin:'https://panel.test'},input});
 for(const path of ['/photographer/orders/needs_fix','/photographer/upload','/photographer/album?step=2','/photographer/finance']){const u=new URL(route(path),'https://panel.test');assert.equal(u.pathname,new URL(path,'https://panel.test').pathname);assert.equal(u.searchParams.get('pbDesktopContent'),'1');assert.equal(u.searchParams.get('workspace'),'print')}
 for(const bad of ['https://outside.test/photographer/upload','//outside.test/photographer/upload','javascript:alert(1)','/admin/settings','/photographer/orders/flow?pbLabChooser=1'])assert.equal(route(bad),null,bad);
});
test('navigation transform is idempotent',()=>{
 const files=['dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/photobridge-r1461-print-navigation.js','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));assert(before[3].includes('printNavigation=r1461'));
 execFileSync(process.execPath,['scripts/enable-r1461-print-navigation.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});

test('R1762 CRM desktop frame survives the R1461 print-route transform',()=>{
 const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 const crm=nav.indexOf("if(key==='crm')frame.src='/customer-crm.html?portal=photographer&pbDesktopContent=1';else{");
 const print=nav.indexOf('/* PB1461 refresh route */',crm);
 const frame=nav.indexOf("frame.src=restoredPrint||(key==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;",print);
 assert(crm>=0,'CRM has its isolated iframe URL and is not redirected to print');
 assert(print>crm,'print-route restoration remains inside the non-CRM branch');
 assert(frame>print,'print/store frame uses restoredPrint while CRM keeps its own source');
 assert(nav.includes("if(key==='print'||key==='crm'){open(key);return;}"),'CRM is an actual desktop tab');
 assert(nav.includes("['store','print','crm'].includes(panel)"),'CRM supports history navigation and refresh');
});

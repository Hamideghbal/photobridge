const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const file='assets/index-UIRefine-v655-r84.js',root=path.resolve(process.env.PB1854_NATIVE?'dist/web/lab-desktop-ui':'dist/web');let source=fs.readFileSync(path.join(root,file),'utf8');
 const entry='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(source.includes(entry));const a=source.indexOf('function ej('),b=source.indexOf('function vh(',a);let component=source.slice(a,b);assert(component.includes('return s?Le?'));component=component.replace('return s?Le?','window.__print={choose:_e,add:_,send:he,rows:T,ready:PB1854ready,snapshot:PB1854snapshot};return s?Le?');source=source.slice(0,a)+component+source.slice(b);source=source.replace(entry,`function PB1854Fixture(){const[lab,setLab]=x.useState('11111111-1111-4111-8111-111111111111');window.__changeLab=setLab;return e.jsx('main',{className:'photographerMain photographerPrintWorkspace',children:e.jsx(ej,{d:{lab:{id:lab,name:'لابراتوار آزمایشی'},prices:[{id:'22222222-2222-4222-8222-222222222222',label:'۱۰×۱۵',width_cm:10,height_cm:15,luster:1000}],papers:[],status:{open:true}},onDone:()=>{},visible:true})})}Tx.createRoot(document.getElementById('root')).render(e.jsx(PB1854Fixture,{}));`);
 const links=(fs.readFileSync(root+'/index.html','utf8').match(/<link\b[^>]*rel="stylesheet"[^>]*>/g)||[]).join('').replaceAll('href="./','href="/');const html='<!doctype html><html dir="rtl" class="pb1126Desktop"><head><meta charset="utf-8">'+links+'</head><body><div id="root"></div><script type="module" src="/'+file+'"></script></body></html>';
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of (process.env.PB1854_NATIVE?[1440]:[1440,390])){
  const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),orders=new Map(),files=new Map(),puts=new Map(),writes=[],errors=[];let failName='photo-2.png',submits=0,signedUser='33333333-3333-4333-8333-333333333333';
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),body=request.postData()&&request.method()!=='PUT'?JSON.parse(request.postData()):{};
   if(url.pathname.startsWith('/objects/')){const row=files.get(url.pathname.split('/')[2]);puts.set(row.name,(puts.get(row.name)||0)+1);if(failName===row.name)return route.fulfill({status:503,body:'temporary'});row.bytes=Buffer.from(request.postDataBuffer());return route.fulfill({status:200,body:''})}
   if(url.pathname.startsWith('/api/')){
    if(request.method()!=='GET')writes.push({method:request.method(),path:url.pathname});
    if(url.pathname==='/api/auth/me')return route.fulfill({json:{user:{userId:signedUser,labRole:'customer'}}});
    if(url.pathname==='/api/customer/orders'){if(!orders.has(body.recoveryId))orders.set(body.recoveryId,{id:body.recoveryId,status:'uploading'});return route.fulfill({json:{order:orders.get(body.recoveryId)}})}
    if(/\/orders\/.+\/submit$/.test(url.pathname)){assert([...files.values()].every(f=>f.state==='active'));const order=orders.get(url.pathname.split('/')[4]);if(order.status==='uploading'){order.status='sent';submits++}return route.fulfill({json:{order}})}
    if(url.pathname.startsWith('/api/customer/orders/')){const order=orders.get(url.pathname.split('/')[4]);return route.fulfill({status:order?200:404,json:order?{order,files:[...files.values()].map(f=>({id:f.id,original_state:f.state}))}:{error:'not_found'}})}
    if(url.pathname==='/api/customer/uploads/presign'){if(!files.has(body.clientFileId))files.set(body.clientFileId,{id:body.clientFileId,name:body.name,state:'pending',expected:body.bytes});return route.fulfill({json:{fileId:body.clientFileId}})}
    if(/\/uploads\/.+\/retry$/.test(url.pathname)){const row=files.get(url.pathname.split('/')[4]);return route.fulfill({json:{fileId:row.id,uploaded:row.bytes?.length===row.expected,uploadUrl:'/objects/'+row.id}})}
    if(url.pathname==='/api/customer/uploads/complete'){const row=files.get(body.fileId);assert.equal(row.bytes.length,row.expected);row.state='active';return route.fulfill({json:{ok:true}})}
    return route.fulfill({json:{ok:true,items:[],models:[],types:[]}});
   }
   if(url.pathname==='/'+file)return route.fulfill({body:source,contentType:'text/javascript'});
   const local=path.join(root,url.pathname);if(path.extname(url.pathname)&&fs.existsSync(local))return route.fulfill({path:local});return route.fulfill({body:html,contentType:'text/html'});
  });
  let page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('https://panel.test/photographer/upload');await page.waitForFunction(()=>window.__print?.ready).catch(async error=>{console.error('STARTUP',errors,await page.locator('body').innerText());throw error});
  await page.evaluate(async()=>{
   const library=window.PB1854PrintRecovery,scope='concurrent-fixture-'+crypto.randomUUID(),a=library.browserStore(scope),b=library.browserStore(scope),first={id:crypto.randomUUID(),version:1,updatedAt:1,state:'queued',groups:[{files:[{id:'photo'}]}]};
   await a.save(first);const results=await Promise.allSettled([a.save({...first,version:2,updatedAt:2}),b.save({...first,version:2,updatedAt:3})]);if(results.filter(r=>r.status==='fulfilled').length!==1)throw Error('Cross-tab checkpoint conflict was not rejected');
   const descriptor=Object.getOwnPropertyDescriptor(window,'indexedDB');Object.defineProperty(window,'indexedDB',{configurable:true,value:undefined});try{const fallback=library.browserStore('metadata-fallback-'+crypto.randomUUID());await fallback.save({...first,version:1});if(!(await fallback.load()))throw Error('Metadata fallback lost queue');await fallback.putFile('photo',new Blob(['test'])).then(()=>{throw Error('Unavailable bytes store accepted data')},()=>{})}finally{if(descriptor)Object.defineProperty(window,'indexedDB',descriptor);else delete window.indexedDB}
  });

  await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=100;canvas.height=150;const blob=await new Promise(done=>canvas.toBlob(done,'image/png'));window.__original=await blob.arrayBuffer();const files=Array.from({length:5},(_,i)=>new File([blob],'photo-'+i+'.png',{type:'image/png',lastModified:1}));const group=__print.choose('22222222-2222-4222-8222-222222222222');await __print.add(group,files)});
  const original=Buffer.from(await page.evaluate(()=>Array.from(new Uint8Array(__original))));
  await page.waitForFunction(()=>__print.snapshot?.groups?.[0]?.files?.length===5&&__print.snapshot.groups[0].files.every(file=>file.checksum));
  await page.evaluate(()=>__changeLab('77777777-7777-4777-8777-777777777777'));await page.waitForFunction(()=>__print.ready&&__print.rows.length===0);
  await page.evaluate(()=>__changeLab('11111111-1111-4111-8111-111111111111'));await page.waitForFunction(()=>__print.ready&&__print.rows[0]?.files?.length===5);
  signedUser='88888888-8888-4888-8888-888888888888';await page.evaluate(()=>dispatchEvent(new Event('photobridge-auth-session-changed')));await page.waitForFunction(()=>__print.ready&&__print.rows.length===0);
  signedUser='33333333-3333-4333-8333-333333333333';await page.evaluate(()=>dispatchEvent(new Event('photobridge-auth-session-changed')));await page.waitForFunction(()=>__print.ready&&__print.rows[0]?.files?.length===5);


  await page.evaluate(()=>{window.__send=__print.send()});await page.waitForFunction(()=>__print.snapshot?.state==='needs_attention',null,{timeout:30000});await page.evaluate(()=>__send);
  assert.equal(orders.size,1);assert.equal(submits,0);assert.equal(files.size,5);assert.equal(await page.locator('.pb1854File').count(),5);assert.equal(await page.evaluate(()=>__print.snapshot.groups.flatMap(g=>g.files).filter(f=>f.state==='done').length),4);
  const failed=await page.evaluate(()=>__print.snapshot.groups.flatMap(g=>g.files).find(f=>f.name==='photo-2.png').id);
  await page.evaluate(async id=>{const database=await new Promise((resolve,reject)=>{const q=indexedDB.open('photobridge-print-recovery-v1',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});await new Promise((resolve,reject)=>{const tx=database.transaction('bytes','readwrite'),q=tx.objectStore('bytes').getAllKeys();q.onsuccess=()=>q.result.filter(key=>String(key).endsWith(':'+id)).forEach(key=>tx.objectStore('bytes').delete(key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});database.close()},failed);
  await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('https://panel.test/photographer/upload');await page.waitForFunction(()=>__print?.ready&&__print.rows.length===1);assert.equal(await page.locator('.pb1854File').count(),5);assert.equal(await page.locator('.pb1854Reselect input').count(),1);
  assert.equal(await page.locator('.simplePrintSizeCard').evaluate(el=>el.inert),true);
  await page.locator('.pb1854Reselect input').setInputFiles({name:'photo-2.png',mimeType:'image/png',buffer:Buffer.alloc(original.length,1)});await page.waitForFunction(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').error?.code==='identity_mismatch');
  await page.locator('.pb1854Reselect input').setInputFiles({name:'photo-2.png',mimeType:'image/png',buffer:original});await page.waitForFunction(()=>!__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').missing);failName=null;
  await page.getByRole('button',{name:'تلاش مجدد و ادامهٔ ارسال',exact:true}).click();await page.getByText('سفارش برای لابراتوار ارسال شد',{exact:true}).waitFor();
  assert.equal(orders.size,1);assert.equal(submits,1);assert.equal(files.size,5);assert.equal(puts.get('photo-2.png'),4);for(const [name,n]of puts)if(name!=='photo-2.png')assert.equal(n,1);assert(!writes.some(w=>w.method==='DELETE'));assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/photobridge-r1854-recovery-'+width+'.png'});await context.close();console.log('PASS real print '+width+': 4 verified originals preserved across closure; evicted fifth reselected by SHA-256; only remaining file retried; one final order');
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

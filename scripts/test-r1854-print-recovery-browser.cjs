const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const file='assets/index-UIRefine-v655-r84.js',root=path.resolve(process.env.PB1854_NATIVE?'dist/web/lab-desktop-ui':'dist/web');let source=fs.readFileSync(path.join(root,file),'utf8');
 const entry='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(source.includes(entry));const a=source.indexOf('function ej('),b=source.indexOf('function vh(',a);let component=source.slice(a,b);assert(component.includes('return s?Le?'));component=component.replace('return s?Le?','window.__print={choose:_e,add:_,send:he,rows:T,ready:PB1854ready,snapshot:PB1854snapshot,openQuote:()=>ft(true)};return s?Le?');source=source.slice(0,a)+component+source.slice(b);source=source.replace(entry,`function PB1854Fixture(){const[lab,setLab]=x.useState('11111111-1111-4111-8111-111111111111'),[visible,setVisible]=x.useState(!location.search.includes('history=1'));window.__changeLab=setLab;window.__setVisible=setVisible;return e.jsx('main',{className:'photographerMain photographerPrintWorkspace',children:[!visible&&e.jsx(Zg,{labId:lab,filter:'flow',onFilterChange:()=>{},onNewOrder:()=>setVisible(true)}),e.jsx(ej,{d:{lab:{id:lab,name:'لابراتوار آزمایشی'},prices:[{id:'22222222-2222-4222-8222-222222222222',label:'۱۰×۱۵',width_cm:10,height_cm:15,luster:1000}],papers:[],status:{open:true}},onDone:()=>{},onOpen:()=>setVisible(true),visible})]})}Tx.createRoot(document.getElementById('root')).render(e.jsx(PB1854Fixture,{}));`);
 const links=(fs.readFileSync(root+'/index.html','utf8').match(/<link\b[^>]*rel="stylesheet"[^>]*>/g)||[]).join('').replaceAll('href="./','href="/');const html='<!doctype html><html dir="rtl" class="pb1126Desktop"><head><meta charset="utf-8">'+links+'</head><body><div id="simple-print-pilot-mobile-header-slot"></div><div id="root"></div><script type="module" src="/'+file+'"></script></body></html>';
 const controls=process.env.PB1855_CONTROLS==='1',refresh=process.env.PB1856_REFRESH==='1';
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of (process.env.PB1854_NATIVE?[1440]:[1440,390])){
  const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'}),orders=new Map(),files=new Map(),puts=new Map(),writes=[],errors=[];let historyFailure=true,failName='photo-2.png',submits=0,signedUser='33333333-3333-4333-8333-333333333333';
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),body=request.postData()&&request.method()!=='PUT'?JSON.parse(request.postData()):{};
   if(url.pathname.startsWith('/objects/')){const row=files.get(url.pathname.split('/')[2]);puts.set(row.name,(puts.get(row.name)||0)+1);if(controls&&row.name==='photo-4.png')return;if(failName===row.name)return route.fulfill({status:503,body:'temporary'});row.bytes=Buffer.from(request.postDataBuffer());return route.fulfill({status:200,body:''})}
   if(url.pathname.startsWith('/api/')){
    if(request.method()!=='GET')writes.push({method:request.method(),path:url.pathname});
    if(url.pathname==='/api/auth/me')return route.fulfill({json:{user:{userId:signedUser,labRole:'customer'}}});
    if(url.pathname==='/api/customer/recovery-orders'){if(!orders.has(body.recoveryId))orders.set(body.recoveryId,{id:body.recoveryId,status:'uploading'});return route.fulfill({json:{order:orders.get(body.recoveryId)}})}
    if(/\/orders\/.+\/submit$/.test(url.pathname)){assert([...files.values()].filter(f=>f.state!=='deleted').every(f=>f.state==='active'));if(controls)assert.equal(request.headers()['x-photobridge-upload-count'],'4');const order=orders.get(url.pathname.split('/')[4]);if(order.status==='uploading'){order.status='sent';submits++}return route.fulfill({json:{order}})}
    if(url.pathname==='/api/customer/orders'){if(historyFailure){historyFailure=false;return route.fulfill({status:503,json:{error:'temporary'}})}return route.fulfill({json:{labId:'11111111-1111-4111-8111-111111111111',orders:[{id:'99999999-9999-4999-8999-999999999999',lab_id:'11111111-1111-4111-8111-111111111111',mode:'print',status:'sent',number:1856001,created_at:'2020-01-01T00:00:00Z',file_count:2,total_bytes:1000}]}})}
    if(url.pathname.startsWith('/api/customer/orders/')){const order=orders.get(url.pathname.split('/')[4]);return route.fulfill({status:order?200:404,json:order?{order,files:[...files.values()].map(f=>({id:f.id,original_state:f.state}))}:{error:'not_found'}})}
    if(url.pathname==='/api/customer/uploads/recovery-presign'){if(!files.has(body.clientFileId))files.set(body.clientFileId,{id:body.clientFileId,name:body.name,state:'pending',expected:body.bytes});return route.fulfill({json:{fileId:body.clientFileId}})}
    if(/\/uploads\/.+\/retry$/.test(url.pathname)){const row=files.get(url.pathname.split('/')[4]);return route.fulfill({json:{fileId:row.id,uploaded:row.bytes?.length===row.expected,uploadUrl:'/objects/'+row.id}})}
    if(/\/uploads\/.+\/exclude$/.test(url.pathname)){const row=files.get(url.pathname.split('/')[4]);if(row?.state==='active')return route.fulfill({status:409,json:{error:'upload_already_verified'}});if(row)row.state='deleted';return route.fulfill({json:{excluded:true}})}
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


  await page.evaluate(()=>{window.__send=__print.send()});await page.waitForFunction(controls=>controls?(__print.snapshot?.groups?.[0]?.files?.some(file=>file.name==='photo-2.png'&&file.state==='needs_attention'&&file.attempts>=3)&&__print.snapshot.groups[0].files.some(file=>file.name==='photo-4.png'&&file.state==='uploading'&&file.registered)):__print.snapshot?.state==='needs_attention',controls,{timeout:30000});if(!controls)await page.evaluate(()=>__send);
  const primary=()=>page.locator(width===390?'#simple-print-pilot-mobile-header-slot .simplePrintPilotHeaderSubmitMobile':'.simplePrintPilotQuoteSubmit'),cancel=()=>page.locator(width===390?'#simple-print-pilot-mobile-header-slot .simplePrintPilotHeaderCancelMobile':'.simplePrintPilotCancel');
  assert.equal(orders.size,1);assert.equal(submits,0);assert.equal(files.size,5);assert.equal(await page.locator('[data-upload-state]').count(),5);assert.equal(await page.locator('.pb1854Queue,.pb1854File,.pb1856RecoveryNotice').count(),0);
  assert.equal(await page.getByRole('button',{name:'پیش‌نمایش',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'حذف از ارسال',exact:true}).count(),0);
  const failed=await page.evaluate(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').id),checkpoint=await page.evaluate(()=>({id:__print.snapshot.id,order:__print.snapshot.orderId,files:__print.snapshot.groups[0].files.map(f=>[f.id,f.serverId,f.state])}));
  await page.locator('[data-pb1855-file="'+failed+'"] .simplePrintThumb').click();await page.locator('.simplePrintPreviewModal img').waitFor();assert(await page.locator('.simplePrintPreviewModal img').evaluate(img=>img.complete&&img.naturalWidth>0));await page.locator('.simplePrintPreviewModal button').click();
  if(controls){
   await cancel().click();await page.waitForFunction(()=>!__print.snapshot.groups[0].files.some(f=>['uploading','verifying'].includes(f.state)));await page.evaluate(()=>__send);
   failName=null;await primary().getByText('تلاش مجدد',{exact:true}).click();await page.waitForFunction(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').state==='done'&&__print.snapshot.groups[0].files.find(f=>f.name==='photo-4.png').state==='uploading');
   await cancel().click();await page.waitForFunction(()=>!__print.snapshot.groups[0].files.some(f=>['uploading','verifying'].includes(f.state)));
   const excluded=await page.evaluate(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-4.png').id);await page.locator('[data-pb1855-file="'+excluded+'"] .simplePrintPhotoActions .dangerAction').click();await page.waitForFunction(()=>__print.snapshot.groups[0].files.length===4);assert.equal([...files.values()].find(f=>f.name==='photo-4.png').state,'deleted');
  }else assert.equal(await primary().innerText(),'تلاش مجدد');
  if(refresh){
   await page.reload();await page.waitForFunction(()=>__print?.ready&&__print.snapshot?.state==='needs_attention');assert.deepEqual(await page.evaluate(()=>({id:__print.snapshot.id,order:__print.snapshot.orderId,files:__print.snapshot.groups[0].files.map(f=>[f.id,f.serverId,f.state])})),checkpoint);
   await page.goto('https://panel.test/photographer/orders/flow?workspace=print&history=1');await page.waitForFunction(()=>__print?.ready);assert.equal(await page.locator('.pb1856RecoveryNotice').count(),0);await page.locator('.pb1856OrderError').waitFor();assert(!await page.getByText('هنوز سفارشی ثبت نشده است.',{exact:true}).count());await page.getByRole('button',{name:'دریافت دوبارهٔ سفارش‌ها',exact:true}).click();await page.locator('[data-order-id="99999999-9999-4999-8999-999999999999"]').waitFor();
   await page.goto('https://panel.test/photographer/upload');await page.waitForFunction(()=>__print?.ready&&__print.rows.length===1);assert.deepEqual(await page.evaluate(()=>({id:__print.snapshot.id,order:__print.snapshot.orderId,files:__print.snapshot.groups[0].files.map(f=>[f.id,f.serverId,f.state])})),checkpoint);
  }
  if(!controls){page.once('dialog',dialog=>dialog.dismiss());await cancel().click();assert.equal(await page.locator('[data-upload-state]').count(),5)}
  await page.screenshot({path:'/tmp/photobridge-r1858-compact-'+width+'.png'});
  await page.evaluate(async id=>{const database=await new Promise((resolve,reject)=>{const q=indexedDB.open('photobridge-print-recovery-v1',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});await new Promise((resolve,reject)=>{const tx=database.transaction('bytes','readwrite'),q=tx.objectStore('bytes').getAllKeys();q.onsuccess=()=>q.result.filter(key=>String(key).endsWith(':'+id)).forEach(key=>tx.objectStore('bytes').delete(key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});database.close()},failed);
  await page.close();page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('https://panel.test/photographer/upload');await page.waitForFunction(()=>__print?.ready&&__print.rows.length===1);assert.equal(await page.locator('[data-upload-state]').count(),controls?4:5);assert.equal(await page.locator('.pb1854Reselect').count(),1);
  assert.equal(await page.locator('.simplePrintSizeCard').evaluate(el=>el.inert),false);assert.equal(await page.locator('.simplePrintGroupDelete').first().isDisabled(),true);
   if(controls){
    // In the interactive-controls fixture, photo-2 has already been retried and verified
    // before this browser restart. Evicting its local Blob must NOT turn a verified
    // original into a reselectable failed upload or force another PUT.
    await page.waitForFunction(()=>__print.snapshot?.state==='submitted'&&__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png')?.state==='done');
    assert.equal(await page.evaluate(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').progress),100);
   }else{
    await page.locator('.pb1854Reselect').setInputFiles({name:'photo-2.png',mimeType:'image/png',buffer:Buffer.alloc(original.length,1)});
    await page.waitForFunction(()=>__print.snapshot.groups[0].files.find(f=>f.name==='photo-2.png').error?.code==='identity_mismatch');
    failName=null;
    await page.locator('.pb1854Reselect').setInputFiles({name:'photo-2.png',mimeType:'image/png',buffer:original});
   }
   await page.getByText('سفارش برای لابراتوار ارسال شد',{exact:true}).waitFor();
  assert.equal(orders.size,1);assert.equal(submits,1);assert.equal(files.size,5);assert.equal(puts.get('photo-2.png'),4);for(const [name,n]of puts)if(name!=='photo-2.png'&&(!controls||name!=='photo-4.png'))assert.equal(n,1);assert(!writes.some(w=>w.method==='DELETE'));
  await page.getByRole('button',{name:'مشاهده سفارش‌ها',exact:true}).click();await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=100;canvas.height=150;const blob=await new Promise(done=>canvas.toBlob(done,'image/png'));const group=__print.choose('22222222-2222-4222-8222-222222222222');await __print.add(group,[new File([blob],'cancel-me.png',{type:'image/png'})])});await page.waitForFunction(()=>__print.snapshot?.groups[0]?.files[0]?.checksum);page.once('dialog',dialog=>dialog.accept());await cancel().getByText('حذف ارسال',{exact:true}).click();await page.waitForFunction(()=>__print.rows.length===0);await page.reload();await page.waitForFunction(()=>__print?.ready);assert.equal(await page.locator('[data-upload-state]').count(),0);assert.equal(orders.size,1);assert.equal(submits,1);assert.equal(files.size,5);assert.deepEqual(errors,[]);
  await context.close();console.log('PASS compact '+width+': original card preview/remove; one primary retry; adjacent explicit discard survives refresh; no duplicate queue; verified originals reused; one final order');
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

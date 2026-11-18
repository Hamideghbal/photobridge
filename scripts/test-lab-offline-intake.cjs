const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');

const root='dist/web/lab-desktop-ui/';
const name='photobridge-r1137-lab-local-intake.js';
const native=fs.readFileSync(root+name,'utf8');
const outbox=fs.readFileSync('scripts/lab-offline-intake.js','utf8');

test('the native form saves the complete request before confirming and hashes the published bytes',()=>{
 assert.doesNotThrow(()=>new vm.Script(native));
 assert(!native.includes('این فرم هنوز برای ثبت نهایی'));
 assert.match(native,/await labOutboxSave\(bootstrap,clientOrderId/);
 assert.match(native,/await labOutboxSave[\s\S]+?سفارش روی این دستگاه ذخیره شد/);
 assert.match(native,/chassis:!!item.chassis/);
 assert(!fs.readFileSync('dist/web/'+name,'utf8').includes('labOutboxSave'));
 const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const path of [name,'index.html']){
  const hash=crypto.createHash('sha256').update(fs.readFileSync(root+path)).digest('hex');
  assert.equal(manifest.files.find(file=>file.name===path)?.sha256,hash);
 }
});

test('offline order and photo survive a reload and retry a lost submit response without a duplicate',{skip:!fs.existsSync('/usr/bin/chromium')},async t=>{
 let playwright;
 try{playwright=require('playwright');}catch{t.skip('Playwright is unavailable');return;}
 const browser=await playwright.chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();
  await page.route('https://lab.test/**',route=>route.fulfill({contentType:'text/html',body:'<main></main>'}));
  await page.addInitScript({content:`
   window.pbNativeStorage={};
   const storage=()=>fixture.provider;
   let committed=false, submissions=0, copies=0, deviceOnline=true;
   const calls=[];
   const api=async (url,body)=>{
    calls.push({url,body});
    if(url==='/api/auth/me')return {user:{userId:'user',labId:'lab'}};
    if(url.includes('/download/device?check=')){
     if(!deviceOnline)throw Object.assign(Error('offline'),{code:'online_connection_required',data:{}});
     return {userId:'user',labId:'lab',registered:true,isThisDevice:true};
    }
    if(url==='/api/lab/delegated-orders')return {orderId:'order',replay:committed,status:committed?'downloaded':'uploading'};
    if(url.endsWith('/presign'))return {fileId:'file',storageMode:'device-local'};
    if(url.endsWith('/submit')){committed=true;submissions++;throw Error('connection lost after commit');}
    return {order:{},files:[{id:'file',original_name:'photo.jpg'}]};
   };
   ${outbox}
   window.fixture={labOutbox,labOutboxSave,labOutboxReplay,labOutboxSync,labOutboxPrimary,setDeviceOnline(value){deviceOnline=value;},calls,stats:()=>({submissions,copies}),provider:{
    deviceId:()=> 'device',root:()=>navigator.storage.getDirectory(),permission:async()=>true,
    target:async directory=>({dir:directory}),fileName:name=>name,
    write:async (directory,name,file)=>{
     copies++;
     const handle=await directory.getFileHandle(name,{create:true});
     const writer=await handle.createWritable();
     await writer.write(file);await writer.close();
    },saveResume(){}
   }};
  `});
  await page.goto('https://lab.test/lab/orders');
  await page.evaluate(async()=>{
   await fixture.labOutboxPrimary();
   const photo=new File(['original bytes'],'photo.jpg',{type:'image/jpeg'});
   await fixture.labOutboxSave({lab:{id:'lab'},customers:[{id:'customer'}]},'client-order',
    {customerId:'customer',clientOrderId:'client-order',mode:'print'}, {sendInvoiceSms:false},
    [{id:'file',file:photo}], [{clientFileId:'file',printCopies:2,chassis:true}]);
  });
  await page.reload();
  const result=await page.evaluate(async()=>{
   const {labOutbox,labOutboxReplay,labOutboxSync,labOutboxPrimary,calls,stats,provider}=fixture;
   fixture.setDeviceOnline(false);
   const offlinePrimary=(await labOutboxPrimary()).isThisDevice;
   fixture.setDeviceOnline(true);
   const keys=await labOutbox.list('lab/user/device');
   const otherKeys=await labOutbox.list('lab/other/device');
   const pending=await labOutbox.read(keys[0]);
   const directory=await navigator.storage.getDirectory();
   let failed=false;
   try{await labOutboxReplay(provider,directory,pending);}catch{failed=true;}
   const preserved=(await labOutbox.list('lab/user/device')).length;
   let orderId;
   window.addEventListener('photobridge-lab-orders-changed',event=>{orderId=event.detail.orderId;},{once:true});
   await labOutboxSync();
   return {orderId,failed,preserved,offlinePrimary,otherKeys,...stats(),
    remaining:(await labOutbox.list('lab/user/device')).length,
    content:await (await (await directory.getFileHandle('photo.jpg')).getFile()).text(),
    orders:calls.filter(call=>call.url==='/api/lab/delegated-orders').map(call=>call.body.clientOrderId),
    photo:calls.find(call=>call.url.endsWith('/presign')).body};
  });
  assert.deepEqual(result,{orderId:'order',failed:true,preserved:1,offlinePrimary:true,otherKeys:[],submissions:1,copies:1,
   remaining:0,content:'original bytes',orders:['client-order','client-order'],photo:{clientFileId:'file',printCopies:2,chassis:true}});
 }finally{await browser.close();}
});

test('offline bootstrap reuses previously verified customer/tariff data without network waits',async()=>{
 const begin=outbox.indexOf("async function labOutboxBootstrap(");
 const end=outbox.indexOf("\nfunction labOutboxWarmBootstrap()",begin);
 assert(begin>=0&&end>begin);
 const helper=outbox.slice(begin,end);
 const cache=new Map(),requests=[];
 let online=false,labId='lab',userId='user',device='device';
 const sandbox={
  labOutboxContext:async()=>({labId,userId,key:[labId,userId,device].join('/')}),
  labOutbox:{read:async key=>cache.get(key),put:async row=>cache.set(row.id,row)},
  labOutboxOffline:()=>!online,
  labOutboxConnectionFailed:()=>true,
  api:async path=>{requests.push(path);return{lab:{id:labId},customers:[{id:'c1'}],printSizes:[{id:'s1'}]};},
  Promise,Error,Date,setTimeout,clearTimeout
 };
 vm.createContext(sandbox);
 vm.runInContext(helper+'\nthis.bootstrap=labOutboxBootstrap;',sandbox);
 const key='bootstrap/lab/user/device/print';
 await assert.rejects(sandbox.bootstrap('print'),/یک‌بار در حالت آنلاین/);
 online=true;
 const live=await sandbox.bootstrap('print');
 assert.equal(live.customers.length,1);
 assert.deepEqual(requests,['/api/lab/delegated-orders/bootstrap?mode=print']);
 assert(cache.has(key));
 online=false;
 const fromDisk=await sandbox.bootstrap('print');
 assert.equal(fromDisk.__pbOfflineCached,true);
 assert.equal(fromDisk.customers[0].id,'c1');
 assert.equal(requests.length,1,'offline must not call the server');
 userId='other';
 await assert.rejects(sandbox.bootstrap('print'),/یک‌بار در حالت آنلاین/);
 assert.equal(requests.length,1,'a different account cannot see the cached data');
});

test('manual intake opens from native cached bootstrap and identifies provisional offline prices',()=>{
 assert.match(native,/labOutboxBootstrap\(/);
 assert(!native.includes("'fresh='+Date.now()"),'timestamp cache-busting must be removed from the native bootstrap');
 assert.match(native,/__pbOfflineCached/);
 assert.match(outbox,/labOutboxWarmBootstrap/);
 assert.match(outbox,/id:key,labId:context.labId,userId:context.userId/);
 assert.match(outbox,/setTimeout\(labOutboxWarmBootstrap,700\)/);
});

test('native offline screen ignores unresponsive storage target while preserving submit root check',async()=>{
 const begin=outbox.indexOf('async function labOutboxOpenRoot('),end=outbox.indexOf('\nfunction labOutboxWarmBootstrap()',begin);
 assert(begin>=0&&end>begin);
 const code=outbox.slice(begin,end);
 let online=false,rootCalls=0;
 const ctx={labOutboxOffline:()=>!online,Promise,setTimeout,clearTimeout};
 vm.createContext(ctx);vm.runInContext(code+'\nthis.openRoot=labOutboxOpenRoot;',ctx);
 const provider={root:()=>{rootCalls++;return new Promise(()=>{});}};
 assert.equal(await ctx.openRoot(provider),null);
 assert.equal(rootCalls,0,'known offline must never call configured-storage HTTP-backed root');
 online=true;
 const started=Date.now();
 assert.equal(await ctx.openRoot(provider),null);
 assert(Date.now()-started<1500,'online-but-hung root check must be bounded');
 assert.equal(rootCalls,1);
 assert(native.includes('labOutboxOpenRoot(provider)'));
 assert(native.includes('if(!directory)directory=await provider.root()'),'online commit re-verifies the local root');
});

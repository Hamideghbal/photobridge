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

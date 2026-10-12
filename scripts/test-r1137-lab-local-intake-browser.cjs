const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
function between(from,to){const a=bundle.indexOf(from),b=bundle.indexOf(to,a+from.length);assert(a>=0&&b>a);return bundle.slice(a,b);}
// Exercise the exact existing folder database, naming, permissions and write routines.
const helpers=between('function ii(t)','function Sv(t)')+between('const Iy=','const Ly=')+between('const Ly=','async function el(t,a)');
const bridge=between('/* PB1138 canonical lab storage bridge */','async function tl(t,a)');
for(const mode of ['success','disk','remote','secondary','no-folder'])test(`configured primary laboratory intake: ${mode}`,async()=>{
 const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});const calls=[],registered=[];let fileId;page.setDefaultTimeout(8000);
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());if(!url.pathname.startsWith('/api/'))return route.fulfill({body:'<div class="labRoleWorkspace"><main><div class="roleHeaderToolButtons" style="display:none"></div><div class="ordersWorkspace"></div></main></div>',contentType:'text/html'});
   const body=route.request().postDataJSON();calls.push({url:url.pathname,body,headers:route.request().headers()});
   if(url.pathname.endsWith('/download-device'))return route.fulfill({json:{registered:true,isThisDevice:mode!=='secondary'}});
   if(url.pathname.endsWith('/bootstrap'))return route.fulfill({json:{customers:[{id:'customer',name:'Display Studio',mobile:'09120000000'}],printSizes:[{id:'size',label:'10×15'},{id:'large',label:'20×30'}]}});
   if(url.pathname.endsWith('/presign')){fileId=body.clientFileId;registered.push(body);return route.fulfill({json:{fileId,storageMode:mode==='remote'?'object':'device-local',uploadUrl:mode==='remote'?'https://upload.test/photo':null}});}
   if(url.pathname==='/api/lab/orders/order')return route.fulfill({json:{order:{id:'order',number:42,mode:'print',customer_name:'Customer'},files:registered.map(x=>({id:x.clientFileId,original_name:x.name,print_size_id:x.printSizeId,size_label:x.printSizeId==='size'?'10×15':'20×30',print_type:x.printType,bytes:x.bytes}))}});
   if(url.pathname.endsWith('/submit'))return route.fulfill({json:{order:{id:'order'},invoice:{number:42}}});
   return route.fulfill({json:{orderId:'order',orderNumber:42}});
  });
  await page.goto('https://local.test/lab/orders');
  await page.addScriptTag({content:`async function Me(url,init={}){const r=await fetch(url,{headers:{'content-type':'application/json','x-photobridge-portal':'lab','x-photobridge-device-id':localStorage.getItem('photobridge_lab_device_id')},...init});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error),{data});return data;}`+helpers+bridge+`window.setupConfiguredRoot=async()=>{const root=await navigator.storage.getDirectory(),dir=await root.getDirectoryHandle('Configured Lab Folder',{create:true});await Oy(dir);};window.expectedDay=()=>Ic(new Date());window.readLocalPhoto=async(jobName='10-15-luster-order-42',fileName='photo.jpg')=>{const root=await qs(),day=await root.getDirectoryHandle(Ic(new Date())),customer=await day.getDirectoryHandle('customer'),job=await customer.getDirectoryHandle(jobName);return await(await(await job.getFileHandle(fileName)).getFile()).text();};`});
  await page.evaluate(async mode=>{
   localStorage.setItem('photobridge_lab_device_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   window.pickerCalls=0;window.showDirectoryPicker=async()=>{window.pickerCalls++;throw Error('must never ask for a different folder');};
   if(mode!=='no-folder')await window.setupConfiguredRoot();
   if(mode==='disk')window.pbLabLocalIntakeStorage.write=async()=>{throw Error('disk full');};
  },mode);
  await page.addStyleTag({content:fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.css','utf8')});
  await page.addScriptTag({content:source});
  if(mode==='secondary'){
   await page.waitForFunction(()=>window.pb1137LocalIntake&&document.querySelector('.ordersWorkspace'));await page.waitForTimeout(100);
   assert.equal(await page.locator('#pb1137LocalIntakeButton').count(),0);assert.equal(calls.filter(x=>x.body).length,0);return;
  }
  await page.getByRole('button',{name:'ثبت سفارش عکس حضوری',exact:true}).click();
  if(mode==='no-folder'){await page.getByRole('status').filter({hasText:'مسیر همیشگی ذخیره هنوز تنظیم نشده'}).waitFor();assert.equal(calls.filter(x=>x.body).length,0);assert.equal(await page.evaluate(()=>pickerCalls),0);return;}
  assert.equal(await page.getByRole('button',{name:'انتخاب پوشهٔ ذخیره روی هارد'}).count(),0);
  await page.getByRole('button',{name:'عکاس / مشتری',exact:true}).click();
  assert.equal(await page.getByLabel('جستجوی عکاس').evaluate(el=>el===document.activeElement),false,'opening the menu does not force typing');
  await page.getByLabel('جستجوی عکاس').fill('۰۹۱۲۰۰۰۰۰۰۰');
  await page.getByRole('option',{name:/Display Studio/}).click();
  await page.getByLabel('سایز چاپ',{exact:true}).selectOption('size');
  assert.equal(await page.getByLabel('تحویل سفارش').count(),0);assert.equal(await page.getByLabel('اولویت').count(),0);
  const row=await page.locator('.pb1139EntryRow>.pb1139Customer>button,.pb1139EntryRow>label>select,.pb1139EntryRow>label>button').evaluateAll(items=>items.map(x=>x.getBoundingClientRect().y));
  assert.equal(row.length,5);assert(Math.max(...row)-Math.min(...row)<2,'all entry controls share one aligned row');
  await page.locator('input[type=file]').setInputFiles({name:'Photo.JPG',mimeType:'image/jpeg',buffer:Buffer.from('abc')});
  await page.getByRole('button',{name:'ثبت سفارش و صدور فاکتور'}).click();
  assert.equal(calls.filter(x=>x.body).length,0,'unadded files cannot be silently omitted from final registration');
  await page.getByRole('button',{name:/افزودن/}).click();
  assert.equal(await page.locator('.pb1139Group').count(),1);
  if(mode==='success'){
   await page.getByLabel('سایز چاپ',{exact:true}).selectOption('large');await page.getByLabel('کاغذ',{exact:true}).selectOption('silk');
   await page.locator('input[type=file]').setInputFiles({name:'Second.JPG',mimeType:'image/jpeg',buffer:Buffer.from('def')});await page.getByRole('button',{name:/افزودن/}).click();
   assert.equal(await page.locator('.pb1139Group').count(),2);assert.equal(await page.locator('.pb1139Group').nth(0).locator('b').innerText(),'10×15 · لاستر');
   await page.locator('input[type=file]').setInputFiles({name:'Removed.JPG',mimeType:'image/jpeg',buffer:Buffer.from('ghi')});await page.getByRole('button',{name:/افزودن/}).click();
   await page.locator('.pb1139Group').nth(2).getByRole('button',{name:'حذف گروه'}).click();assert.equal(await page.locator('.pb1139Group').count(),2);
  }
  await page.getByRole('button',{name:'ثبت سفارش و صدور فاکتور'}).click();
  if(mode==='remote'){await page.getByRole('status').filter({hasText:'هیچ عکسی به سرور ارسال نشد'}).waitFor();assert(!calls.some(x=>x.url.endsWith('/submit')));}
  else if(mode==='disk'){await page.getByRole('status').filter({hasText:'disk full'}).waitFor();assert(!calls.some(x=>x.url.endsWith('/submit')),'an unfinished draft must never become an invoiced order');}
  else{
   await page.getByText('سفارش شمارهٔ 42 ثبت شد.').waitFor();assert.equal(await page.evaluate(()=>window.readLocalPhoto()),'abc','original is saved in exactly the existing date/customer/print-job path');
   assert.equal(await page.evaluate(()=>window.readLocalPhoto('20-30-silk-order-42','second.jpg')),'def','second size/paper batch remains separate and is retained');
   assert.equal(registered.length,2);assert.deepEqual(registered.map(x=>[x.printSizeId,x.printType]),[['size','luster'],['large','silk']]);assert(!registered.some(x=>x.name==='Removed.JPG'));
   const create=calls.find(x=>x.url==='/api/lab/delegated-orders');assert.equal(create.body.delivery,'pickup');assert.equal(create.body.priority,'normal');
   const upload=calls.find(x=>x.url.endsWith('/presign'));assert.equal(upload.body.localOnly,true);assert.equal(upload.body.bytes,3);assert.equal(upload.headers['x-photobridge-device-id'],'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
   assert(!calls.some(x=>x.url.includes('/local')||x.url.includes('uploads')));
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('photobridge_lab_download_resume_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa_order')).localComplete),true);
  }
  assert.equal(await page.evaluate(()=>pickerCalls),0);
 }finally{await browser.close();}
});

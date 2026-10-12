const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
for(const fail of [false,true,'remote'])test(fail==='remote'?'unexpected remote upload URL is rejected without transmitting any file':fail?'failed local write prevents creating or submitting an order':'local intake writes originals to disk and sends only metadata through the existing order flow',async()=>{
 const {chromium}=require('playwright'),browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  const calls=[];await page.route('**/*',async r=>{
   const url=new URL(r.request().url());if(!url.pathname.startsWith('/api/'))return r.fulfill({body:'<div class="labRoleWorkspace"><main><div class="ordersWorkspace"></div></main></div>',contentType:'text/html'});
   const body=r.request().postDataJSON();calls.push({url:url.pathname,body,headers:r.request().headers()});
   if(url.pathname.endsWith('/bootstrap'))return r.fulfill({json:{customers:[{id:'customer',name:'Customer',mobile:'09120000000'}],printSizes:[{id:'size',label:'10×15'}]}});
   if(url.pathname.endsWith('/presign'))return r.fulfill({json:{fileId:body.clientFileId,storageMode:fail==='remote'?'object':'device-local',uploadUrl:fail==='remote'?'https://upload.test/photo':null}});
   if(url.pathname.endsWith('/submit'))return r.fulfill({json:{order:{id:'order'},invoice:{number:42}}});
   return r.fulfill({json:{orderId:'order',orderNumber:42}});
  });
  await page.goto('https://local.test/lab/orders');
  await page.evaluate(async fail=>{
   window.savedFiles=[];
   const root=await navigator.storage.getDirectory();
   window.showDirectoryPicker=async()=>({name:'Lab Photos',getDirectoryHandle:async(name,options)=>{
    const directory=await root.getDirectoryHandle(name,options);
    return {getFileHandle:async(name,options)=>{
     const file=await directory.getFileHandle(name,options);
     return {name:file.name,getFile:()=>file.getFile(),createWritable:async()=>{
      const writer=await file.createWritable();return {write:async content=>{if(fail===true)throw Error('disk full');await writer.write(content);window.savedFiles.push({name,bytes:content.size||String(content).length});},close:()=>writer.close(),abort:()=>writer.abort()};
     }};
    }};
   }});
  },fail);
  await page.addScriptTag({content:source});await page.getByRole('button',{name:'ثبت سفارش عکس حضوری',exact:true}).click();
  await page.getByLabel('عکاس / مشتری').selectOption('customer');await page.getByLabel('سایز پیش‌فرض چاپ').selectOption('size');
  await page.getByRole('button',{name:'انتخاب پوشهٔ ذخیره روی هارد'}).click();
  await page.locator('input[type=file]').setInputFiles({name:'photo.jpg',mimeType:'image/jpeg',buffer:Buffer.from('abc')});
  await page.getByRole('button',{name:'ثبت سفارش و صدور فاکتور'}).click();
  if(fail==='remote'){await page.getByRole('status').filter({hasText:'هیچ عکسی به سرور ارسال نشد'}).waitFor();assert.equal(calls.filter(x=>x.body).length,2);assert(!calls.some(x=>x.url.endsWith('/submit')));}
  else if(fail){await page.getByRole('status').filter({hasText:'disk full'}).waitFor();assert.equal(calls.filter(x=>x.body).length,0);}
  else{await page.getByText('سفارش شمارهٔ 42 ثبت شد.').waitFor();assert.equal(calls.filter(x=>x.body).length,3);assert.equal((await page.evaluate(()=>savedFiles)).length,2);const upload=calls.find(x=>x.url.endsWith('/presign'));assert.equal(upload.body.localOnly,true);assert.equal(upload.body.bytes,3);assert.match(upload.headers['x-photobridge-device-id'],/^pbwin-/);assert.equal(upload.headers['x-photobridge-desktop-local-file'],'1');assert(!calls.some(x=>x.url.includes('/local')||x.url.includes('uploads')));assert(await page.getByText('فاکتور صادر شد. عکس‌ها روی هارد این کامپیوتر ذخیره شدند.').isVisible());}
 }finally{await browser.close();}
});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
test('ordering always enables photo selection on update and legacy public content',async()=>{
 const source=fs.readFileSync(path.join(root,'dist/api/server.js'),'utf8'),begin=source.indexOf("if (customerGalleryDetail && req.method === 'PATCH')"),end=source.indexOf('const galleryMediaPresign',begin);
 let updated;const current={id:'gallery',title:'Project',customer_name:'Customer',status:'draft',digital_price:500,selection_enabled:false,ordering_enabled:false,access_code_hash:'hash'};
 const handler=vm.runInNewContext('(async function(req,url,a,labId,res){'+source.slice(begin,end)+'})',{customerGalleryDetail:['','gallery'],pool:{query:async(sql,args)=>{if(sql.startsWith('SELECT *'))return {rowCount:1,rows:[current]};if(sql.startsWith('UPDATE'))updated=args;return {rowCount:1,rows:[]}}},bodyJson:async req=>req.body,normalizeMobile:String,moneyAmount:value=>Number(value)||0,cleanGalleryCode:String,passwordHash:String,sendJson:(_res,status,body)=>({status,body}),audit:async()=>{}});
 const out=await handler({method:'PATCH',body:{selectionEnabled:false,orderingEnabled:true}},{},{userId:'owner'},null,{});assert.equal(out.status,200);assert.equal(updated[9],true);assert.equal(updated[10],true);
 assert(source.includes('selectionEnabled: Boolean(row.selection_enabled || row.ordering_enabled)'),'legacy public galleries must satisfy the invariant too');
});
test('one gallery form accepts photos and price, resumes failed uploads without a second create, and publishes from the card',async()=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});let created=0,uploads=0,completed=0,fail=width===390,published=false,saved,deleted=0,mediaDeleted=false;
 const card=()=>({id:'11111111-1111-1111-1111-111111111111',title:'Project',customer_name:'Customer',status:published?'published':'draft',photo_count:completed,photo_limit:500,digital_price:1500,share_url:'https://panel.test/g/test'});
 page.on('dialog',dialog=>dialog.accept());
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),method=route.request().method();
 if(u.pathname.startsWith('/api/')){
 if(u.pathname==='/api/public/client-gallery/test')return route.fulfill({json:{gallery:{title:'Customer Gallery',photographerName:'Studio',photoCount:1,videoCount:0,requiresCode:true}}});
 if(u.pathname==='/api/auth/me')return route.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:'user',photographerName:'Studio'}}});
 if(u.pathname==='/api/photographer/navigation-tabs')return route.fulfill({json:{tabs:{ai:false,album:false,instagram:false},adminBypass:false}});
 if(u.pathname==='/api/customer/entry-context')return route.fulfill({json:{destination:'none',connectedCount:0}});
 if(u.pathname==='/api/customer/client-galleries'){
 if(method==='POST'){created++;saved=route.request().postDataJSON();return route.fulfill({status:201,json:{gallery:card()}})}
 return route.fulfill({json:{billing:{enabled:true,fee:0,freeGalleriesRemaining:3,freeGalleryLimit:3,maxPhotos:500,balance:0,lifetimeDays:45,previewMaxEdge:1280,previewQuality:58},galleries:created?[card()]:[],printSizes:[],uploadAvailable:true}});
 }
 if(u.pathname.endsWith('/media/presign')){uploads++;return route.fulfill({json:{mediaId:'photo-'+uploads,uploadUrl:'https://panel.test/upload-test'}})}
 if(u.pathname.endsWith('/complete')){if(fail){fail=false;return route.fulfill({status:503,json:{error:'test_upload_interruption'}})}completed++;return route.fulfill({json:{ok:true}})}
 if(u.pathname.includes('/media/')&&method==='DELETE'){if(u.pathname.endsWith('/photo-active')){deleted++;mediaDeleted=true}return route.fulfill({json:{ok:true}})}
 if(u.pathname.endsWith('/11111111-1111-1111-1111-111111111111')){
 if(method==='PATCH'){published=route.request().postDataJSON().status==='published';return route.fulfill({json:{ok:true}})}
 return route.fulfill({json:{gallery:card(),media:mediaDeleted?[]:[{id:'photo-active',media_type:'photo',upload_state:'active',active:true,original_name:'photo.png',url:'https://panel.test/preview.png'}],profilePrintTariffs:[],galleryPrintTariffStates:[],orders:[],branding:{},currentOrder:null}});
 }
 return route.fulfill({json:{guides:[],labs:[],notifications:[],items:[],settings:{},shops:[]}});
 }
 if(u.pathname==='/upload-test')return route.fulfill({status:200,body:''});
 const f=path.join(root,'dist/web',(u.pathname.startsWith('/photographer')||u.pathname.startsWith('/g/'))?'index.html':u.pathname.slice(1));return fs.existsSync(f)&&fs.statSync(f).isFile()?route.fulfill({path:f}):route.fulfill({status:404,body:''});
 });
 await page.goto('https://panel.test/photographer/gallery');await page.getByRole('button',{name:/＋ گالری جدید/}).filter({visible:true}).last().click();
 const dialog=page.getByRole('dialog',{name:'گالری خصوصی جدید'});
 await dialog.getByLabel('عنوان پروژه').fill('Project');await dialog.locator('.grid2 input').first().fill('Customer');await dialog.getByLabel('رمز ورود خصوصی').fill('1234');
 await dialog.locator('input[type=file]').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=','base64')});
 await dialog.getByLabel('قیمت فایل دیجیتال (اختیاری · تومان)').fill('1500');await dialog.locator('.clientGalleryOrderingToggle input').check();
 assert(await dialog.locator('.pb1112CreateMedia').isVisible());assert(await dialog.locator('label').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
 await dialog.getByRole('button',{name:'ساخت گالری رایگان',exact:true}).click();
 if(width===390){await page.locator('.pb1113GalleryDialog').getByRole('button',{name:'متوجه شدم',exact:true}).click();await dialog.getByRole('button',{name:'ادامه بارگذاری',exact:true}).click()}
 await dialog.waitFor({state:'hidden'});assert.equal(created,1,'retry must not create or charge again');assert.equal(completed,1);assert.equal(Number(saved.digitalPrice),1500);assert.equal(saved.selectionEnabled,true);assert.equal(saved.orderingEnabled,true,JSON.stringify(saved));
 assert.equal(await page.locator('.clientGalleryManager').count(),0,'no second settings step');
 const gallery=page.locator('.clientGalleryCard');await gallery.getByRole('button',{name:'انتشار گالری',exact:true}).click();await gallery.getByRole('button',{name:'نمایش مشتری',exact:true}).waitFor();assert.equal(published,true);
 if(width===390)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await gallery.getByRole('button',{name:'مدیریت گالری',exact:true}).click();await page.waitForSelector('.clientGalleryManager');assert.equal(await page.locator('.clientGalleryManagerActions').getByRole('button',{name:'نمایش مشتری',exact:true}).count(),0);assert.equal(await page.locator('.clientGalleryManagerActions').getByRole('button',{name:/انتشار گالری|برگردان به پیش‌نویس/}).count(),0);
 const invoice=page.locator('.clientGallerySettings .clientGalleryOrderingToggle input');await invoice.check();const selection=page.locator('#pb787ManagerSelection');await selection.click();assert(await selection.isChecked(),'ordering must prevent selection from being switched off');
 const deleteButton=page.locator('.clientGalleryMediaItem').getByRole('button',{name:'حذف',exact:true});await deleteButton.click();
 const confirmation=page.locator('.pb1113GalleryDialog');await confirmation.waitFor();assert.equal(await confirmation.getAttribute('dir'),'rtl');
 const style=await confirmation.evaluate(el=>{const s=getComputedStyle(el);return {font:s.fontFamily,align:s.textAlign,size:parseFloat(getComputedStyle(el.querySelector('p')).fontSize)}});assert.match(style.font,/Vazirmatn/);assert.equal(style.align,'right');assert(style.size>=18);
 await confirmation.getByRole('button',{name:'انصراف',exact:true}).click();assert.equal(deleted,0);await deleteButton.click();await confirmation.getByRole('button',{name:'تأیید',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.clientGalleryMediaItem'));assert.equal(deleted,1);
 await page.goto('https://panel.test/g/test');await page.waitForSelector('.clientGalleryLockCard');assert(await page.locator('.clientGalleryLockCard p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
 if(width===390)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.close();
 }
 }finally{await browser.close()}
});

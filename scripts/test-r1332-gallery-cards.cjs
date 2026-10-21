const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
const gid='11111111-1111-4111-8111-111111111111';
for(const width of [320,375,1366,1920])test(`${width}px: gallery cards stay compact, two-row actions preserve manage/preview/copy/toggle/delete`,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const p=await browser.newPage({viewport:{width,height:950},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 let removed=0,patches=[];
 const gallery={id:gid,title:'پرتره خانوادگی',customer_name:'خانواده محمدی',customer_mobile:'09123456789',status:'published',current_order_status:'retouching',pending_revision_count:2,photo_count:64,photo_limit:100,ordered_total:1200000,expires_at:new Date(Date.now()+86400000).toISOString(),share_url:'https://panel.test/g/test-gallery'};
 let galleries=[gallery,{...gallery,id:'22222222-2222-4222-8222-222222222222',status:'draft',current_order_status:null,title:'یک عنوان بسیار طولانی برای بررسی چیدمان کارت گالری مشتری',customer_name:'یک نام طولانی برای مشتری گالری',expires_at:new Date(Date.now()+20*86400000).toISOString()},{...gallery,id:'33333333-3333-4333-8333-333333333333',status:'closed',current_order_status:'completed',title:'پرتره اختصاصی',expires_at:null}];
 await p.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.pathname.startsWith('/api/')){
 let data={items:[],labs:[],shops:[],notifications:[],settings:{}};
 if(u.pathname==='/api/auth/me')data={user:{id:gid,userId:gid,name:'عکاس',labRole:'customer',platformRole:'user',photographerName:'آتلیه'}};
 if(u.pathname==='/api/photographer/navigation-tabs')data={tabs:{ai:false,album:false,instagram:false},adminBypass:false};
 if(u.pathname==='/api/customer/entry-context')data={destination:'none',connectedCount:0};
 if(u.pathname==='/api/customer/client-galleries')data={galleries,billing:{enabled:true,fee:0,maxPhotos:100,balance:10000,lifetimeDays:30,freeGalleriesRemaining:3},printSizes:[],uploadAvailable:true};
 if(u.pathname===`/api/customer/client-galleries/${gid}`){
 if(req.method()==='PATCH'){const body=req.postDataJSON();patches.push(body);Object.assign(gallery,body);data={ok:true};}
 else if(req.method()==='DELETE'){removed++;galleries=galleries.filter(g=>g.id!==gid);data={ok:true};}
 else data={gallery,media:[],branding:{},orders:[],currentOrder:{id:'order',status:'submitted',items:[]},profilePrintTariffs:[],galleryPrintTariffStates:[],printSizes:[]};
 }
 if(u.pathname.endsWith('/sms'))data={available:false,serviceEnabled:false,configured:false,unitPrice:500,balance:10000,preferences:{ownerEnabled:false,customerEnabled:false},customerMobile:gallery.customer_mobile,published:true};
 return route.fulfill({json:data});
 }
 const file=path.join(process.cwd(),'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname.slice(1));
 return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 await p.goto('https://panel.test/photographer/gallery');await p.locator('.pb1332Card').first().waitFor();
 const card=p.locator('.pb1332Card').first();assert.match(await card.locator('.pb1336NeedsRevision').innerText(),/درخواست اصلاح مشتری/);await card.locator('.pb792RenewGallery').waitFor();
 assert.equal(await p.locator('.pb1332Card').count(),3);
 const layout=await card.evaluate(el=>({width:el.getBoundingClientRect().width,overflow:el.scrollWidth>el.clientWidth+1,bg:getComputedStyle(el).backgroundColor,title:getComputedStyle(el.querySelector('h3')).whiteSpace,rows:[...new Set([...el.querySelectorAll('.pb1332Actions button')].filter(b=>b.offsetWidth).map(b=>Math.round(b.getBoundingClientRect().top)))],renewInExpiry:!!el.querySelector('.pb1332CardExpiry .pb792RenewGallery'),renewCount:el.querySelectorAll('.pb792RenewGallery').length,height:el.getBoundingClientRect().height,topBorder:getComputedStyle(el).borderTopColor,customer:el.querySelector('.pb1332Customer').getBoundingClientRect().toJSON(),phone:el.querySelector('.pb1332Customer>bdi').getBoundingClientRect().toJSON(),name:el.querySelector('.pb1332Customer>span').getBoundingClientRect().toJSON(),metrics:el.querySelector('.clientGalleryMetrics').getBoundingClientRect().toJSON(),state:el.querySelector('.clientGalleryOrderState').getBoundingClientRect().toJSON(),expiry:el.querySelector('.pb1332CardExpiry').getBoundingClientRect().toJSON()}));
 assert.equal(layout.bg,'rgb(255, 255, 255)');assert.equal(layout.overflow,false);assert.equal(layout.rows.length,2);assert.equal(layout.title,'nowrap');assert(layout.renewInExpiry);assert.equal(layout.renewCount,1);
 assert(layout.height<=300,'compact populated card stays at most 300px high');assert.equal(layout.topBorder,'rgb(220, 227, 238)','no blue border at the top');assert(layout.phone.top>=layout.name.bottom-1,'mobile appears below customer name');assert(layout.metrics.right<=layout.customer.left+1,'summary is opposite customer identity');assert(Math.abs((layout.metrics.top+layout.metrics.height/2)-(layout.customer.top+layout.customer.height/2))<3,'summary and customer share a row');assert(Math.abs((layout.state.top+layout.state.height/2)-(layout.expiry.top+layout.expiry.height/2))<3,'status and deadline share a row');

 for(const c of await p.locator('.pb1332Card').all())assert.equal(await c.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
 await p.evaluate(()=>{window.open=url=>window.lastPreview=url;navigator.clipboard.writeText=async text=>window.lastCopied=text});
 await card.getByRole('button',{name:'نمایش مشتری',exact:true}).click();assert.equal(await p.evaluate(()=>window.lastPreview),gallery.share_url);
 await card.getByRole('button',{name:'کپی لینک',exact:true}).click();await p.locator('.pb1113GalleryDialog').getByRole('button',{name:'متوجه شدم',exact:true}).click();assert.equal(await p.evaluate(()=>window.lastCopied),gallery.share_url);
 await card.getByRole('button',{name:'غیرفعال کردن',exact:true}).click();await card.getByRole('button',{name:'فعال کردن',exact:true}).waitFor();assert.equal(patches[0].status,'draft');
 await card.getByRole('button',{name:'حذف گالری '+gallery.title,exact:true}).click();await p.locator('.pb1113GalleryDialog').getByRole('button',{name:'انصراف',exact:true}).click();assert.equal(removed,0);
 await card.getByRole('button',{name:'انتخاب‌ها و روتوش',exact:true}).click();await p.locator('.clientGalleryManager.view-selected').waitFor();assert(await p.locator('.clientGalleryOrderWorkflow').isVisible());
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

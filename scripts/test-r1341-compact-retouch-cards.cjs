const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
const id='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222',mediaId='33333333-3333-4333-8333-333333333333';
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII=';
for(const width of [390,1366])test(`${width}px: retouch metadata stays compact and plain cards do not stretch`,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const gallery={id,title:'گالری آزمایشی',customer_name:'مشتری',customer_mobile:'09123456789',status:'published',photo_count:1,photo_limit:100,digital_price:0,share_url:'https://panel.test/g/token',current_order_status:'submitted',expires_at:new Date(Date.now()+86400000).toISOString()};
 const state={prefs:{ownerEnabled:false,customerEnabled:false},balance:2000,status:'retouching',proof:true,proofAt:'2026-10-21T10:00:00Z',revisionAt:'2026-10-21T11:00:00Z',send:[],uploads:0,actions:[],saveFails:false};
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname;
  if(p==='/test-upload'){await new Promise(resolve=>setTimeout(resolve,600));return route.fulfill({status:200,body:''});}
  if(p.startsWith('/api/')){
   if(p==='/api/auth/me')return route.fulfill({json:{user:{id,userId:id,name:'عکاس',labRole:'customer',platformRole:'user',photographerName:'آتلیه'}}});
   if(p==='/api/photographer/navigation-tabs')return route.fulfill({json:{tabs:{ai:false,album:false,instagram:false},adminBypass:false}});
   if(p==='/api/customer/entry-context')return route.fulfill({json:{destination:'none',connectedCount:0}});
   if(p==='/api/customer/client-galleries')return route.fulfill({json:{billing:{enabled:true,fee:0,freeGalleriesRemaining:3,maxPhotos:100,balance:state.balance,lifetimeDays:30},galleries:[gallery],printSizes:[],uploadAvailable:true}});
   if(p.endsWith('/sms/settings')){if(state.saveFails)return route.fulfill({status:503,json:{error:'save_failed'}});state.prefs=req.postDataJSON();return route.fulfill({json:{preferences:state.prefs}})}
   if(p.endsWith('/sms/send')){state.send.push(req.postDataJSON());state.balance-=500;return route.fulfill({json:{sent:true,chargedAmount:500,walletBalance:state.balance}})}
   if(p.endsWith('/sms'))return route.fulfill({json:{available:true,serviceEnabled:true,configured:true,unitPrice:500,balance:state.balance,preferences:state.prefs,customerMobile:gallery.customer_mobile,published:true}});
   if(p.endsWith('/retouch/presign')){state.uploads++;return route.fulfill({json:{proofId:'proof-id',uploadUrl:'https://panel.test/test-upload'}})}
   if(p.includes('/retouch/')&&p.endsWith('/complete')){state.proof=true;state.proofAt=new Date().toISOString();state.status='retouching';return route.fulfill({json:{ok:true}})}
   if(p.endsWith('/action')){const action=req.postDataJSON().action;state.actions.push(action);if(action==='send_approval')state.status='awaiting_approval';return route.fulfill({json:{ok:true,status:state.status,sms:{sent:true}}})}
   if(p===`/api/customer/client-galleries/${id}`)return route.fulfill({json:{gallery,media:[{id:mediaId,media_type:'photo',active:true,upload_state:'active',original_name:'photo.jpg',url:pixel}],branding:{},printSizes:[],profilePrintTariffs:[],galleryPrintTariffStates:[],orders:[],currentOrder:{id:orderId,number:1,status:state.status,total:0,finalized_at:new Date().toISOString(),revisionRequests:state.revisionAt?[{id:'revision',mediaId,round:1,note:'اصلاح نور',createdAt:state.revisionAt}]:[],items:[{id:'item',media_id:mediaId,item_type:'selection',original_name:'photo.jpg',media_url:pixel,retouch:state.proof?{id:'proof-'+state.uploads,url:pixel,created_at:state.proofAt}:null},{id:'other-item',media_id:'44444444-4444-4444-8444-444444444444',item_type:'selection',original_name:'other.jpg',media_url:pixel,retouch:{id:'other-proof',url:pixel,created_at:'2026-10-21T10:00:00Z'}}]}}});
   return route.fulfill({json:{items:[],notifications:[],labs:[],shops:[],settings:{},balance:state.balance}});
  }
  const file=path.join(process.cwd(),'dist/web',p.startsWith('/photographer')?'index.html':p.slice(1));
  return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
 });
 await page.goto('https://panel.test/photographer/gallery');
 await page.locator('.clientGalleryCardActions button').filter({hasText:'انتخاب‌ها و روتوش'}).click();
 await page.locator('.clientGalleryManager.view-selected').waitFor();
 const cards=page.locator('.clientGalleryRetouchCardV409');await cards.first().waitFor();assert.equal(await cards.count(),2);
 const sizes=await cards.evaluateAll(nodes=>nodes.map(el=>{const box=el.getBoundingClientRect(),meta=el.querySelector('.clientGalleryRetouchMeta').getBoundingClientRect();return {height:box.height,meta:meta.height,blank:box.bottom-meta.bottom,overflow:el.scrollWidth>el.clientWidth+1};}));
 assert(sizes.every(item=>item.blank<=3),'cards must end directly after their content, not stretch to neighboring cards');assert(sizes.every(item=>!item.overflow));assert(sizes[0].meta<=180,'correction metadata stays compact');assert(sizes[1].meta<=90,'plain metadata contains no empty action area');
 assert.equal(await cards.nth(1).locator('.clientGalleryRetouchUpload').count(),0);assert.equal(await cards.nth(0).locator('.clientGalleryRetouchUpload').count(),1);assert.equal(await cards.nth(0).locator('.pb1340CorrectionState.pending').count(),1);
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});

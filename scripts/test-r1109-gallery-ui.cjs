const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function serve(page,state){
 await page.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/photographer/navigation-tabs'){if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));return r.fulfill({json:{tabs:state.tabs||{ai:false,album:false,instagram:false},adminBypass:false}})}
  if(u.pathname==='/api/customer/client-galleries')return r.fulfill({json:{billing:{enabled:true,fee:0,renewalFee:10000,freeGalleriesRemaining:state.remaining??3,freeGalleryLimit:3,maxPhotos:500,balance:0,unlimited:!!state.unlimited,lifetimeDays:45,postCompletionDays:7},galleries:[],printSizes:[],uploadAvailable:true}});
  if(u.pathname==='/api/public/video-guides')return r.fulfill({json:{guides:state.guides||[]}});
  if(u.pathname==='/api/admin/photographers')return r.fulfill({json:{photographers:[{id:'photographer-1',name:'Test Studio',mobile:'09121234567',active:true,labs_count:1,active_labs_count:1,gallery_count:4,gallery_paid_total:35000}]}});
  if(u.pathname==='/api/auth/me'&&state.admin)return r.fulfill({json:{user:{userId:'admin',name:'Platform Admin',platformRole:'platform_admin',labRole:'lab_admin'}}});
  if(u.pathname==='/api/auth/me')return r.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:'user',photographerName:'Test Studio'}}});
  if(u.pathname==='/api/customer/entry-context')return r.fulfill({json:{destination:'none',connectedCount:0}});
  return r.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
 }
 const f=u.pathname==='/equipment-rental/book'?path.join(root,'dist/api/equipment-rental-book.html'):path.join(root,'dist/web',(u.pathname.startsWith('/photographer')||u.pathname.startsWith('/admin'))?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });
}
test('gallery has one expiry, hides missing guides and shares the Store chooser blue theme',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [390,1366])for(const uploaded of [false,true]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:width<820,serviceWorkers:'block'});
 const device=width<820?'mobile':'desktop';await serve(page,{guides:uploaded?[{id:'gallery-'+device,title:'گالری '+device,src:'/uploaded-guide.mp4'}]:[{id:'gallery-'+device,title:'گالری '+device,src:null}]});
 await page.goto('https://panel.test/photographer/gallery');await page.waitForSelector('.clientGalleryWorkspace');
 await page.waitForFunction(()=>['ready','missing'].includes(document.documentElement.dataset.pb1109GalleryGuide));
 const guide=page.locator('#pb793-gallery-video-guide');assert.equal(await guide.isVisible(),uploaded);
 const policy=await page.locator('.clientGalleryPolicyLine').textContent();assert.match(policy,/۴۵ روز/);assert.doesNotMatch(policy,/بعد از تأیید نهایی/);assert.equal(await page.locator('.clientGalleryPolicyLine>span').count(),1);
 const galleryTheme=await page.locator('.clientGalleryIntroHeader').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundImage,shadow:s.boxShadow,radius:s.borderRadius}});
 if(width<820){
 await page.locator('.photographerBottomAppNav').getByRole('button',{name:'فروشگاه',exact:true}).click();
 const frame=await page.locator('#pb1106StorePanel iframe').elementHandle().then(el=>el.contentFrame());await frame.waitForSelector('.pbR96StoreChooserHead');
 const storeTheme=await frame.locator('.pbR96StoreChooserHead').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundImage,shadow:s.boxShadow,radius:s.borderRadius}});
 assert.deepEqual(galleryTheme,storeTheme,'Gallery introduction must match actual Store chooser theme');
 }
 await page.close();
 }
 }finally{await browser.close()}
});

test('admin photographers show gallery count and gallery payments on desktop and mobile',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [390,1366]){
 const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'});await serve(page,{admin:true});
 await page.goto('https://panel.test/admin/photographers');
 await page.waitForSelector('.pb1110GalleryUsage');
 const text=await page.locator('.pb1110GalleryUsage').textContent();assert.match(text,/۴ گالری/);assert.match(text,/۳۵[٬,]۰۰۰/);assert.match(text,/تومان/);
 assert(await page.locator('.pb1110GalleryUsage').isVisible());await page.close();
 }
 }finally{await browser.close()}
});

test('admin photographer gallery policy displays its lifetime exemption',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await serve(page,{unlimited:true});
 await page.goto('https://panel.test/photographer/gallery');await page.waitForSelector('.clientGalleryPolicyLine');
 assert.match(await page.locator('.clientGalleryPolicyLine').textContent(),/محدودیت زمانی و حذف خودکار ندارند/);
 }finally{await browser.close()}
});

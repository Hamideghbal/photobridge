const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function serve(page,state){
 await page.route('**/*',async r=>{const u=new URL(r.request().url());
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/photographer/navigation-tabs'){if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));return r.fulfill({json:{tabs:state.tabs||{ai:false,album:false,instagram:false},adminBypass:false}})}
  if(u.pathname==='/api/customer/client-galleries')return r.fulfill({json:{billing:{enabled:true,fee:0,renewalFee:10000,freeGalleriesRemaining:state.remaining??3,freeGalleryLimit:3,maxPhotos:500,balance:0,lifetimeDays:30,postCompletionDays:7},galleries:[],printSizes:[],uploadAvailable:true}});
  if(u.pathname==='/api/auth/me')return r.fulfill({json:{user:{userId:'customer',name:'Customer',labRole:'customer',platformRole:'user',photographerName:'Test Studio'}}});
  if(u.pathname==='/api/customer/entry-context')return r.fulfill({json:{destination:'none',connectedCount:0}});
  return r.fulfill({json:{labs:[],galleries:[],items:[],notifications:[],jobs:[],models:[],settings:{},stats:{},transactions:[],shops:[]}});
 }
 const f=u.pathname==='/equipment-rental/book'?path.join(root,'dist/api/equipment-rental-book.html'):path.join(root,'dist/web',u.pathname.startsWith('/photographer')?'index.html':u.pathname.slice(1));
 return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});
 });
}
test('mobile gallery explains its workflow and offers free creation with readable dock and no horizontal overflow',async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [320,390])for(const enabled of [false,true]){
 const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await serve(page,{tabs:{ai:enabled,album:enabled,instagram:enabled}});
 await page.goto('https://panel.test/photographer/gallery');await page.waitForSelector('.clientGalleryWorkspace');
 assert.match(await page.locator('.clientGalleryIntroCopy p').textContent(),/لینک گالری و رمز ورود/);
 assert.match(await page.locator('.clientGalleryIntroCopy p').textContent(),/سه گالری اول/);
 await page.waitForFunction(()=>document.querySelector('#pbF37Tabs')?.textContent.includes('۳ رایگان'));
 assert((await page.locator('.clientGalleryIntroCopy p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>=15);
 const nav=page.locator('.photographerBottomAppNav');
 assert((await nav.locator('button em').evaluateAll(list=>list.map(el=>parseFloat(getComputedStyle(el).fontSize)))).every(size=>size>=13),'dock labels must be readable');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert((await nav.locator('button em').evaluateAll(list=>list.filter(el=>el.getBoundingClientRect().width>0).map(el=>el.scrollWidth<=el.clientWidth+1))).every(Boolean),'enlarged labels must fit with either three or six tabs');
 if(process.env.PB_CAPTURE_UI)await page.screenshot({path:'/tmp/r1108-gallery-'+width+'.png'});
 await page.locator('#pbF37Tabs button').filter({hasText:'گالری جدید'}).click();
 const create=page.getByRole('button',{name:'ساخت گالری رایگان',exact:true});await create.waitFor({state:'visible'});assert.equal(await create.isDisabled(),false,'zero-balance customer can create a trial gallery');
 await page.close();
 }
 }finally{await browser.close()}
});

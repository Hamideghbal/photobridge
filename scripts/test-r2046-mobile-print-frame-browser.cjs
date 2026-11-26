// Full delivered application, not a substituted React component: use the
// real mobile dock, its iframe, the lab chooser POST, and the actual plus.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve('dist/web'),html=fs.readFileSync(root+'/index.html','utf8');
 const labs=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'].map((id,i)=>({id,name:'Lab '+(i+1),active:true,connected:true}));let selected=labs[0].id;
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/158.0.0.0 Mobile Safari/537.36',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{let last=null;window.pb2046FirstPaint=[];const observer=new MutationObserver(()=>{const toolbar=document.querySelector('.pb2044NativePhotoActions');if(!toolbar||toolbar===last)return;last=toolbar;requestAnimationFrame(()=>{const sc=document.querySelector('.photographerRolePageScrollArea');if(toolbar.isConnected&&sc)window.pb2046FirstPaint.push(sc.getBoundingClientRect().top)})});observer.observe(document,{childList:true,subtree:true});});
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!=='https://panel.test')return route.fulfill({status:200,body:''});if(u.pathname.startsWith('/api/')){let data={ok:true,items:[],models:[],types:[],orders:[],tabs:{ai:false,album:false,instagram:false,customers:false,calendar:false,store:true}};if(u.pathname==='/api/auth/me')data={user:{userId:'33333333-3333-4333-8333-333333333333',labRole:'customer',name:'Fixture',photographerName:'Fixture',mobile:'09121111111'},lab:{id:selected}};if(u.pathname==='/api/customer/labs')data={memberships:labs.map(x=>({...x,selected:x.id===selected})),labs:[],activeLabId:selected};if(u.pathname.endsWith('/select'))selected=u.pathname.split('/').at(-2);if(u.pathname==='/api/customer/home')data={lab:{id:selected,name:'Lab fixture',active:true,canOrder:true},prices:[{id:'44444444-4444-4444-8444-444444444444',label:'10×15',width_cm:10,height_cm:15,luster:1000}],status:{open:true},papers:[],orders:[],membership:{active:true},customer:{id:'33333333-3333-4333-8333-333333333333'},labOptions:labs};return route.fulfill({json:data});}const local=path.join(root,u.pathname);if(path.extname(u.pathname)&&fs.existsSync(local))return route.fulfill({path:local});return route.fulfill({body:html,contentType:'text/html'});});
  await page.goto('https://panel.test/photographer/gallery');const dock=page.locator('nav.photographerBottomAppNav');await dock.locator('button[aria-label="گالری"]').waitFor();
  for(const lab of labs){
   await dock.locator('button[aria-label="چاپ"]').click();const frame=page.frameLocator('#pb1106PrintPanel iframe');
   await frame.locator('[data-select="'+lab.id+'"]').click();
   await frame.locator('#pb765-add').click();
   const send=frame.locator('.pb2044NativeSend'),product=frame.locator('.pb2044NativeProduct');await send.waitFor();await product.waitFor();
   assert.equal(selected,lab.id);assert.equal(await send.count(),1);assert.equal(await product.count(),1);assert.equal(await frame.locator('#pbF37PrintComposerActions .pbF37Send').isVisible(),false);
   const sample=await send.evaluate(async b=>{const a=document.querySelector('.photographerRolePageScrollArea'),p=document.querySelector('.pb2044NativeProduct');const measure=()=>{const r=b.getBoundingClientRect(),s=a.getBoundingClientRect(),t=p.getBoundingClientRect();return {send:[r.x,r.y,r.width,r.height],area:[s.x,s.y,s.width,s.height],product:[t.x,t.y,t.width,t.height],radius:getComputedStyle(b).borderRadius,bottom:innerHeight-r.bottom,embedded:document.documentElement.dataset.pb1106Embedded}};const values=[];for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,100));values.push(measure())}return values;});
   const last=sample.at(-1);assert.equal(last.radius,'50%');assert.equal(last.send[2],last.send[3]);assert.equal(last.embedded,'1');assert(last.bottom>=0&&last.bottom<35,'no extra dock gap');assert(last.product[1]<250);assert.deepEqual(sample,Array(sample.length).fill(last),'content geometry remains stable after entry');
   assert.deepEqual(await frame.locator('body').evaluate(()=>window.pb2046FirstPaint),[241],'first painted frame already reserves the composer toolbar');
   await dock.locator('button[aria-label="گالری"]').click();await page.locator('#pb1106PrintPanel').waitFor({state:'hidden'});
  }
  assert(!errors.some(e=>e.includes('main?.querySelector')),errors.join('\n'));
  console.log('PASS R2046 real Gallery → Print iframe → lab selection → plus → native Send, twice; stable content and correct bottom clearance.');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

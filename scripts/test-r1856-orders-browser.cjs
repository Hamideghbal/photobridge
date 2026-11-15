const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(process.env.PB1854_NATIVE?'dist/web/lab-desktop-ui':'dist/web'),file='assets/index-UIRefine-v655-r84.js',lab='11111111-1111-4111-8111-111111111111';
 let source=fs.readFileSync(path.join(root,file),'utf8');const entry='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(source.includes(entry));source=source.replace(entry,`Tx.createRoot(document.getElementById('root')).render(e.jsx(Hf,{me:{user:{id:'33333333-3333-4333-8333-333333333333',name:'عکاس آزمایشی'},lab:{id:'${lab}'}},onLogout:()=>{}}));`);
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:960},serviceWorkers:'block'});let ordersRequests=0,homeStarted=false,release;const blocked=new Promise(r=>release=r),errors=[];
  const orders=Array.from({length:80},(_,i)=>({id:'99999999-9999-4999-8999-'+String(i).padStart(12,'0'),lab_id:lab,mode:'print',status:'sent',number:1856000+i,created_at:'2020-01-01T00:00:00Z',file_count:1,total_bytes:100}));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/customer/orders'){ordersRequests++;assert.equal(url.searchParams.get('_lab'),lab);return route.fulfill({json:{labId:lab,orders}})}
   if(url.pathname==='/api/customer/home'){homeStarted=true;await blocked;return route.fulfill({json:{lab:{id:lab,name:'لابراتوار آزمایشی'},profile:{studio_name:'عکاسی آزمایشی'},prices:[],papers:[],status:{open:true}}})}
   if(url.pathname==='/api/customer/labs')return route.fulfill({json:{memberships:[{id:lab,name:'لابراتوار آزمایشی'}]}});
   if(url.pathname==='/api/auth/me')return route.fulfill({json:{user:{id:'33333333-3333-4333-8333-333333333333'}}});
   if(url.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true,pending:false,items:[],models:[],types:[]}});
   if(url.pathname==='/'+file)return route.fulfill({body:source,contentType:'text/javascript'});
   const local=path.join(root,url.pathname);if(path.extname(url.pathname)&&fs.existsSync(local))return route.fulfill({path:local});
   return route.fulfill({body:'<!doctype html><html dir="rtl"><body><div id="root"></div><script type="module" src="/'+file+'"></script></body></html>',contentType:'text/html'});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://panel.test/photographer/orders/flow?workspace=print');
  await assert.doesNotReject(async()=>{for(let i=0;i<50&&!homeStarted;i++)await page.waitForTimeout(20);assert(homeStarted);assert.equal(ordersRequests,1,'order request must start before home finishes')});
  const before=Date.now();release();await page.waitForFunction(()=>document.querySelectorAll('[data-order-id]').length===80,{},{timeout:4000});assert(Date.now()-before<4000,'80 rows must not take the legacy 8.4-second stagger');assert.equal(ordersRequests,1,'initial prefetched history is consumed exactly once');assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'هوش مصنوعی',exact:true}).first().click();await page.waitForFunction(()=>document.querySelectorAll('[data-order-id]').length===0);await page.getByRole('button',{name:'چاپ',exact:true}).first().click();await page.waitForFunction(()=>document.querySelectorAll('[data-order-id]').length===80);assert.equal(ordersRequests,2,'returning to history requests fresh orders');await context.close();console.log('PASS orders '+width+': scoped request starts before home response; one initial request; 80 old orders render without per-row delay; remount fetches fresh data');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

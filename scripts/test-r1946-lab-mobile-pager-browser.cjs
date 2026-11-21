'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const anchor='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})]})';
 const ix=ui.indexOf(anchor);
 assert(ix>=0,'R1946 status filters must close before inserting toolbar');
 assert(ui.slice(ix+anchor.length,ix+anchor.length+100).startsWith(',e.jsx("div",{className:"r1944Toolbar"'),'pager is a sibling of queueFilters, not a 4th filter button');
 assert(html.includes('/* PB1946: Lab filters followed by a separate, visible sticky-toolbar row */'));
 assert(html.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert(html.includes('.r1944Search{grid-column:1;grid-row:1'));
 assert(html.includes('.r1944Pager{grid-column:1;grid-row:3'));
 assert(html.includes('labStage=r1946'),'new JS cache revision required');
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],requests=[];
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname.startsWith('/api/')){
   let out={orders:[],rows:[],items:[],notifications:[],unread:0,status:{open:true},lab:{id:'lab',name:'Lab',active:true,album_enabled:true},settings:{},customers:[],temporaryCustomers:[],invitations:[],prices:[],hours:[],sizes:[],papers:[],albums:[],orderStats:{},recentOrders:[],walletBalance:0,collaborationPending:{count:0}};
   if(url.pathname==='/api/auth/me')out={user:{id:'admin',userId:'admin',labRole:'lab_admin',platformRole:'user',name:'Test Admin',mobile:'09120000000'},lab:{id:'lab',name:'Lab',album_enabled:true,active:true}};
   if(url.pathname==='/api/lab/dashboard')out={...out,lab:out.lab,ordersOpen:57,features:{siteEnabled:true,desktopEnabled:true}};
   if(url.pathname==='/api/lab/orders'){
    requests.push(url.search);
    if(url.searchParams.get('paged')==='1') {
     const stage=url.searchParams.get('stage')||'flow';
     const q=url.searchParams.get('q')||'';
     const total=q?1:({flow:57,ready:21,completed:15}[stage]||0);
     out={orders:[],total,page:Number(url.searchParams.get('page')||1),pageSize:10,pages:Math.max(1,Math.ceil(total/10)),counts:q?{flow:1,ready:1,completed:1}:{flow:57,ready:21,completed:15},stage,mode:url.searchParams.get('mode')||'print'};
    }
   }
   try{return await route.fulfill({json:out});}catch{return}
  }
  const target=url.pathname==='/'||!path.extname(url.pathname)?'dist/web/index.html':'dist/web'+url.pathname;
  return fs.existsSync(target)?route.fulfill({path:path.resolve(target)}):route.fulfill({status:404,body:''});
 });
 try{
  for(const width of [360,390,430]){
   await page.setViewportSize({width,height:844});
   await page.goto('https://panel.test/lab/orders');
   await page.waitForSelector('.labQueueStickyBar > .r1944Toolbar .r1944Search',{timeout:16000});
   const g=await page.evaluate(()=>{
     const box=sel=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height,display:cs.display,visibility:cs.visibility,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}};
     return {
      width:document.documentElement.clientWidth,
      status:box('.labQueueStickyBar > .queueFilters'),
      buttons:[...document.querySelectorAll('.labQueueStickyBar > .queueFilters > button')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}}),
      toolbar:box('.labQueueStickyBar > .r1944Toolbar'),
      search:box('.labQueueStickyBar > .r1944Toolbar .r1944Search'),
      summary:box('.labQueueStickyBar > .r1944Toolbar .r1944PageSummary'),
      pager:box('.labQueueStickyBar > .r1944Toolbar .r1944Pager'),
      pageButtons:[...document.querySelectorAll('.r1944Pager .r1944PageButton')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}}),
      oldSearch:box('.labQueueStickyBar > .desktopQueueSearch')
     }
   });
   assert(g.status&&g.toolbar&&g.search&&g.pager,'all three queue header rows must exist at width '+width);
   assert(g.status.height>=30,'status filters must be visible at '+width);
   assert.equal(g.buttons.length,3,'all three status tabs remain available at '+width);
   assert(g.buttons.every(x=>x.width>=40),'status tab has usable tap width at '+width);
   assert(g.toolbar.top>=g.status.bottom-2,'toolbar must begin BELOW status tabs at '+width+': '+JSON.stringify(g));
   assert(g.search.height>=28&&g.search.top>=g.toolbar.top,'search must remain visible at '+width);
   assert(g.pager.top>=g.search.bottom-2,'pager must appear BELOW search at '+width);
   assert(g.summary.top>=g.search.bottom-2&&g.pager.top>=g.summary.bottom-2,'count row cannot overlap input or pager at '+width);
   assert(g.toolbar.left>=-2&&g.toolbar.right<=g.width+2,'toolbar has no horizontal overflow at '+width);
   assert(g.pageButtons.length<=5,'mobile pager must fit previous, 3 numbers and next at '+width);
   assert(g.pageButtons.every(x=>x.left>=g.toolbar.left-2&&x.right<=g.toolbar.right+2&&x.width>=25),'every pagination button stays inside its toolbar at '+width);
   if(g.oldSearch)assert.equal(g.oldSearch.display,'none','old desktop-only search cannot duplicate the mobile field');
  }
  await page.locator('.r1944Search').fill('956');
  await page.waitForFunction(()=>document.querySelector('.r1944Search')?.value==='956');
  await page.waitForTimeout(500);
  assert(requests.some(s=>s.includes('paged=1')&&s.includes('q=956')),'mobile search reaches full-history server endpoint');
  assert.equal(errors.filter(x=>/r1944Toolbar|r1944Page|ReferenceError/.test(x)).length,0,errors.join('; '));
  console.log('[R1946] real Chromium mobile lab status/search/page geometry OK at 360/390/430px');
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});

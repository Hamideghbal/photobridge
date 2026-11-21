'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8'),ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const anchor='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})]})',ix=ui.indexOf(anchor);
 assert(ix>=0,'status filters must close before the new toolbar');
 assert(ui.slice(ix+anchor.length,ix+anchor.length+120).startsWith(',e.jsx("div",{className:"r1944Toolbar"'),'toolbar must be a direct sticky-header child, not a fourth filter button');
 assert(ui.includes('Math.min(r1944Pages,typeof window!=="undefined"&&window.innerWidth<=720?3:5)'),'mobile shows 3 numbered pages');
 assert(ui.includes('type:"search",className:"r1944Search"')&&ui.includes('r1944SetQuery(le.target.value)'),'search interaction preserved');
 assert(ui.includes('paged=1&mode=')&&ui.includes('r1944SetPage'),'server pagination preserved');
 const styles=html.match(/<style id="pb1944-lab-pager">([\s\S]*?)<\/style>/);
 assert(styles,'final Lab pager CSS missing');
 assert(styles[1].includes('/* PB1946: Lab filters followed by a separate, visible sticky-toolbar row */'));
 assert(styles[1].includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert(styles[1].includes('.r1944Search{grid-column:1;grid-row:1'));
 assert(styles[1].includes('.r1944Pager{grid-column:1;grid-row:3'));
 assert(html.includes('labStage=r1946'),'new cache revision missing');
 // Use verified compiled DOM hierarchy and the actual final CSS in Chromium.
 // Login redirects from the full app are intentionally not part of a geometry test.
 const body="<!DOCTYPE html><html lang=\"fa\" dir=\"rtl\"><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>*{box-sizing:border-box}body{margin:0;background:#f3f6fc;font:13px Tahoma,Arial,sans-serif}.shell{width:100%;padding:0 8px;height:1500px}.labQueueStickyBar{position:sticky;top:0;display:flex;align-items:center;background:#fff;border-bottom:1px solid #dfe5ef;min-height:45px;z-index:5;padding:8px;gap:7px}.queueFilters{display:flex;gap:6px;align-items:center}.queueFilters button{border:1px solid #d6dfea;border-radius:9px;background:#f4f7fb;padding:7px 12px;font:inherit;white-space:nowrap}</style><style>"+styles[1]+"</style></head><body><div class=\"shell\"><div class=\"labQueueStickyBar quickAccessAlwaysOpen\"><div class=\"labQueueSearchSlot desktopQueueSearch\"><input aria-label=\"old search\"></div><div class=\"queueFilters mainQueueFilters compactQueueFilters\"><button class=\"active\">در جریان ۵۷</button><button>آماده تحویل ۲۱</button><button>تحویل‌شده ۱۵</button></div><div class=\"r1944Toolbar\"><div class=\"r1944ToolbarInner\"><input type=\"search\" class=\"r1944Search\" placeholder=\"شماره سفارش، عکاس یا نام عکس\"><span class=\"r1944PageSummary\">نمایش ۱ تا ۱۰ از ۵۷ سفارش</span><div class=\"r1944Pager\"><button class=\"r1944PageButton\">قبلی</button><button class=\"r1944PageButton active\">۱</button><button class=\"r1944PageButton\">۲</button><button class=\"r1944PageButton\">۳</button><button class=\"r1944PageButton\">بعدی</button></div></div></div></div><div class=\"labOrderGrid\" style=\"padding:16px\">کارت‌های سفارش</div></div></body></html>";
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  for(const width of [360,390,430]){
   await page.setViewportSize({width,height:844});
   await page.setContent(body);
   const g=await page.evaluate(()=>{
    const box=sel=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width,display:cs.display}};
    return {viewport:document.documentElement.clientWidth,status:box('.labQueueStickyBar > .queueFilters'),toolbar:box('.labQueueStickyBar > .r1944Toolbar'),search:box('.r1944Search'),summary:box('.r1944PageSummary'),pager:box('.r1944Pager'),oldSearch:box('.labQueueStickyBar > .desktopQueueSearch'),buttons:[...document.querySelectorAll('.queueFilters button')].map(el=>el.getBoundingClientRect().width),pageButtons:[...document.querySelectorAll('.r1944PageButton')].map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width}})};
   });
   assert(g.status&&g.toolbar&&g.search&&g.pager,'status, search and pager visible at '+width);
   assert(g.status.height>=30&&g.buttons.length===3&&g.buttons.every(x=>x>=40),'status filters are touchable at '+width);
   assert(g.toolbar.top>=g.status.bottom-2,'toolbar below status buttons at '+width+': '+JSON.stringify(g));
   assert(g.search.height>=28&&g.search.top>=g.toolbar.top,'search visible at '+width);
   assert(g.summary.top>=g.search.bottom-2&&g.pager.top>=g.summary.bottom-2,'search/count/page rows do not overlap at '+width);
   assert(g.toolbar.left>=-2&&g.toolbar.right<=g.viewport+2,'toolbar fits screen at '+width);
   assert(g.pageButtons.length===5&&g.pageButtons.every(x=>x.width>=25&&x.left>=g.toolbar.left-2&&x.right<=g.toolbar.right+2),'pager buttons fit without horizontal scrolling at '+width);
   assert.equal(g.oldSearch.display,'none','duplicate desktop search hidden');
   await page.screenshot({path:'/tmp/r1216-mobile-r1946-pager-'+width+'.png'});
  }
  await page.evaluate(()=>scrollTo(0,600));
  const sticky=await page.locator('.labQueueStickyBar').evaluate(el=>el.getBoundingClientRect().top);
  assert(sticky>=-2&&sticky<=2,'filters and pager stay together in sticky header on scroll');
  console.log('[R1946] Chromium mobile Lab header geometry passed at 360/390/430px');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

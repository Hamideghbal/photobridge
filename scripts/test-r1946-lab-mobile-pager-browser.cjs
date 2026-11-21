'use strict';
// R1946: Browser geometry from the actual final CSS/JS in BOTH web and Windows bundles.
// Mount a deterministic laboratory header fixture: auth/login redirects must not
// cause false failures or hide a UI layout regression.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
const ASSET='assets/index-UIRefine-v655-r84.js';
const labTabsAnchor='children:["تحویل‌شده ",e.jsx("b",{children:V(ge.completed)})]})]})';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');

function readPayload(root){
 const ui=fs.readFileSync(root+'/'+ASSET,'utf8');
 const html=fs.readFileSync(root+'/index.html','utf8');
 const i=ui.indexOf(labTabsAnchor);
 assert(i>0,root+' lab status tabs were not found');
 assert(ui.slice(i+labTabsAnchor.length,i+labTabsAnchor.length+120).startsWith(']})'+',r1955Host?bi.createPortal(e.jsx("section",{className:"r1955ThirdHeader"'),root+' search/pager must use React portal into third header');
 assert(ui.includes('main.insertBefore(host,scroll)'),root+' real header host is not placed before the blue scroll surface');
 assert(ui.includes('[r1955Host,r1955SetHost]=x.useState(null)'),root+' header host must be React managed');
 assert(!ui.includes('className:"r1952StatusTabs"'),root+' duplicated status tabs must not be rendered');
 assert(ui.includes('PB1944 server-paged lab queue'),root+' must use server paging');
 assert(ui.includes('/api/lab/orders?paged=1&mode='),root+' missing server paged endpoint');
 assert(ui.includes('window.innerWidth<=820?3:5'),root+' mobile pager must limit numeric buttons');
 assert(html.includes('labStage=r1956'),root+' fresh UI revision missing');
 assert(html.includes('PB1956:'),root+' fixed scroll viewport CSS missing');
 const style=html.match(/<style id="pb1944-lab-pager">([\s\S]*?)<\/style>/);
 assert(style&&style[1].includes('PB1947:')&&style[1].includes('PB1949:'),root+' final mobile/desktop CSS missing');
 assert(!ui.includes('className:"labQueueSearchSlot desktopQueueSearch"'),root+' duplicated search still mounted');
 const newStyle=html.match(/<style id="pb1955-real-third-header">([\s\S]*?)<\/style>/);
 assert(newStyle&&newStyle[1].includes('PB1955:'),root+' independent controls CSS not delivered');
 assert(!style[1].includes(':has(')&&!newStyle[1].includes(':has('),root+' toolbar must not rely on :has() support');
 const links=(html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g)||[]).join('\n').replaceAll('href="./','href="/');
 if(root.endsWith('lab-desktop-ui')){
  const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  for(const name of [ASSET,'index.html','photobridge-r1363-lab-queue.js']){
   const entry=manifest.files.find(f=>f.name===name);
   assert(entry,'native UI updater must download '+name);
   assert.equal(entry.sha256,sha(fs.readFileSync(root+'/'+name)),name+' hash must match manifest after build');
  }
  assert.equal(manifest.build,sha(JSON.stringify(manifest.files)),root+' native build hash must be valid');
 }
 const queueRuntime=fs.readFileSync(root+'/photobridge-r1363-lab-queue.js','utf8');
 assert(queueRuntime.includes('.pb1955ThirdHeaderHost')&&queueRuntime.includes('--pb1956-third-bottom'),root+' runtime must measure new header');
 const queueCss=fs.readFileSync('dist/web/photobridge-r1363-lab-queue.css','utf8');
 return {root,html,style:'<style>'+queueCss+'</style>'+style[0]+newStyle[0],links,queueRuntime};
}

function fixtureHtml({style,links},width){
 const num=width<=820?3:5;
 const numbers=Array.from({length:num},(_,i)=>'<button type="button" class="r1944PageButton'+(i===0?' active':'')+'">'+(i+1)+'</button>').join('');
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width, initial-scale=1">'+links+
 '<style>html,body{margin:0;padding:0;width:100%;max-width:100%}#root{width:100%;max-width:100%}.labRoleWorkspace{width:100%}.labGlobalStageHeader{box-sizing:border-box;width:100%;height:52px;display:flex;align-items:center;gap:8px;padding:0 10px;direction:rtl;background:#fff;border-bottom:1px solid #dce4ef}.labGlobalStageHeader button{height:33px;border:0;background:#edf4ff;color:#235bc2;border-radius:8px;padding:0 10px}.r1946Fixture{box-sizing:border-box;width:100%;max-width:100%;padding:0 10px 8px;}</style>'+
 style+
 '</head><body><div id="root"><div class="labRoleWorkspace"><main class="pageMain pbFixedRoleHeader labPrimaryConnectorMode appWorkspacePage pb1151PrintPage">'+
 '<div class="labGlobalStageHeader"><button class="active">در جریان ۱۸۸</button><button>آماده تحویل ۱۱۹</button><button>تحویل‌شده ۱۴۰</button></div>'+
 '<div class="pb1955ThirdHeaderHost"><section class="r1955ThirdHeader"><div class="r1944Toolbar"><div class="r1944ToolbarInner">'+
 '<input type="search" class="r1944Search" placeholder="جست‌وجو در سفارش‌ها">'+
 '<span class="r1944PageSummary">نمایش ۱ تا ۱۰ از ۱۸۸ سفارش</span><div class="r1944Pager"><button class="r1944PageButton">قبلی</button>'+
 numbers+'<button class="r1944PageButton">بعدی</button></div></div></div></section></div>'+
 '<div class="rolePageScrollArea labRolePageScrollArea"><div class="ordersWorkspace stageQueueWorkspace compactStageQueue r1946Fixture">'+
 '<div class="labQueueStickyBar quickAccessAlwaysOpen"><div class="labQueueQuickAccessV464">میانبرهای لابراتوار</div>'+
 '<div class="labQueueSearchSlot desktopQueueSearch"><input aria-label="جستجوی قدیمی"></div>'+
 '<div class="queueFilters mainQueueFilters compactQueueFilters"><button class="active">در جریان ۱۸۸</button><button>آماده تحویل ۱۱۹</button><button>تحویل‌شده ۱۴۰</button></div></div>'+
 '<div class="labOrderScrollArea">سفارش‌های صفحه</div></div></div></main></div></div></body></html>';
}
const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility,animationName:s.animationName};};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const root of ['dist/web','dist/web/lab-desktop-ui']){
   const payload=readPayload(root);
   const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
   await page.route('**/*',route=>{
    const url=new URL(route.request().url()),file=path.join(path.resolve(root),url.pathname);
    return path.extname(url.pathname)&&fs.existsSync(file)?route.fulfill({path:file}):route.fulfill({status:404,body:''});
   });
   for(const width of [360,390,430,768,1280]){
    await page.goto('about:blank');
    await page.setViewportSize({width,height:900});
    await page.setContent(fixtureHtml(payload,width),{waitUntil:'load'});
    await page.addScriptTag({content:payload.queueRuntime});
    await page.waitForFunction(()=>document.documentElement.classList.contains('pb1956LabThirdHeader')&&document.documentElement.style.getPropertyValue('--pb1956-third-bottom'),{timeout:6000});
    const g=await page.evaluate(()=>{
     const get=q=>document.querySelector(q);
     const b=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility,animationName:s.animationName};};
     const header=get('.labQueueStickyBar');
     return{vp:document.documentElement.clientWidth,docScroll:document.documentElement.scrollWidth,thirdActive:document.documentElement.classList.contains('pb1956LabThirdHeader'),thirdBottom:document.documentElement.style.getPropertyValue('--pb1956-third-bottom'),header:b(header),filter:b(get('.labGlobalStageHeader')),legacyFilter:b(get('.labQueueStickyBar > .queueFilters')),tabs:[...document.querySelectorAll('.labGlobalStageHeader > button')].map(b),panel:b(get('.pb1955ThirdHeaderHost')),scroll:b(get('.rolePageScrollArea.labRolePageScrollArea')),toolbar:b(get('.pb1955ThirdHeaderHost .r1944Toolbar')),search:b(get('.r1944Search')),summary:b(get('.r1944PageSummary')),pager:b(get('.r1944Pager')),buttons:[...document.querySelectorAll('.r1944PageButton')].map(b),old:b(get('.desktopQueueSearch'))};
    });
    const tag=root+':'+width;
    assert(g.header&&g.filter&&g.panel&&g.toolbar&&g.search&&g.summary&&g.pager,tag+' missing independent panel pieces');
    assert(g.tabs.length===3&&g.tabs.every(b=>b.width>35&&b.height>20),tag+' status tabs collapsed');
    assert(g.toolbar.height>=30&&g.search.height>=28&&g.pager.height>=30,tag+' search and pager must be visible');
    assert(g.panel.top>=g.filter.bottom-2,tag+' third header overlaps second header '+JSON.stringify(g));
    assert(Math.abs(g.panel.height-52)<=1,tag+' third header must match second header height of 52px '+JSON.stringify(g));
    assert(g.thirdActive,tag+' live measured third-header mode not enabled');
    assert(Math.abs(parseFloat(g.thirdBottom)-g.panel.bottom)<=2,tag+' runtime must measure actual third header bottom '+JSON.stringify(g));
    assert(g.scroll?.top>=g.panel.bottom-2,tag+' blue scroll surface must start below third header');
    assert(g.search.top>=g.toolbar.top-1&&g.pager.top>=g.toolbar.top-1,tag+' search or pager obscured');
    assert(g.header.left>=-3&&g.header.right<=g.vp+3,tag+' header exceeds viewport');
    assert(g.toolbar.left>=-3&&g.toolbar.right<=g.vp+3,tag+' toolbar exceeds viewport');
    assert(g.buttons.every(b=>b.left>=g.toolbar.left-3&&b.right<=g.toolbar.right+3&&b.width>=24),tag+' page buttons overflow');
    if(width>820){
      assert(g.search.left>=g.pager.right-3,tag+' desktop search should be right and pager should be left');
      assert(Math.abs(g.search.top-g.pager.top)<10,tag+' desktop header must be one row');
      assert(g.panel.height<=52,tag+' desktop third header should be compact');
    } 
    assert.equal(g.buttons.length,width<=820?5:7,tag+' correct numeric pager count');
    if(width<=820){
     assert(Math.abs(g.search.top-g.pager.top)<12,tag+' mobile search and pager must share one header row');
     assert.equal(g.summary.display,'none',tag+' mobile summary must be compact/hidden');
     assert(g.buttons.every(b=>b.width>=24),tag+' mobile page touch targets too narrow');
    }
    assert(g.old?.display==='none',tag+' duplicated old search');
    assert(g.legacyFilter?.display==='none',tag+' hidden legacy tabs must not overlap new tab panel');
    assert(g.panel.bottom<=g.header.top+3,tag+' third header must be ABOVE the old order workspace header');
    assert(g.buttons.every(b=>b.animationName==='none'),tag+' pagination must never blink on polling');
    assert(g.filter.bottom<=g.panel.top+3,tag+' third header must follow existing status row without extra controls');
    console.log('[R1946]',tag,'layout ok, page numbers',g.buttons.length-2);
   }
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

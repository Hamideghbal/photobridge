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
 assert(ui.slice(i+labTabsAnchor.length,i+labTabsAnchor.length+90).startsWith(',e.jsx("div",{className:"r1944Toolbar"'),root+' toolbar must be sibling of all 3 status filters');
 assert(ui.includes('PB1944 server-paged lab queue'),root+' must use server paging');
 assert(ui.includes('/api/lab/orders?paged=1&mode='),root+' missing server paged endpoint');
 assert(ui.includes('window.innerWidth<=820?3:5'),root+' mobile pager must limit numeric buttons');
 assert(html.includes('labStage=r1949'),root+' fresh UI revision missing');
 const style=html.match(/<style id="pb1944-lab-pager">([\s\S]*?)<\/style>/);
 assert(style&&style[1].includes('PB1947:')&&style[1].includes('PB1949:'),root+' final mobile/desktop CSS missing');
 assert(!ui.includes('className:"labQueueSearchSlot desktopQueueSearch"'),root+' duplicated search still mounted');
 assert(!style[1].includes(':has('),root+' toolbar must not rely on :has() support');
 const links=(html.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g)||[]).join('\n').replaceAll('href="./','href="/');
 if(root.endsWith('lab-desktop-ui')){
  const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  for(const name of [ASSET,'index.html']){
   const entry=manifest.files.find(f=>f.name===name);
   assert(entry,'native UI updater must download '+name);
   assert.equal(entry.sha256,sha(fs.readFileSync(root+'/'+name)),name+' hash must match manifest after build');
  }
  assert.equal(manifest.build,sha(JSON.stringify(manifest.files)),root+' native build hash must be valid');
 }
 return {root,html,style:style[0],links};
}
function fixtureHtml({style,links},width){
 const num=width<=820?3:5;
 const numbers=Array.from({length:num},(_,i)=>'<button type="button" class="r1944PageButton'+(i===0?' active':'')+'">'+(i+1)+'</button>').join('');
 return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width, initial-scale=1">'+links+
 '<style>html,body{margin:0;padding:0;width:100%;max-width:100%}#root{max-width:100%}.labRoleWorkspace{width:100%}.r1946Fixture{box-sizing:border-box;width:100%;max-width:100%;padding:8px 10px;}</style>'+
 style+
 '</head><body><div id="root"><div class="labRoleWorkspace"><main class="appWorkspacePage pb1151PrintPage"><div class="rolePageScrollArea labRolePageScrollArea"><div class="stageQueueWorkspace compactStageQueue r1946Fixture"><div class="labQueueStickyBar quickAccessAlwaysOpen">'+
 '<div class="labQueueQuickAccessV464">میانبرهای لابراتوار</div><div class="labQueueSearchSlot desktopQueueSearch">جست‌وجوی قدیمی</div>'+
 '<div class="queueFilters mainQueueFilters compactQueueFilters"><button class="active">در جریان ۱۸۸</button><button>آماده تحویل ۱۱۹</button><button>تحویل‌شده ۱۴۰</button></div>'+
 '<div class="r1944Toolbar"><div class="r1944ToolbarInner"><input type="search" class="r1944Search" placeholder="جست‌وجو در سفارش‌ها">'+
 '<span class="r1944PageSummary">نمایش ۱ تا ۱۰ از ۱۸۸ سفارش</span><div class="r1944Pager"><button class="r1944PageButton">قبلی</button>'+
 numbers+'<button class="r1944PageButton">بعدی</button></div></div></div>'+
 '</div><div class="labOrderScrollArea">سفارش‌های صفحه</div></div></main></div></div></body></html>';
}
const box=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility};};
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
    await page.setViewportSize({width,height:900});
    await page.setContent(fixtureHtml(payload,width),{waitUntil:'load'});
    const g=await page.evaluate(()=>{
     const get=q=>document.querySelector(q);
     const b=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility};};
     const header=get('.labQueueStickyBar');
     return{vp:document.documentElement.clientWidth,docScroll:document.documentElement.scrollWidth,header:b(header),filter:b(get('.queueFilters')),tabs:[...document.querySelectorAll('.queueFilters > button')].map(b),toolbar:b(get('.labQueueStickyBar > .r1944Toolbar')),search:b(get('.r1944Search')),summary:b(get('.r1944PageSummary')),pager:b(get('.r1944Pager')),buttons:[...document.querySelectorAll('.r1944PageButton')].map(b),old:b(get('.desktopQueueSearch'))};
    });
    const tag=root+':'+width;
    assert(g.header&&g.filter&&g.toolbar&&g.search&&g.summary&&g.pager,tag+' missing header pieces');
    assert(g.tabs.length===3&&g.tabs.every(b=>b.width>35&&b.height>20),tag+' status tabs collapsed');
    assert(g.toolbar.height>=48&&g.search.height>=28&&g.pager.height>=30,tag+' search and pager must be visible');
    assert(g.toolbar.top>=g.filter.bottom-2,tag+' pager overlaps status filters '+JSON.stringify(g));
    assert(g.search.top>=g.toolbar.top-1&&g.pager.top>=g.search.top,tag+' search obscured');
    assert(g.header.left>=-3&&g.header.right<=g.vp+3,tag+' header exceeds viewport');
    assert(g.toolbar.left>=-3&&g.toolbar.right<=g.vp+3,tag+' toolbar exceeds viewport');
    assert(g.buttons.every(b=>b.left>=g.toolbar.left-3&&b.right<=g.toolbar.right+3&&b.width>=24),tag+' page buttons overflow'); 
    assert.equal(g.buttons.length,width<=820?5:7,tag+' correct numeric pager count');
    if(width<=820){
     assert(g.search.bottom<=g.summary.top+2&&g.summary.bottom<=g.pager.top+2,tag+' mobile rows overlap');
     assert(g.buttons.every(b=>b.width>=24),tag+' mobile page touch targets too narrow');
    }
    assert(g.old?.display==='none',tag+' duplicated old search');
    assert(g.filter.top>=g.header.top-2&&g.filter.bottom<=g.toolbar.top+3,tag+' status buttons must precede the pager under actual legacy CSS');
    console.log('[R1946]',tag,'layout ok, page numbers',g.buttons.length-2);
   }
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

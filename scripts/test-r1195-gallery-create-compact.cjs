const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
const css=read('dist/web/photobridge-r1195-gallery-create-compact.css');
const index=read('dist/web/index.html');
let playwright=null;
try{playwright=require('playwright')}catch{}
const chromiumPath=playwright&&(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':playwright.chromium.executablePath());
const chromiumAvailable=!!chromiumPath&&fs.existsSync(chromiumPath);
test('React creates new gallery fee/capacity/lifetime only once inside header',()=>{
 assert(ui.includes('headerExtra:d=null')||ui.includes('headerExtra:d='));
 assert(ui.includes('children:[e.jsx("h2",{children:t}),d,e.jsx("button"'));
 const i=ui.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید"');
 assert(i>0);
 const sample=ui.slice(i,i+3300);
 assert(sample.includes('dialogClassName:"pb1112CreateDialog",headerExtra:e.jsxs("div",{className:"clientGalleryCreateBilling"'));
 assert(sample.includes('هزینه ساخت')&&sample.includes('ظرفیت')&&sample.includes('عمر اولیه'));
 assert.equal((sample.match(/className:"clientGalleryCreateBilling"/g)||[]).length,1,'no duplicate summary in form body');
 assert(sample.includes('"عنوان پروژه"'));
 assert(sample.includes('className:"grid2"'));
 assert(sample.includes('"نام مشتری"'));
 assert(sample.includes('"موبایل مشتری"'));
});
test('three first fields share one grid row, but other form sections keep their width',()=>{
 assert(css.includes('.clientGalleryCreateForm > label:first-child'));
 assert(css.includes('grid-column:1!important'));
 assert(css.includes('.clientGalleryCreateForm > .grid2:nth-child(2)'));
 assert(css.includes('grid-column:2/-1!important'));
 assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
 assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
 assert(css.includes('.clientGalleryCreateForm > *'));
 assert(css.includes('grid-column:1/-1!important'));
});
test('creation header contains title, summary and close and keeps short-screen scrolling',()=>{
 assert(css.includes('grid-template-columns:max-content minmax(0,1fr) 30px!important'));
 assert(css.includes('> .modalHead > .clientGalleryCreateBilling'));
 assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
 assert(css.includes('> .modalHead > button'));
 assert(css.includes('@media(max-width:820px)'));
 assert(css.includes('@media(max-width:370px)'));
 assert(read('dist/web/photobridge-r1194-gallery-create-dialog.css').includes('overflow-y:auto!important'));
 assert(!css.includes('.clientGalleryTariffTableModal'));
});
test('fresh asset URLs load without affecting other modal paths',()=>{
 assert.equal(index.split('/photobridge-r1195-gallery-create-compact.css?v=r1195').length-1,1);
 assert.match(index,/index-UIRefine-v655-r84\.js\?v=[^"]*&gallery=r1195(?:&fields=r1196)?(?:&[^"]*)?"/);
});
test('Chromium visually verifies three fields stay one row at mobile and desktop sizes when available',{skip:!playwright?'Playwright unavailable':!chromiumAvailable?'Chromium executable not installed in this build environment':false},async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:chromiumPath,args:['--no-sandbox','--disable-gpu']});
 try{
  for(const width of [320,390,1366]){
   const page=await browser.newPage({viewport:{width,height:740}});
   await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
   await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><div class="modalBack globalModalLayer"><div class="modal pb1112CreateDialog"><div class="panelHead modalHead"><h2>گالری خصوصی جدید</h2><div class="clientGalleryCreateBilling"><span><small>هزینه ساخت</small><b>رایگان</b></span><span><small>ظرفیت</small><b>500 عکس</b></span><span><small>عمر اولیه</small><b>45 روز</b></span></div><button>×</button></div><div class="modalContent"><div class="clientGalleryCreateForm"><label>عنوان پروژه<input></label><div class="grid2"><label>نام مشتری<input></label><label>موبایل مشتری<input></label></div><label>رمز ورود<input></label></div></div></div></div>');
   await page.addStyleTag({path:'dist/web/assets/index-UIRefine-v586.css'});
   await page.addStyleTag({path:'dist/web/photobridge-r1112-gallery-form.css'});
   await page.addStyleTag({path:'dist/web/photobridge-r1194-gallery-create-dialog.css'});
   await page.addStyleTag({path:'dist/web/photobridge-r1195-gallery-create-compact.css'});
   const g=await page.evaluate(()=>{
    const p=document.querySelector('.clientGalleryCreateForm > label:first-child input').getBoundingClientRect();
    const [c,m]=[...document.querySelectorAll('.clientGalleryCreateForm > .grid2 input')].map(n=>n.getBoundingClientRect());
    const title=document.querySelector('.modalHead h2').getBoundingClientRect();
    const summary=document.querySelector('.modalHead .clientGalleryCreateBilling').getBoundingClientRect();
    const close=document.querySelector('.modalHead > button').getBoundingClientRect();
    const next=document.querySelector('.clientGalleryCreateForm > label:nth-child(3)').getBoundingClientRect();
    return {ys:[p.y,c.y,m.y],xs:[p.x,c.x,m.x],widths:[p.width,c.width,m.width],title:{x:title.x,y:title.y},summary:{x:summary.x,y:summary.y},close:{x:close.x,y:close.y},nextY:next.y,rowBottom:Math.max(p.bottom,c.bottom,m.bottom),scrollW:document.documentElement.scrollWidth};
   });
   assert(g.ys.every(y=>Math.abs(y-g.ys[0])<2),'the 3 inputs share a horizontal row at '+width+': '+JSON.stringify(g));
   assert(g.widths.every(w=>w>60),'each input usable at '+width);
   assert(g.nextY>g.rowBottom-1,'following field must start next row');
   assert(g.scrollW<=width+1,'no horizontal page overflow');
   if(width>370)assert(Math.abs(g.title.y-g.summary.y)<25,'summary stays next to title');
   await page.close();
  }
 }finally{await browser.close()}
});

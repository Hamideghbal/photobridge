const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1189-lab-queue-stability.css','utf8');
const base=fs.readFileSync('dist/web/assets/index-UIRefine-v586.css','utf8');
const app=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
test('actual queue component uses full viewport 3D motion in the original base UI',()=>{
 assert(app.includes('labOrderScrollArea queuePageTurn'));
 for(const marker of ['pbQueueTurn446OutForward','pbQueueTurn446InForward','pbQueueTurn446OutBackward','pbQueueTurn446InBackward']){
  assert(base.includes(marker),marker);
 }
 assert(base.includes('translate3d(106vw,0,0)'));
});
test('desktop lab list transforms and fading are stopped without changing tab underline',()=>{
 assert.match(css,/@media \(min-width:821px\) and \(hover:hover\) and \(pointer:fine\)/);
 assert(css.includes('.labOrderScrollArea.queuePageTurn.in.forward'));
 assert(css.includes('.labOrderScrollArea.queuePageTurn.out.backward'));
 assert(css.includes('animation:none!important;'));
 assert(css.includes('transform:none!important;'));
 assert(css.includes('filter:none!important;'));
 assert(css.includes('opacity:1!important;'));
 assert(css.includes('.labOrderCard.orderEnterFade'));
 assert(css.includes('view-transition-name:none!important'));
 assert(css.includes('overflow-anchor:none!important'));
 assert(css.includes('.stageQueueWorkspace.compactStageQueue'));
 assert(!css.includes('.pb1148SecondaryHeader button'));
});
test('a fresh browser-only stylesheet is attached to the production site',()=>{
 assert.match(html,/photobridge-r1189-lab-queue-stability\.css\?v=r1189"/);
});
let playwright=null;
try{playwright=require('playwright');}catch{}
const chromiumPath=playwright&&(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':playwright.chromium.executablePath());
const chromiumAvailable=!!chromiumPath&&fs.existsSync(chromiumPath);
test('real Chromium computed animation stays disabled through all 3D queue phases; mobile unchanged', {skip:!playwright?'Browser harness not installed in production-only build':!chromiumAvailable?'Chromium executable not installed in this build environment':false},async()=>{
 const {chromium}=playwright;
 const browser=await chromium.launch({executablePath:chromiumPath,args:['--no-sandbox','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  // A failed imported stylesheet makes Chromium reject addStyleTag itself.
  // Supply an empty font stylesheet so queue animation assertions stay offline.
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.setContent('<div id="root"><div class="labRoleWorkspace"><nav class="pb1174QueueNav"></nav><div class="labRolePageScrollArea rolePageScrollArea"><div class="stageQueueWorkspace compactStageQueue"><div class="labQueueStickyBar"></div><section class="labOrderScrollArea queuePageTurn out forward"><article class="labOrderCard orderEnterFade">سفارش آزمایشی</article></section></div></div></div>');
  await page.addStyleTag({path:'dist/web/assets/index-UIRefine-v586.css'});
  const before=await page.locator('.queuePageTurn').evaluate(el=>getComputedStyle(el).animationName);
  assert.notEqual(before,'none','old queue uses full-screen slide animation');
  await page.addStyleTag({path:'dist/web/photobridge-r1189-lab-queue-stability.css'});
  for(const state of ['out forward','in forward','out backward','in backward','idle']){
   const r=await page.locator('.queuePageTurn').evaluate((el,state)=>{
    el.className='labOrderScrollArea queuePageTurn '+state;
    const s=getComputedStyle(el),card=getComputedStyle(el.querySelector('.labOrderCard'));
    return {animation:s.animationName,transform:s.transform,filter:s.filter,opacity:s.opacity,card:card.animationName};
   },state);
   assert.equal(r.animation,'none','list animation '+state);
   assert.equal(r.transform,'none','list transform '+state);
   assert.equal(r.filter,'none','list filter '+state);
   assert.equal(r.opacity,'1','list opacity '+state);
   assert.equal(r.card,'none','card fade '+state);
  }
  assert.equal(await page.locator('.labRolePageScrollArea').evaluate(el=>getComputedStyle(el).viewTransitionName),'none');
  await page.setViewportSize({width:390,height:844});
  const mobile=await page.locator('.queuePageTurn').evaluate(el=>{
    el.className='labOrderScrollArea queuePageTurn out forward';
    return getComputedStyle(el).animationName;
  });
  assert.notEqual(mobile,'none','mobile original status transition unaffected');
  await page.close();
 }finally{await browser.close();}
});

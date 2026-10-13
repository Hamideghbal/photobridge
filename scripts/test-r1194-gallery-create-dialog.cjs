const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1194-gallery-create-dialog.css');
const index=read('dist/web/index.html');
const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
const header=read('dist/web/photobridge-r1124-photographer-desktop-header.css');

test('new gallery form is a real body-portal dialog with an exclusive class selector',()=>{
 assert(ui.includes('dialogClassName:"pb1112CreateDialog"'));
 assert(ui.includes('className:"modalBack globalModalLayer"'));
 assert(ui.includes('document.body)}'));
 assert(css.includes('html body > .globalModalLayer.modalBack:has(> .modal.pb1112CreateDialog)'));
 assert(!css.includes('.clientGalleryTariffTableModal'));
});
test('dialog and backdrop stack above fixed photographer header, not under it',()=>{
 assert(header.includes('z-index:2147483550!important'));
 assert.match(css,/z-index:2147483600!important/);
 assert.match(css,/z-index:2147483601!important/);
 assert.match(css,/place-items:center!important/);
 assert.match(css,/align-items:center!important/);
 assert.match(css,/transform:none!important/);
});
test('header stays visible while content scrolls on desktop and mobile',()=>{
 assert(css.includes('max-height:calc(100dvh - 24px)!important'));
 assert(css.includes('max-height:calc(100dvh - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important'));
 assert(css.includes('> .modal.pb1112CreateDialog > .modalHead'));
 assert(css.includes('flex:0 0 auto!important'));
 assert(css.includes('> .modal.pb1112CreateDialog > .modalContent'));
 assert(css.includes('overflow-y:auto!important'));
 assert(css.includes('overscroll-behavior:contain!important'));
 assert(css.includes('-webkit-overflow-scrolling:touch!important'));
 assert(css.includes('min-height:0!important'));
});
test('the late stylesheet is linked once in the real website with its release token',()=>{
 const tag='/photobridge-r1194-gallery-create-dialog.css?v=r1194';
 assert.equal(index.split(tag).length-1,1);
 assert(index.includes('<link rel="stylesheet" href="'+tag+'">'));
});
test('computed overlay stacking and containment when a local Chromium harness is installed', {skip:(()=>{try{require.resolve('playwright');return false}catch{return 'Playwright unavailable in production-only build'}})()},async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});
 try{
  for(const width of [390,1366]){
   const page=await browser.newPage({viewport:{width,height:740},isMobile:width<=820,hasTouch:width<=820});
   await page.setContent('<div id="root"><header style="position:fixed;inset:0 0 auto;height:114px;z-index:2147483550;background:blue">Header</header></div><div class="modalBack globalModalLayer"><section class="modal card pb1112CreateDialog" role="dialog"><div class="modalHead" style="min-height:54px">گالری خصوصی جدید</div><div class="modalContent"><div class="clientGalleryCreateForm" style="height:950px">Form</div></div></section></div>');
   await page.addStyleTag({path:'dist/web/assets/index-UIRefine-v586.css'});
   await page.addStyleTag({path:'dist/web/photobridge-r1112-gallery-form.css'});
   await page.addStyleTag({path:'dist/web/photobridge-r1194-gallery-create-dialog.css'});
   const result=await page.locator('[role=dialog]').evaluate(el=>{
    const overlay=el.parentElement,head=el.querySelector('.modalHead'),inner=el.querySelector('.modalContent');
    const outer=el.getBoundingClientRect(),h=head.getBoundingClientRect(),v=inner.getBoundingClientRect();
    return {overlayZ:Number(getComputedStyle(overlay).zIndex),z:Number(getComputedStyle(el).zIndex),top:outer.top,bottom:outer.bottom,headTop:h.top,scrollable:inner.scrollHeight>inner.clientHeight,overflow:getComputedStyle(inner).overflowY,innerTop:v.top};
   });
   assert(result.overlayZ>2147483550&&result.z>2147483550);
   assert(result.top>=0&&result.bottom<=740);
   assert(result.headTop>=result.top&&result.innerTop>=result.headTop);
   assert.equal(result.overflow,'auto');
   assert(result.scrollable,'form remains scrollable on '+width);
   await page.close();
  }
 }finally{await browser.close()}
});

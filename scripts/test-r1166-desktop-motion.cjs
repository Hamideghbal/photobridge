const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
test('desktop navigation animates content below fixed scroll chrome and respects reduced motion',async()=>{
 const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:1366,height:900}});
 await page.setContent('<style>.photographerRolePageScrollArea{transform:none!important;opacity:1!important;position:fixed;inset:100px 0 0}</style><div class="photographerRolePageScrollArea"><section class="clientGalleryWorkspace">Gallery</section></div>');
 const a=source.indexOf(' function motionContent('),b=source.indexOf('\n\n function schedule()',a);assert(a>=0&&b>a);
 await page.addScriptTag({content:source.slice(a,b)+'window.testReveal=()=>reveal(motionContent(document));'});
 await page.evaluate(()=>window.testReveal());
 const running=await page.locator('.clientGalleryWorkspace').evaluate(el=>{const animation=el.getAnimations()[0];animation.pause();animation.currentTime=80;return {opacity:Number(getComputedStyle(el).opacity),frames:animation.effect.getKeyframes(),wrapper:el.parentElement.getAnimations().length}});
 assert(running.opacity<1&&running.opacity>.35);assert.equal(running.wrapper,0);assert.equal(running.frames[0].transform,'translateY(12px)');
 await page.evaluate(()=>{window.testReveal();window.testReveal()});assert.equal(await page.locator('.clientGalleryWorkspace').evaluate(el=>el.getAnimations().length),1,'repeated clicks cancel previous motion');
 await page.locator('.clientGalleryWorkspace').evaluate(el=>el.getAnimations().forEach(a=>a.cancel()));await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.testReveal());assert.equal(await page.locator('.clientGalleryWorkspace').evaluate(el=>el.getAnimations().length),0);
 }finally{await browser.close()}
});
test('motion stays desktop-only and versioned in the build',()=>{assert(source.includes("if(!matchMedia('(min-width:821px)').matches)return;"));assert(source.includes('reveal(motionContent(document))'));const html=fs.readFileSync('dist/web/index.html','utf8');assert(html.includes('photobridge-r1126-desktop-navigation.js?v=r1240-photographer-wallet-label-and-store-full-bleed'));});

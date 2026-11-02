const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

test('desktop tabs fill the viewport and embedded headers stay hidden after later header styles',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--disable-features=OverlayScrollbar']});
 try{
  const css=file=>fs.readFileSync('dist/web/'+file,'utf8');
  // Match production order: navigation loads before the main bundle and header CSS.
  // The real navigation controller unhides the chrome when it mounts. This
  // static CSS-only fixture has no controller, so explicitly model its active
  // desktop state; the responsive/geometry rules remain production CSS.
  const activeChrome='<style>html.pb1126Desktop body #pb1126ChromeHost,html.pb1126Desktop body .pb1126ContentPanel{display:block!important}</style>';
  const styles='<style>'+css('photobridge-r1126-desktop-navigation.css')+'</style><style>'+css('assets/index-UIRefine-v586.css')+'</style><style>'+css('photobridge-r1124-photographer-desktop-header.css')+'</style>'+activeChrome;
  for(const width of [1024,1366,1920]){
   for(const embedded of [false,true]){
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.route('**/*',r=>r.abort());
    await page.setContent('<!doctype html><html dir="rtl" class="'+(embedded?'pb1126Embedded pb1126FrameStoreHost':'pb1126Desktop')+'"><head>'+styles+'</head><body><div id="root"><header id="photographerRoleHeaderV710" class="photographerHeaderRefined"></header></div><div id="storePhotographerWorkspace"><header id="photographerStoreRoleHeader" class="photographerHeaderRefined"></header></div>'+(embedded?'':'<div id="pb1126ChromeHost"><header id="pb1126DesktopHeader" class="photographerHeaderRefined"></header></div><section class="pb1126ContentPanel"><iframe title="store"></iframe></section>')+'</body></html>');
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarGutter),'auto');
    for(const id of ['photographerRoleHeaderV710','photographerStoreRoleHeader']){
     assert.equal(await page.locator('#'+id).isVisible(),false,id+' must stay hidden in '+(embedded?'embedded':'outer')+' document');
    }
    if(!embedded){
     for(const selector of ['#pb1126DesktopHeader','.pb1126ContentPanel','.pb1126ContentPanel iframe']){
      const box=await page.locator(selector).boundingBox();
      assert(box,selector+' should be visible in the active desktop shell at '+width+'px');
      assert(Math.abs(box.x)<1,selector+' left edge: '+JSON.stringify(box));
      assert(Math.abs(box.x+box.width-width)<1,selector+' right edge: '+JSON.stringify(box));
     }
    }
    await page.close();
   }
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  await mobile.route('**/*',r=>r.abort());
  await mobile.setContent('<!doctype html><html class="pb1126Embedded"><head><meta name="viewport" content="width=device-width,initial-scale=1">'+styles+'</head><body><div id="storePhotographerWorkspace"><header id="photographerStoreRoleHeader" class="photographerHeaderRefined">Mobile header</header></div></body></html>');
  assert.equal(await mobile.locator('#photographerStoreRoleHeader').isVisible(),true,'mobile keeps its own header');
  await mobile.close();
 }finally{await browser.close();}
});

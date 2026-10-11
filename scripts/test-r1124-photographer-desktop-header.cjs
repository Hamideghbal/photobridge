const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('photographer desktop header aligns identity, navigation and actions while mobile stays untouched',async()=>{
  const {chromium}=require('playwright');
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    for(const [width,route] of [[1366,'/photographer/gallery'],[1024,'/photographer/gallery'],[1366,'/photographer/orders/flow?workspace=print&pbEntryDone=lab'],[1366,'/photographer/orders/flow?workspace=print&pbLabChooser=1'],[1366,'/equipment-rental/book'],[390,'/photographer/gallery']]){
      const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',async request=>{
        const url=new URL(request.request().url());
        if(url.pathname.startsWith('/api/')){
          let result={};
          if(url.pathname==='/api/auth/me')result={user:{id:'customer',userId:'customer',labRole:'customer',platformRole:'user',name:'Test',mobile:'09120000000',photographerAvatarData:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII='},lab:{id:'lab',name:'Lab'}};
          if(url.pathname==='/api/customer/home')result={lab:{id:'lab',name:'Lab',album_enabled:false},customer:{id:'customer',name:'Test'},status:{open:true},walletBalance:42,orders:[],prices:[],papers:[],sizes:[],counts:{flow:0,ready:0,completed:0,needs_fix:0},settings:{}};
          if(url.pathname==='/api/customer/labs')result={memberships:[{id:'lab',name:'Lab'}]};
          if(url.pathname==='/api/customer/orders')result={labId:'lab',orders:[]};
          if(url.pathname==='/api/photographer/navigation-tabs')result={tabs:{ai:true,album:true,instagram:true}};
          return request.fulfill({json:result});
        }
        const target=url.pathname==='/equipment-rental/book'?'dist/api/equipment-rental-book.html':url.pathname==='/'||!path.extname(url.pathname)?'dist/web/index.html':'dist/web'+url.pathname;
        return fs.existsSync(target)?request.fulfill({path:path.resolve(target)}):request.fulfill({status:404,body:''});
      });
      await page.goto('https://panel.test'+route);
      const headerId=route.startsWith('/equipment')?'#photographerStoreRoleHeader':'#photographerRoleHeaderV710';
      await page.locator(headerId).waitFor({state:'attached'});
      if(width>820){
        await page.locator(headerId+' .pb1124Avatar img').waitFor();
        const boxes=await page.locator(headerId).evaluate(header=>{
          const rect=selector=>{const bounds=(selector?header.querySelector(selector):header).getBoundingClientRect();return {x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}};
          return {header:rect(),identity:rect('.photographerHeaderIdentity'),nav:rect('.photographerHeaderNav'),actions:rect('.pb1124PrimaryActions'),secondary:rect(header.id==='photographerStoreRoleHeader'?'.pb1125SecondaryActions':'.photographerHeaderTools,.photographerPrintModeUtilityCluster')};
        });
        assert.equal(boxes.header.height,114);
        assert.equal(boxes.header.y,0,'header must touch the top of the viewport');
        if(route.startsWith('/equipment')){assert.equal((await page.locator('#storePhotographerWorkspace>.shell').boundingBox()).y,114);await page.evaluate(()=>document.body.classList.remove('pbR96ChoosingStore'));const back=await page.locator('#pbR1123StoreBack').boundingBox();assert(back.y>=72&&back.y+back.height<=114);assert.equal(back.x,22);assert.equal(await page.locator('#photographerStoreIdentityBar').isVisible(),false);assert.equal(await page.locator('#storeSectionNavV673').isVisible(),false);assert.equal(await page.locator(headerId+' .photographerHomeModeNav').isVisible(),false);const storeNav=await page.locator('#pbR1123StoreDesktopNav').boundingBox();assert(storeNav.y<72);assert(storeNav.x>boxes.actions.x+boxes.actions.width);assert(storeNav.x+storeNav.width<boxes.identity.x);}
        if(route.includes('pbLabChooser=1')){await page.locator('#pbR99LabChooser').waitFor();assert.equal((await page.locator('#pbR99LabChooser').boundingBox()).y,114);assert(await page.evaluate(()=>document.elementFromPoint(innerWidth-30,30).closest('#photographerRoleHeaderV710')!==null));}
        assert(boxes.identity.x>boxes.nav.x+boxes.nav.width,'identity belongs on the right');
        assert(boxes.actions.x+boxes.actions.width<boxes.nav.x,'wallet and exit belong on the left');
        assert(boxes.secondary.y>=boxes.header.y+72,'secondary actions belong under the fade line');
        assert.match(await page.locator('.pb1124Wallet').innerText(),/کیف پول/);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'desktop header must not cause horizontal overflow');
      }else{
        assert.equal(await page.locator('.pb1124Avatar,.pb1124PrimaryActions').count(),0,'desktop decoration must not mount on mobile');
      }
      assert.deepEqual(errors,[]);
      await page.close();
    }
  }finally{await browser.close()}
});

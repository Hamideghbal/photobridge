const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('photographer desktop header aligns identity, navigation and actions while mobile stays untouched',async()=>{
  const {chromium}=require('playwright');
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    for(const [width,route] of [[1366,'/photographer/gallery'],[1024,'/photographer/gallery'],[1366,'/photographer/orders/flow?workspace=print&pbEntryDone=lab'],[1366,'/photographer/orders/flow?workspace=print&pbLabChooser=1'],[1366,'/equipment-rental/book'],[1366,'/photographer/gallery?pbDesktopPanel=store'],[390,'/photographer/gallery']]){
      const page=await browser.newPage({viewport:{width,height:900},isMobile:width<=820,hasTouch:width<=820,serviceWorkers:'block'});
      await page.addInitScript(()=>{window.pb1126EarlyPaint=[];function sample(){for(const h of document.querySelectorAll('#photographerRoleHeaderV710,#photographerStoreRoleHeader')){if(getComputedStyle(h).display!=='none'&&getComputedStyle(h).visibility!=='hidden'&&innerWidth>820)window.pb1126EarlyPaint.push(h.id);}requestAnimationFrame(sample)}requestAnimationFrame(sample)});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',async request=>{
        const url=new URL(request.request().url());
        if(url.pathname.startsWith('/api/')){
          let result={};
          if(url.pathname==='/api/auth/me')result={user:{id:'customer',userId:'customer',labRole:'customer',platformRole:'user',name:'Test',mobile:'09120000000',photographerAvatarData:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nGQAAAAASUVORK5CYII='},lab:{id:'lab',name:'Lab'}};
          if(url.pathname==='/api/customer/home')result={lab:{id:'lab',name:'Lab',album_enabled:true},customer:{id:'customer',name:'Test'},status:{open:true},walletBalance:42,orders:[],prices:[],papers:[],sizes:[],counts:{flow:0,ready:0,completed:0,needs_fix:0},settings:{}};
          if(url.pathname==='/api/customer/labs')result={memberships:[{id:'lab',name:'Lab'}]};
          if(url.pathname==='/api/customer/equipment-rental/shops')result={shops:[{id:'shop',name:'Store',connected:true}]};
          if(url.pathname==='/api/customer/orders')result={labId:'lab',orders:[]};
          if(url.pathname==='/api/photographer/navigation-tabs'){await new Promise(resolve=>setTimeout(resolve,150));result={tabs:{ai:false,album:false,instagram:false}};}
          return request.fulfill({json:result});
        }
        const target=url.pathname==='/equipment-rental/book'?'dist/api/equipment-rental-book.html':url.pathname==='/'||!path.extname(url.pathname)?'dist/web/index.html':'dist/web'+url.pathname;
        return fs.existsSync(target)?request.fulfill({path:path.resolve(target)}):request.fulfill({status:404,body:''});
      });
      await page.goto('https://panel.test'+route);
      if(width>820){
        const header=page.locator('#pb1126DesktopHeader');
        await header.locator('.pb1124Avatar img').waitFor();
        const geometry=await header.evaluate(h=>{
          const rect=s=>{const b=(s?h.querySelector(s):h).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}};
          return {header:rect(),identity:rect('.photographerHeaderIdentity'),nav:rect('.pb1126MainNav'),actions:rect('.pb1124PrimaryActions'),secondary:rect('.pb1126Secondary')};
        });
        const chooser=route.includes('pbLabChooser=1')||route.includes('equipment-rental/book')||route.includes('pbDesktopPanel=store');
        assert.equal(geometry.header.height,chooser?72:114);
        assert.equal(geometry.header.y,0);
        assert.equal(await header.locator('.photographerHeaderIdentity h1').evaluate(el=>getComputedStyle(el).fontSize),'16px');
        assert(geometry.identity.x>geometry.nav.x+geometry.nav.width);
        assert(geometry.actions.x+geometry.actions.width<geometry.nav.x);
        if(chooser)assert.equal(await header.locator('.pb1126Secondary').isVisible(),false);else assert(geometry.secondary.y>=72);
        assert.deepEqual(await header.locator('.pb1126MainNav button').allTextContents(),['چاپ','گالری','فروشگاه']);
        assert.equal(await page.locator('#photographerRoleHeaderV710').isVisible(),false);
        if(route.includes('pbEntryDone=lab'))await page.locator('.chatDock').waitFor();
        else assert.equal(await page.locator('.chatDock').isVisible(),false,'chat is hidden outside an entered Lab');
        if(route.includes('pbLabChooser=1')){
          await page.locator('#pbR99LabChooser').waitFor();
          assert.equal((await page.locator('#pbR99LabChooser').boundingBox()).y,72);
        }
        if(route.includes('pbEntryDone=lab')){
          const utilities=header.locator('.pb1127PrintUtilities');
          await utilities.waitFor();
          await header.locator('.pb1127PrintModes').waitFor();
          assert.deepEqual((await header.locator('.pb1127PrintModes button').allTextContents()).map(t=>t.trim()),['چاپ عکس','صحافی آلبوم']);
          assert.deepEqual((await utilities.locator('button').allTextContents()).map(t=>t.trim()),['مالی','آرشیو']);
          assert.equal(await header.locator('.pb1126Back,.photographerPrintModeBack').count(),0,'entered Lab has no Back action');
          assert((await utilities.boundingBox()).x<(await header.locator('.pb1127PrintModes').boundingBox()).x);
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        if(route==='/photographer/gallery'&&width===1366){
          // Sample every painted frame, including cold panel loads and settings refresh.
          await page.evaluate(()=>{
            window.pb1126Samples=[];window.pb1126Header=document.querySelector('#pb1126DesktopHeader');
            function sample(){const h=document.querySelector('#pb1126DesktopHeader');const native=document.querySelector('#photographerRoleHeaderV710');window.pb1126Samples.push({same:h===window.pb1126Header,y:h?.getBoundingClientRect().y,labels:[...h.querySelectorAll('.pb1126MainNav button')].filter(b=>getComputedStyle(b).display!=='none').map(b=>b.textContent),native:native&&getComputedStyle(native).display!=='none'});window.pb1126Sampling=requestAnimationFrame(sample)}sample();
          });
          const identity=await header.locator('.photographerHeaderIdentity h1').innerText();
          let chooserGeometry;
          const positions=await header.locator('.pb1126MainNav button').evaluateAll(bs=>bs.map(b=>({x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width})));
          for(const key of ['store','gallery','print','gallery','store','print','gallery']){
            await header.locator('[data-pb1126-kind="'+key+'"]').click();
            await page.waitForFunction(key=>document.querySelector('#pb1126DesktopHeader .pb1126MainNav .active')?.dataset.pb1126Kind===key,key);
            if(key!=='gallery'){
              const frame=page.frameLocator('.pb1126ContentPanel:not([hidden]) iframe');
              await frame.locator(key==='store'?'#photographerStoreRoleHeader':'#pbR99LabChooser').waitFor({state:'attached'});
              assert.equal(await frame.locator(key==='store'?'#photographerStoreRoleHeader':'#photographerRoleHeaderV710').isVisible(),false);
              await page.evaluate(()=>Promise.all([...document.querySelectorAll('.pb1126ContentPanel iframe')].flatMap(el=>el.getAnimations()).map(a=>a.finished.catch(()=>{}))));
              await frame.locator('body').evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
              const intro=frame.locator(key==='store'?'.pbR96StoreChooserHead':'.pbR99LabIntro');await intro.waitFor();
              const box=await intro.boundingBox();
              assert.equal(box.y,92,'chooser introduction has a 20px gap below the main header');
              assert.equal(box.height,176);assert.equal(box.width,760);
              const design=await intro.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundImage,shadow:s.boxShadow,radius:s.borderRadius}});
              if(chooserGeometry)assert.deepEqual({box,design},chooserGeometry,'Store and Lab chooser introductions match exactly');else chooserGeometry={box,design};
              if(key==='print')assert.equal(await frame.locator('.chatDock').isVisible(),false,'Lab chooser has no chat');
              assert.equal((await frame.locator(key==='store'?'#storePhotographerWorkspace>.shell':'#pbR99LabChooser').boundingBox()).y,72,'embedded content starts immediately below the shared header');
            }
            await page.evaluate(()=>Promise.all(document.querySelector('#pb1126DesktopHeader').getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
            assert.equal(await header.locator('.photographerHeaderIdentity h1').innerText(),identity);
            assert.equal(await header.locator('.photographerHeaderIdentity h1').evaluate(el=>getComputedStyle(el).fontSize),'16px','name size remains identical across tabs');
            assert.deepEqual(await header.locator('.pb1126MainNav button').evaluateAll(bs=>bs.map(b=>({x:b.getBoundingClientRect().x,y:b.getBoundingClientRect().y,width:b.getBoundingClientRect().width}))),positions);
          }
          assert.equal(await page.locator('.pb1126ContentPanel').count(),2,'panels must be reused');
          const switchTime=await page.evaluate(()=>{const start=performance.now();document.querySelector('[data-pb1126-kind="store"]').click();return {elapsed:performance.now()-start,animated:document.querySelector('.pb1126ContentPanel:not([hidden]) iframe').contentDocument.getAnimations().some(a=>a.effect.getTiming().duration===240)}});assert(switchTime.animated,'warm panel content animates');assert(switchTime.elapsed<250,'a warm tab switch must not wait for a document load');
          await header.locator('[data-pb1126-kind="store"]').click();
          await page.goBack();
          await page.waitForFunction(()=>!document.querySelector('.pb1126ContentPanel:not([hidden])'));
          const samples=await page.evaluate(()=>{cancelAnimationFrame(window.pb1126Sampling);return window.pb1126Samples});
          assert(samples.length>10);
          assert(samples.every(s=>s.same&&s.y===0&&!s.native&&JSON.stringify(s.labels)===JSON.stringify(['چاپ','گالری','فروشگاه'])),'every painted frame must retain only the configured shared header');
          await page.setViewportSize({width:1366,height:720});
          await header.locator('[data-pb1126-kind="store"]').click();
          const store=page.frameLocator('.pb1126ContentPanel:not([hidden]) iframe');
          await store.locator('[data-enter-store-r96="shop"]').click();
          await page.waitForFunction(()=>!document.documentElement.classList.contains('pb1127Choosing'));
          assert.equal(await header.locator('.pb1126Back,.photographerPrintModeBack').count(),0,'entered Store has no Back action');
          assert.equal((await header.boundingBox()).height,114);
          assert.equal(await store.locator('#storePanel .storeHomeActionsV671').isVisible(),false);
          assert.equal(await store.locator('#equipmentPanel').isVisible(),true);
          assert.equal(await header.locator('.pb1126Secondary .active').innerText(),'اجاره تجهیزات');
          assert.equal(await header.locator('[data-store-panel="bookingsPanel"]').innerText(),'آفیش‌های من');
          const calendar=store.locator('#pbR63RentalCalendar');await calendar.waitFor();
          await calendar.locator('[data-next]').click();
          assert((await calendar.boundingBox()).height<390);
          assert(await store.locator('#storePhotographerWorkspace>.shell').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'rental calendar fits a laptop window without scrolling');
          assert(await calendar.evaluate(el=>el.scrollHeight<=el.clientHeight+1&&el.scrollWidth<=el.clientWidth+1));
          const days=calendar.locator('[data-date]:not([disabled])');
          const startDate=await days.nth(0).getAttribute('data-date');
          const endDate=await days.nth(1).getAttribute('data-date');
          await calendar.locator('[data-date="'+startDate+'"]').click();
          await calendar.locator('[data-date="'+endDate+'"]').click();
          assert.equal(await calendar.locator('.edge').count(),2);
          await calendar.locator('.pbR63OfficeBtn').click();
          assert(await store.locator('#start').inputValue());
          assert(await store.locator('#end').inputValue());
          await header.locator('.pb1126Secondary>button').first().click();
          assert((await header.locator('.pb1126Secondary').boundingBox()).y>=72);
          await header.locator('[data-pb1126-kind="gallery"]').click();
          const intro=page.locator('.clientGalleryIntroHeader');await intro.waitFor();
          assert((await intro.boundingBox()).height<165,'desktop gallery introduction stays compact');
          await header.locator('.settingsIconBtn').click();
          const settings=page.locator('.standalonePhotographerSettings');await settings.waitFor();
          assert.deepEqual(await settings.locator('.settingsNav button').allTextContents(),['وضعیت حساب','موقعیت عکاسی','دعوت همکار']);
          assert.equal(await settings.getByText('تعرفه',{exact:true}).count(),0);
          assert.equal(await page.locator('.chatDock').isVisible(),false,'Gallery settings do not expose laboratory chat');
          await settings.getByRole('button',{name:'وضعیت حساب',exact:true}).click();
          await settings.getByText('حساب پرداخت به میزان مصرف',{exact:true}).waitFor();
          await header.locator('[data-pb1126-kind="print"]').click();
          const lab=page.frameLocator('.pb1126ContentPanel:not([hidden]) iframe');
          await lab.locator('[data-select="lab"]').click();
          await lab.locator('.chatDock').waitFor();
          assert(await lab.locator('.chatDock').isVisible(),'chat becomes available after entering the selected laboratory');
          await header.locator('[data-pb1126-kind="gallery"]').click();
          assert.equal(await page.locator('.chatDock').isVisible(),false);
        }
      }else{
        await page.locator('#photographerRoleHeaderV710').waitFor({state:'attached'});
        assert.equal(await page.locator('#pb1126ChromeHost,.pb1126ContentPanel,.pb1124Avatar,.pb1124PrimaryActions').count(),0,'desktop shell must not mount on mobile');
      }
      if(width>820)assert.deepEqual(await page.evaluate(()=>window.pb1126EarlyPaint),[],'legacy headers must never paint, even at startup');
      assert.deepEqual(errors,[]);
      await page.close();
    }
  }finally{await browser.close()}
});

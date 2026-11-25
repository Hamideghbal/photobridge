const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const shop={id:'10000000-0000-4000-8000-000000000001',name:'SS قاب',business_category:'frame_chassis',active:true,rental_enabled:false,sale_enabled:true,connected:false,canRent:false,canBuy:true,province:'تهران',city:'تهران'};
const items=['#ef4444','#2563eb'].flatMap((color,c)=>[[13,18,100],[20,30,250]].map(([widthCm,heightCm,price],i)=>({id:'50000000-0000-4000-8000-'+String(c*2+i+1).padStart(12,'0'),title:'مدرن',model:'مدرن',category:'frame_custom',category_label:'قاب',active:true,stock_total:1,sale_price:price,image_url:'http://photobridge.test/'+color.slice(1)+'-first.jpg',image_urls:['http://photobridge.test/'+color.slice(1)+'-first.jpg','http://photobridge.test/'+color.slice(1)+'-second.jpg'],image_count:2,variant_specs:{baseId:'40000000-0000-4000-8000-000000000001',baseModel:'مدرن',material:'چوب',color,widthCm,heightCm,thicknessMm:5,sizeOnly:true,modelColors:['#ef4444','#2563eb'],colorIndependent:true}})));
// The desktop shell retains multiple panels; scope interactions to the store iframe.
async function openStore(page,embedded=true,desktopHost=false,parent=false,shopRecord=shop){const requests=[];await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='photobridge.test')return route.fulfill({body:'',contentType:'text/css'});if(url.pathname.endsWith('.jpg'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="'+(url.pathname.includes('ef4444')?'red':'blue')+'"/></svg>'});if(url.pathname.startsWith('/api/')){requests.push({path:url.pathname,method:route.request().method()});const data=url.pathname==='/api/photographer/navigation-tabs'?{tabs:{ai:false,album:false,instagram:false}}:url.pathname==='/api/auth/me'?{user:{id:'20000000-0000-4000-8000-000000000001',name:'عکاس',photographerName:'عکاسی عکاسی آتلیه نام طولانی برای بررسی هدر',mobile:'09125678720',labRole:'customer',photographerEnabled:true},photographer:{studio_name:'عکاس'}}:url.pathname==='/api/customer/equipment-rental/shops'?{shops:[shopRecord],scoped:false}:url.pathname.endsWith('/select')?{ok:true,shop:shopRecord,connected:false}:url.pathname==='/api/customer/equipment-rental/sale-items'?{items,shop:{...shopRecord,production:true,walletCheckoutEnabled:false}}:url.pathname==='/api/customer/equipment-rental/sale-orders'?{orders:[{id:'60000000-0000-4000-8000-000000000001',shop_id:shop.id,production_specs:{title:'مدرن'},item_title:'مدرن',status:'confirmed',quantity:2,total_amount:500,created_at:'2026-10-14',production_stage:'in_production',delivery_method:'courier',expected_ready_date:'2026-10-16',expected_delivery_date:'2026-10-18',payment_status:'unpaid'}]}:url.pathname.includes('services-wallet')?{balance:1000}:url.pathname.includes('notifications')?{notifications:[],unread:0}:url.pathname.includes('accounting')?{summary:{},entries:[],invoices:[],payments:[]}:url.pathname.includes('bookings')?{bookings:[]}:url.pathname.includes('collaboration')?{requests:[]}:url.pathname.includes('/items')?{items:[]}:{ok:true};return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});}const file=url.pathname==='/equipment-rental/book'?path.resolve('dist/api/equipment-rental-book.html'):url.pathname.startsWith('/photographer/')?path.resolve('dist/web/index.html'):path.join(process.cwd(),'dist/web',decodeURIComponent(url.pathname));if(fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'});return route.fulfill({status:404,body:''});});await page.goto(parent?'http://photobridge.test/photographer/gallery?pbDesktopPanel=store':'http://photobridge.test/equipment-rental/book?pbEmbeddedStore=1'+(embedded?'&pbDesktopContent=1':'')+(desktopHost?'&pbDesktopFrameStore=1':''));const storePage=parent?page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]'):page;await storePage.locator('[data-enter-store-r96]').waitFor();await storePage.locator('[data-enter-store-r96]').click();if(shopRecord.business_category==='frame_chassis')await storePage.locator('.frameProductCard').waitFor();else await storePage.locator('#photographerStoreIdentityBar.ready').waitFor({state:'attached'});return requests;}
// Mobile runs as a standalone store, without desktop iframe content flags.
for(const width of [1440,390])test('full photographer frame store: compact cards, inline galleries, frame menus and one store name at '+width,async()=>{const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await openStore(page,width>820);}catch(error){console.log('FRAME BOOT DEBUG',width,await page.evaluate(()=>({url:location.href,body:document.body.className,text:document.body.innerText.slice(-1800)})),errors);await page.screenshot({path:'/tmp/r1216-mobile-failure-'+width+'.png'});throw error;}const card=page.locator('.frameProductCard');assert.equal(await card.count(),1);
 await page.evaluate(()=>{
  window.__pbPhotoOriginal=document.querySelector('.frameProductCard .saleItemPhoto');
  window.__pbCardOriginal=document.querySelector('.frameProductCard');
  window.__pbPhotoRemovals=0;
  new MutationObserver(records=>{for(const r of records)for(const node of r.removedNodes){
   if(node===window.__pbPhotoOriginal||node===window.__pbCardOriginal||node.querySelector?.('.saleItemPhoto')===window.__pbPhotoOriginal)window.__pbPhotoRemovals++;
  }}).observe(document.getElementById('saleItems'),{childList:true,subtree:true});
  renderSales();renderSales();  // periodic wallet/order updates must preserve the real image.
 });
 assert.equal(await page.evaluate(()=>document.querySelector('.frameProductCard')===window.__pbCardOriginal),true);
 assert.equal(await page.evaluate(()=>document.querySelector('.frameProductCard .saleItemPhoto')===window.__pbPhotoOriginal),true);
 assert.equal(await page.evaluate(()=>window.__pbPhotoRemovals),0,'refresh must not recreate gallery photo nodes');
 assert.equal(await card.locator('.frameToman,.frameMoney').count(),0,'decorative broken تومان must be removed');
 assert((await card.locator('.saleItemPrice').textContent()).includes('تومان'),'price must be plain تومان text');
 if(width===390){await page.evaluate(()=>{
  const h=document.getElementById('storePhotographerName');
  window.__pbHeaderStyleEvents=[];
  new MutationObserver(rs=>{for(const r of rs)window.__pbHeaderStyleEvents.push({kind:r.type,attr:r.attributeName,text:r.target.textContent||'',style:r.target.getAttribute('style')||''});})
   .observe(h,{attributes:true,attributeFilter:['style'],childList:true,characterData:true,subtree:true});
  window.__pbHeaderBefore={font:getComputedStyle(h).fontSize,name:h.textContent};
 });}assert.equal(await page.locator('#frameCustomerNav').isVisible(),true);const menuLabels=await page.locator('#frameCustomerNav button').allTextContents();assert.deepEqual(menuLabels.slice(0,2),['فروشگاه','مالی']);assert.equal(menuLabels[2],'سفارش‌ها');assert.equal(menuLabels[3],'سوابق خرید');assert(menuLabels[4].includes('سبد خرید'));assert.equal(await page.locator('#frameCustomerNav #saleCategoryBtnR68').isVisible(),false);assert.equal(await page.locator('#saleBrandBtnR68').isVisible(),false,'frame brand must stay hidden');assert.equal(await page.locator('[data-store-panel=bookingsPanel]').first().isVisible(),false);assert.equal(await page.locator('#rentalCartBtnV810').isVisible(),false);assert.equal(await page.locator('#saleCartBtn').isVisible(),false,'only the new toolbar cart is shown');
 const embedded=await page.evaluate(()=>document.documentElement.classList.contains('pb1126Embedded'));const name=page.locator('#photographerStoreHeaderName');assert.equal(await name.count(),1);assert.equal(await name.textContent(),shop.name);assert.equal(await name.evaluate(el=>getComputedStyle(el).textAlign),'center');assert.equal(await name.isVisible(),true,'store name must be visible directly below the native header');const header=await name.boundingBox(),nav=await page.locator('#frameCustomerNav').boundingBox();if(width<=820||embedded)assert(header.y+header.height<=nav.y+1);else {assert(header.y+header.height<=nav.y+1,'desktop store name should be above its centered navigation');assert.equal(await page.locator('#frameCustomerNav').evaluate(el=>el.parentElement.id),'storePhotographerWorkspace');const centered=await page.locator('#frameCustomerNav').evaluate(el=>{const controls=[...el.querySelectorAll('button[data-frame-customer-view],button[data-frame-customer-history]')].filter(b=>getComputedStyle(b).display!=='none');const rects=controls.map(b=>b.getBoundingClientRect());return {labels:controls.map(b=>b.textContent.trim()),offset:Math.abs((rects[0].left+rects[rects.length-1].right)/2-innerWidth/2),aligned:rects.every(r=>Math.abs(r.top-rects[0].top)<1),cart:getComputedStyle(el.querySelector('[data-frame-customer-cart]')).display};});assert.deepEqual(centered.labels,['فروشگاه','مالی','سفارش‌ها','سوابق خرید']);assert(centered.offset<3,'four desktop tabs must be centered');assert(centered.aligned);assert.notEqual(centered.cart,'none');}assert.equal(await page.locator('#pbR1123StoreDesktopNav>button:visible').count(),0,'old finance/rental buttons must be hidden');assert.equal(await page.locator('#photographerStoreIdentityBar [data-shop-category]').isVisible(),false);
 assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).boxShadow),'none');assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).backgroundImage),'none');if(width===390){const align=await page.evaluate(()=>Math.abs(document.getElementById('photographerStoreRoleHeader').getBoundingClientRect().bottom-document.getElementById('photographerStoreIdentityBar').getBoundingClientRect().top));assert(align<2,'studio/store separators must share the same physical boundary');assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el,'::before').display),'none');assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el,'::after').display),'none');}else{assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el,'::before').display),'none');assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).boxShadow),'none');if(!embedded){assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).display),'none','Windows title strip sits directly below the header');assert.equal(await page.locator('#pbR1123StoreDesktopNav').isVisible(),false,'redundant Windows header buttons are removed');}else{assert.notEqual(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).display),'none','embedded Windows must keep its own title strip');}}assert.match(await page.locator('#storePhotographerWorkspace>.shell').evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/,'blue wash must be painted on visible scrolling content');if(width===390)assert.equal(await page.locator('#storePhotographerWorkspace>.shell').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(245, 247, 251)');if(width!==390)assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el,'::before').display),'none');
 const cartColor=await page.locator('[data-frame-customer-cart]').evaluate(el=>getComputedStyle(el).backgroundColor);assert.equal(cartColor,width>820?'rgb(238, 240, 243)':'rgb(245, 158, 11)');
 if(width===390){
  const navStyle=await page.locator('#frameCustomerNav').evaluate(el=>({background:getComputedStyle(el).backgroundColor,image:getComputedStyle(el).backgroundImage,shadow:getComputedStyle(el).boxShadow,glow:getComputedStyle(el,'::before').backgroundImage}));
  assert.equal(navStyle.background,'rgba(0, 0, 0, 0)','navigation sits transparently over the shared gradient');
  assert.equal(navStyle.image,'none','the gradient belongs to the surface below the store title');
  assert.equal(navStyle.shadow,'none','tabs themselves remain shadowless');assert.equal(await page.locator('#storePhotographerWorkspace>.shell').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px','a dark separator belongs immediately under the second header');
  assert.equal(await page.locator('#frameCustomerNav').evaluate(el=>getComputedStyle(el,'::before').display),'none','strong custom blue glow removed');
  const tabs=await page.locator('#frameCustomerNav button:visible:not([data-frame-customer-cart])').evaluateAll(nodes=>nodes.map(el=>({opacity:getComputedStyle(el).opacity,background:getComputedStyle(el).backgroundColor})));
  assert(tabs.length>=3);
  for(const tab of tabs){assert.equal(tab.opacity,'1','tab must be fully opaque');assert.equal(tab.background,'rgb(255, 255, 255)','tab itself stays solid white')}
  assert.equal(await page.locator('#photographerStoreRoleHeader').evaluate(el=>getComputedStyle(el).borderBottomWidth),'1px','missing divider between photographer header and store title');
  assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','avoid a doubled divider');
 }
 if(width===390){assert.equal(await page.locator('#photographerStoreRoleHeader').evaluate(el=>getComputedStyle(el,'::after').display),'none','shared shadow belongs below the shop identity');assert.equal(await page.locator('#frameCustomerCategoryRow').count(),0,'standalone category row is removed');
 if(width===390){const mobileSurface=await page.evaluate(()=>({nav:getComputedStyle(document.querySelector('#frameCustomerNav')).backgroundImage,shell:getComputedStyle(document.querySelector('#storePhotographerWorkspace>.shell')).backgroundImage,workspace:getComputedStyle(document.querySelector('#storePhotographerWorkspace')).backgroundImage,container:getComputedStyle(document.querySelector('#salesPanel>.box')).backgroundColor,containerBorder:getComputedStyle(document.querySelector('#salesPanel>.box')).borderTopWidth,card:getComputedStyle(document.querySelector('.frameProductCard')).backgroundColor,history:getComputedStyle(document.querySelector('[data-frame-customer-history]')).display,navButton:getComputedStyle(document.querySelector('#frameCustomerNav button')).backgroundColor}));assert.equal(mobileSurface.nav,'none','mobile tabs remain transparent above the fade');assert(mobileSurface.shell.includes('linear-gradient'),'catalog background must visibly fade from blue to the page color');assert(mobileSurface.workspace.includes('linear-gradient'),'the mobile background fades from blue to white');assert.equal(mobileSurface.container,'rgba(0, 0, 0, 0)','large white catalog wrapper should be absent');assert.equal(mobileSurface.containerBorder,'0px');assert.equal(mobileSurface.card,'rgb(255, 255, 255)');assert.equal(mobileSurface.navButton,'rgb(255, 255, 255)');assert.equal(mobileSurface.history,'none');
 const dockFit=await page.evaluate(()=>{const shell=document.querySelector('#storePhotographerWorkspace>.shell').getBoundingClientRect(),dock=document.querySelector('#photographerStoreBottomNav').getBoundingClientRect(),workspace=getComputedStyle(document.querySelector('#storePhotographerWorkspace'));return {gap:dock.height>0?Math.abs(shell.bottom-dock.top):Math.abs(shell.bottom-innerHeight),dockHidden:dock.height===0,width:shell.width,viewport:innerWidth,cssBottom:getComputedStyle(document.querySelector('#storePhotographerWorkspace>.shell')).bottom,backgroundImage:workspace.backgroundImage}});
 assert(dockFit.gap<=3,'blue catalog must reach bottom dock without blank gap: '+JSON.stringify(dockFit));
 assert(dockFit.width>=dockFit.viewport-1,'mobile catalog must use full viewport width');
 assert(dockFit.backgroundImage.includes('linear-gradient'));
}
 const buttons=await page.locator('#frameCustomerNav').evaluate(el=>{const r=q=>el.querySelector(q).getBoundingClientRect();return {store:r('[data-frame-customer-view=salesPanel]').top,finance:r('[data-frame-customer-view=financePanel]').top,cart:r('[data-frame-customer-cart]').top,category:document.querySelector('#saleCategoryBtnR68').getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom};});assert.equal(buttons.store,buttons.finance);assert.equal(await page.locator('#saleCategoryBtnR68').isVisible(),false,'frame category is hidden');const cardBounds=await page.locator('.frameProductCard').boundingBox();assert(cardBounds.y>=buttons.bottom);await page.waitForFunction(()=>getComputedStyle(document.getElementById('storePhotographerName')).whiteSpace==='normal',{timeout:5000});assert.equal(await page.locator('#storePhotographerName').evaluate(el=>getComputedStyle(el).textOverflow),'clip');assert.equal(await page.locator('#storePhotographerName').textContent(),'عکاسی آتلیه نام طولانی برای بررسی هدر');const centered=await name.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();const bar=document.getElementById('photographerStoreIdentityBar').getBoundingClientRect();return Math.abs((r.left+r.right)/2-(bar.left+bar.right)/2)<3;});if(!centered){console.log('STORE TITLE GEOMETRY',await name.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const n=range.getBoundingClientRect(),bar=document.getElementById('photographerStoreIdentityBar').getBoundingClientRect();return {text:{left:n.left,right:n.right},bar:{left:bar.left,right:bar.right},viewport:innerWidth,client:document.documentElement.clientWidth};}));await page.screenshot({path:'/tmp/r1216-mobile-center-debug.png'});}assert(centered);}

 const geometry=await card.evaluate(el=>{const size=el.querySelector('.frameSizeTrigger')?.getBoundingClientRect(),select=el.querySelector('[data-frame-choice=size]').getBoundingClientRect(),buy=el.querySelector('[data-add-sale-cart]').getBoundingClientRect();const chosen=size?.height?size:select;return {bottomGap:Math.abs(chosen.bottom-buy.bottom),sideBySide:chosen.right<=buy.left+1||buy.right<=chosen.left+1,photo:el.querySelector('.saleItemPhoto').getBoundingClientRect().height};});assert(geometry.bottomGap<2,'size and add-to-cart should align: '+JSON.stringify(geometry));assert(geometry.sideBySide);assert(geometry.photo<=151);const purchase=await card.evaluate(el=>{const r=q=>el.querySelector(q).getBoundingClientRect(),select=el.querySelector('.frameSizeTrigger'),size=select&&getComputedStyle(select).display!=='none'?select.getBoundingClientRect():r('[data-frame-choice=size]'),add=r('[data-add-sale-cart]'),qty=r('.qtyStepperV810'),price=r('.saleItemPrice');return {sizeHeight:size.height,addHeight:add.height,qtyWidth:qty.width,qtyBelow:qty.top>=size.bottom,qtyUnderSize:qty.left>=size.left-1&&qty.right<=size.right+1,priceBelow:price.top>=add.bottom,priceUnderAdd:price.left>=add.left-1&&price.right<=add.right+1};});assert(Math.abs(purchase.sizeHeight-purchase.addHeight)<1,JSON.stringify(purchase));assert(purchase.qtyWidth<=97,JSON.stringify(purchase));assert(purchase.qtyBelow&&purchase.qtyUnderSize&&purchase.priceBelow&&purchase.priceUnderAdd,JSON.stringify(purchase));
 await card.locator('.framePhotoViewport').scrollIntoViewIfNeeded();assert.equal(await card.locator('.framePhotoViewport').evaluate(el=>getComputedStyle(el).scrollbarWidth),'none');assert.equal(await card.locator('.framePhotoDot').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.equal(await card.locator('.saleItemPhoto').count(),2);assert.equal(await card.locator('.framePhotoDot').count(),2);assert.equal(await card.locator('.framePhotoDot[aria-current="true"]').count(),1);assert.equal(await card.locator('[data-frame-photo-step="-1"]').textContent(),'‹');assert.equal(await card.locator('[data-frame-photo-step="1"]').textContent(),'›');assert.equal(await card.locator('[data-frame-photo-step="1"]').evaluate(el=>getComputedStyle(el).direction),'ltr');await card.locator('[data-frame-photo-step="1"]').click();await page.waitForFunction(()=>document.querySelector('.framePhotoViewport').scrollLeft>50);await page.waitForFunction(()=>document.querySelector('.framePhotoDot[data-frame-photo-dot="1"]')?.getAttribute('aria-current')==='true');await card.locator('.framePhotoDot[data-frame-photo-dot="0"]').click();await page.waitForFunction(()=>document.querySelector('.framePhotoViewport').scrollLeft<50);assert.equal(await page.locator('#pb834ShopGallery').evaluate(el=>el.classList.contains('open')),false);await card.locator('[data-frame-gallery-index="1"]').click();await page.locator('#pb834ShopGallery.open').waitFor();await page.waitForFunction(()=>document.querySelector('#pb834ShopGalleryStage img')?.getAttribute('src')?.endsWith('second.jpg'));
 assert.equal(await page.locator('#pb834ShopGalleryStage .pb834ShopGalleryNav.prev').textContent(),'‹');
 assert.equal(await page.locator('#pb834ShopGalleryStage .pb834ShopGalleryNav.next').textContent(),'›');
 const galleryBounds=await page.locator('#pb834ShopGalleryStage').evaluate(el=>({prev:el.querySelector('.prev').getBoundingClientRect().left,next:el.querySelector('.next').getBoundingClientRect().left}));
 assert(galleryBounds.prev<galleryBounds.next,'previous image arrow must be on the physical left');
 await page.evaluate(()=>{window.__pbLargeGalleryImg=document.querySelector('#pb834ShopGalleryStage img')});
 await page.locator('#pb834ShopGalleryStage .pb834ShopGalleryNav.next').click();
 await page.waitForFunction(()=>document.querySelector('#pb834ShopGalleryStage img')?.getAttribute('src')?.endsWith('first.jpg'));
 assert.equal(await page.evaluate(()=>document.querySelector('#pb834ShopGalleryStage img')===window.__pbLargeGalleryImg),true,'full-screen slide must keep one photo element');
 await page.locator('#pb834ShopGalleryStage .pb834ShopGalleryNav.prev').click();
 await page.waitForFunction(()=>document.querySelector('#pb834ShopGalleryStage img')?.getAttribute('src')?.endsWith('second.jpg'));
 assert.equal(await page.evaluate(()=>document.querySelector('#pb834ShopGalleryStage img')===window.__pbLargeGalleryImg),true,'reverse slide must keep the same photo element');
 assert(await page.locator('#pb834ShopGalleryTitle').evaluate(el=>getComputedStyle(el).whiteSpace==='nowrap'));await page.evaluate(()=>pb834CloseShopGallery());
 if(width===390){await card.locator('[data-frame-size-trigger]').click();await page.locator('#frameSizeSheet[role=dialog]').waitFor();assert((await page.locator('#frameSizeSheet').evaluate(el=>getComputedStyle(el).fontFamily)).includes('Vazirmatn'));await page.locator('#frameSizeSheet [data-frame-size-value="20×30"]').click();assert.equal(await card.locator('[data-frame-choice=size]').inputValue(),'20×30');const align=await card.evaluate(el=>{const a=el.querySelector('[data-add-sale-cart]').getBoundingClientRect(),b=el.querySelector('.frameSizeTrigger').getBoundingClientRect();return Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2);});assert(align<8,'add-to-cart and size should align: '+align);}else await card.locator('[data-frame-choice=size]').selectOption('20×30');assert((await card.locator('.saleItemPrice').textContent()).includes('۲۵۰'));await card.locator('[data-frame-color="#2563eb"]').click();if(width===390){const hdr=await page.evaluate(()=>{
 const h=document.getElementById('storePhotographerName');
 return {font:getComputedStyle(h).fontSize,name:h.textContent,styleEvents:window.__pbHeaderStyleEvents};
});assert.equal(hdr.name,(await page.evaluate(()=>window.__pbHeaderBefore.name)),'studio name unchanged after swatch click');assert.equal(hdr.font,(await page.evaluate(()=>window.__pbHeaderBefore.font)),'studio font size unchanged after swatch click');assert.equal(hdr.styleEvents.length,0,'frame header should not rewrite font/DOM when swatching: '+JSON.stringify(hdr.styleEvents));}await page.waitForFunction(()=>document.querySelector('.frameProductCard .saleItemPhoto')?.getAttribute('src')?.includes('2563eb'));
 assert.equal(await page.evaluate(()=>document.querySelector('.frameProductCard')===window.__pbCardOriginal),true,'swatch must preserve original product card');
 assert.equal(await page.evaluate(()=>document.querySelector('.frameProductCard .saleItemPhoto')===window.__pbPhotoOriginal),true,'swatch must preserve photo node');
 assert.equal(await page.evaluate(()=>window.__pbPhotoRemovals),0,'color change must not detach existing image nodes');
 assert.equal(await card.locator('[data-add-sale-cart]').textContent(),'افزودن به سبد خرید');await card.locator('[data-add-sale-cart]').click();await page.locator('[data-frame-customer-cart]').click();await page.locator('#saleCartDrawer.open').waitFor();assert((await page.locator('#saleCartLines').textContent()).includes('مدرن'));assert.equal(await page.locator('#saleCartCheckoutHint').textContent(),'');assert.equal(await page.locator('#salesCheckoutNotice').textContent(),'');assert.equal(await page.locator('#salesCheckoutNotice').isVisible(),false);
 await page.waitForFunction(()=>!document.getElementById('saleCartDrawer')?.classList.contains('frameCartMotionStart'));assert((await page.locator('#saleCartDrawer').evaluate(el=>getComputedStyle(el).transitionDuration))!=='0s','cart must animate open');assert.equal(await page.locator('#saleCartCheckout').isEnabled(),true);if(width===390){assert.equal(await page.locator('#saleCartCheckout').evaluate(el=>getComputedStyle(el).opacity),'1');assert((await page.locator('#saleCartCheckout').evaluate(el=>getComputedStyle(el).backgroundColor))!=='rgba(0, 0, 0, 0)');assert.equal(await page.locator('#photographerStoreIdentityBar').evaluate(el=>getComputedStyle(el,'::after').display),'none');}
 await page.waitForFunction(()=>{
  const drawer=document.getElementById('saleCartDrawer'),button=document.getElementById('saleCartCheckout'),r=drawer?.getBoundingClientRect(),b=button?.getBoundingClientRect();
  return !!r&&!!b&&r.left>=-1&&r.right<=innerWidth+1&&b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&!drawer.classList.contains('frameCartMotionStart');
 },{timeout:5000});
 const checkoutBox=await page.locator('#saleCartCheckout').boundingBox();
 assert(checkoutBox&&checkoutBox.x>=0&&checkoutBox.y>=0&&checkoutBox.x+checkoutBox.width<=width&&checkoutBox.y+checkoutBox.height<=900);
 await page.locator('#saleCartCheckout').click();
 await page.locator('#frameCheckoutDialog[role=dialog]').waitFor({timeout:3000});
 assert((await page.locator('#frameCheckoutDialog').evaluate(el=>getComputedStyle(el).fontFamily)).includes('Vazirmatn'));
 assert((await page.locator('#frameCheckoutDialog').evaluate(el=>getComputedStyle(el).direction))==='rtl');
 assert((await page.locator('#frameCheckoutDialog').textContent()).includes('تأیید ثبت سفارش'));
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#frameCheckoutDialog').count(),0);
 await page.locator('[data-frame-customer-cart]').click();
 await page.locator('#saleCartDrawer.open').waitFor({timeout:3000});
 await page.locator('#saleCartCheckout').click();
 await page.locator('#frameCheckoutDialog [data-frame-checkout-submit]').click();
 await page.locator('#frameCheckoutSuccess').waitFor({timeout:3000});
 assert((await page.locator('#frameCheckoutSuccess').textContent()).includes('سفارش ثبت شد'));
 assert.equal(await page.locator('#saleCartBackdrop').evaluate(el=>el.hidden),true);
 assert.equal(await page.locator('#saleCartDrawer').evaluate(el=>el.classList.contains('open')),false);

  await page.locator('[data-frame-customer-view=frameOrdersPanel]').click();assert(await page.locator('#frameOrdersPanel').evaluate(el=>el.classList.contains('mobileActive')));await page.locator('#frameOrdersPanel .frameOrderStepper').waitFor();assert((await page.locator('#frameOrdersPanel').textContent()).includes('در حال تولید'));assert((await page.locator('#frameOrdersPanel').textContent()).includes('آماده‌شدن'));assert.equal(await page.locator('#frameOrdersPanel .frameOrderStep').count(),5);
 await page.locator('[data-frame-customer-view=financePanel]').click();assert(await page.locator('#financePanel').evaluate(el=>el.classList.contains('mobileActive')));assert.equal(await page.locator('#financePanel [data-finance-tab-v811="payments"]').textContent(),'پرداختی‌ها');await page.evaluate(()=>{financeData={shop:{name:'قاب آزمایشی'},summary:{balance:-12345,invoiceTotal:0,paymentTotal:12345},entries:[{id:'test-ledger',entry_type:'payment',entry_date:'2026-10-14',amount:12345,direction:'credit',description:'پرداخت مشتری',reference_number:'TRACK-321',payment_method:'card'}],payments:[{description:'پرداخت مشتری',amount:12345,payment_method:'card',paid_at:'2026-10-14'}],invoices:[]};renderFinance()});await page.locator('#financePanel [data-finance-tab-v811="statement"]').click();await page.locator('#frameFinanceDetailsToggle').click();assert.equal(await page.locator('#frameFinanceDetailsToggle').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.frameLedgerDetailsRow').count(),1);assert((await page.locator('.frameLedgerDetailsRow').textContent()).includes('TRACK-321'));await page.locator('#frameFinanceDetailsToggle').click();assert.equal(await page.locator('.frameLedgerDetailsRow').count(),0);if(width>820){await page.locator('[data-frame-customer-history]').click();assert(await page.locator('#frameOrdersPanel').evaluate(el=>el.classList.contains('mobileActive')));assert.equal(await page.locator('#frameOrdersPanel .frameOrdersHead h2').textContent(),'سوابق خرید');await page.locator('[data-frame-customer-view=frameOrdersPanel]').click();assert.equal(await page.locator('#frameOrdersPanel .frameOrdersHead h2').textContent(),'سفارش‌های من');}await page.locator('[data-frame-customer-view=salesPanel]').click();assert(await page.locator('#salesPanel').evaluate(el=>el.classList.contains('mobileActive')));if(width===390){assert.equal(await page.locator('body.pbR96ChoosingStore').count(),0,'the upper Store tab keeps the current shop open');await page.evaluate(()=>document.querySelector('#photographerStoreBottomNav [data-store-home]').click());assert.equal(await page.locator('body.pbR96ChoosingStore').count(),1,'the bottom Store button opens the shop chooser');assert(await page.locator('#storeChooserPanelR96').isVisible());assert.equal(await page.locator('#frameCustomerNav').isVisible(),false);await page.locator('[data-enter-store-r96]').click();await page.locator('body:not(.pbR96ChoosingStore).frameCustomerStore').waitFor();await page.waitForFunction(()=>document.getElementById('salesPanel')?.classList.contains('mobileActive'));}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/tmp/r1216-mobile-'+width+'.png'});assert.deepEqual(errors,[]);
 await page.evaluate(()=>document.querySelector('#photographerStoreBottomNav [data-store-home]').click());assert.equal(await page.locator('body.pbR96ChoosingStore').count(),1);assert.equal(await page.locator('#storeChooserPanelR96').isVisible(),true);await page.evaluate(()=>{leaveStoreChooserR96();openStoreSection('salesPanel')});
 await page.evaluate(()=>{shops[0].business_category='equipment_rental_sale';saleShopConfig.production=false;syncPhotographerStoreIdentity();});assert.equal(await page.locator('#frameCustomerNav').isVisible(),false);assert.equal(await page.locator('#saleBrandBtnR68').isVisible(),true);if(width===390)await page.waitForFunction(()=>getComputedStyle(document.getElementById('storePhotographerName')).whiteSpace==='normal');
 }finally{await browser.close()}});



test('Windows frame store puts the shop name below the header and tabs below the name',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:1440,height:900}});await openStore(page,true);await page.evaluate(()=>{document.documentElement.classList.remove('pb1126Embedded');window.dispatchEvent(new Event('resize'))});
  const bounds=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect();const header=box('#photographerStoreRoleHeader'),title=box('#photographerStoreIdentityBar'),tabs=box('#frameCustomerNav'),content=box('#storePhotographerWorkspace>.shell');return {headerBottom:header.bottom,titleTop:title.top,titleBottom:title.bottom,tabsTop:tabs.top,tabsBottom:tabs.bottom,contentTop:content.top,host:getComputedStyle(document.getElementById('pbR1123StoreDesktopNav')).display,titleShadow:getComputedStyle(document.getElementById('photographerStoreIdentityBar')).boxShadow,titleGlow:getComputedStyle(document.getElementById('photographerStoreIdentityBar'),'::after').display,cart:getComputedStyle(document.querySelector('[data-frame-customer-cart]')).backgroundColor,name:document.getElementById('photographerStoreHeaderName').textContent.trim()}});
  assert.equal(bounds.host,'none','legacy finance and equipment buttons are removed from the header');assert.equal(bounds.name,shop.name);assert(Math.abs(bounds.titleTop-bounds.headerBottom)<2,'store title row starts directly below the main header');assert(Math.abs(bounds.tabsTop-bounds.titleBottom)<2,'tabs start directly below the store title');assert(Math.abs(bounds.contentTop-bounds.tabsBottom)<2,'catalog follows tabs without a blank row');assert.equal(bounds.titleShadow,'none');assert.equal(bounds.titleGlow,'none');assert.equal(bounds.cart,'rgb(238, 240, 243)');
 }finally{await browser.close()}
});

test('Windows parent frame-store mode uses the parent title row and starts the iframe tabs beneath it',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{const page=await browser.newPage({viewport:{width:1440,height:900}});await openStore(page,true,true);
  const bounds=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect(),active=document.querySelector('#frameCustomerNav button.active:not([data-frame-customer-cart])');return {host:document.documentElement.classList.contains('pb1126FrameStoreHost'),titleDisplay:getComputedStyle(document.getElementById('photographerStoreIdentityBar')).display,tabsTop:box('#frameCustomerNav').top,contentTop:box('#storePhotographerWorkspace>.shell').top,background:getComputedStyle(document.querySelector('#storePhotographerWorkspace>.shell')).backgroundColor,backgroundImage:getComputedStyle(document.querySelector('#storePhotographerWorkspace>.shell')).backgroundImage,shellTopBorder:getComputedStyle(document.querySelector('#storePhotographerWorkspace>.shell')).borderTopWidth,navBackground:getComputedStyle(document.querySelector('#frameCustomerNav')).backgroundColor,activeBackground:getComputedStyle(active).backgroundColor,activeUnderline:getComputedStyle(active,'::after').content,glow:getComputedStyle(document.getElementById('photographerStoreIdentityBar')).boxShadow};});
  assert.equal(bounds.host,true);assert.equal(bounds.titleDisplay,'none');assert.equal(bounds.tabsTop,0);assert.equal(bounds.contentTop,0);assert.equal(bounds.background,'rgb(244, 246, 250)','same background as store owner');assert(bounds.backgroundImage.includes('linear-gradient'),'owner-matched fade visible in iframe');assert(bounds.backgroundImage.includes('49, 94, 251')&&bounds.backgroundImage.includes('92px'),'same 92px blue fade as owner');assert.equal(bounds.shellTopBorder,'0px','no doubled line at the iframe top');assert.equal(bounds.navBackground,'rgba(0, 0, 0, 0)');assert.equal(bounds.activeBackground,'rgb(255, 255, 255)');assert.equal(bounds.activeUnderline,'none');assert.equal(bounds.glow,'none');
  const header=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');assert.match(header,/\(active==='store'\|\|storeHeader\)\?\[\]:visible/);assert.match(header,/className='pb1126FrameStoreTitle'/);assert.match(header,/className='pb1126FrameStoreTabs'/);assert.match(header,/className='pb1126FrameStoreCart'/);assert.match(header,/q\.set\('pbDesktopFrameStore','1'\)/);
 }finally{await browser.close()}
});

test('Windows parent centers the frame store title, keeps four sections right, and puts cart left',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await openStore(page,true,false,true);
  const title=page.locator('.pb1126FrameStoreTitle'),tabs=page.locator('.pb1126FrameStoreTabs .pb1126FrameStoreControl'),cart=page.locator('.pb1126FrameStoreCart .pb1126FrameStoreControl:not(.pb1249CameraCategory)');
  assert.equal(await title.locator('.pb1126FrameStoreShopName').textContent(),'SS قاب');assert.equal(await title.locator('.pb1126FrameStoreCategory').textContent(),'فروشگاه قاب شاسی');const titleBox=await title.boundingBox(),rowBox=await page.locator('.pb1126Secondary').boundingBox();assert(Math.abs(titleBox.x+titleBox.width/2-720)<3,'store name is centered: '+JSON.stringify({titleBox,rowBox,innerWidth:await page.evaluate(()=>innerWidth)}));assert(parseFloat(await title.locator('.pb1126FrameStoreCategory').evaluate(el=>getComputedStyle(el).fontSize))<parseFloat(await title.locator('.pb1126FrameStoreShopName').evaluate(el=>getComputedStyle(el).fontSize)));
  const seam=await page.locator('#pb1126DesktopHeader>.pb1126Secondary').evaluate(el=>({border:getComputedStyle(el).borderBottomWidth,shadow:getComputedStyle(el).boxShadow,fade:getComputedStyle(el,'::after').backgroundImage,fadeHeight:getComputedStyle(el,'::after').height}));assert.equal(seam.border,'0px','no dark second-header border');assert.equal(seam.shadow,'none','no double shadow below the header');assert.equal(seam.fadeHeight,'1px','one soft hairline only');assert(seam.fade.includes('152, 162, 179')&&seam.fade.includes('0.34'),'match the store owner soft separator');assert.equal(await page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]').locator('#storePhotographerWorkspace>.shell').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','iframe must not draw a second line');
   assert.equal(await tabs.count(),4);assert.equal(await cart.count(),1);assert((await cart.boundingBox()).x<150);assert((await tabs.first().boundingBox()).x>900);
  assert.equal(await page.locator('.pb1126FrameStoreTabs .active').evaluate(el=>getComputedStyle(el,'::after').content),'""');
  const storeFrame=page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]'),surface=await storeFrame.locator('#storePhotographerWorkspace>.shell').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:innerWidth,top:el.getBoundingClientRect().top}));
  assert.equal(surface.left,0);assert(Math.abs(surface.right-surface.viewport)<1);assert.equal(surface.top,0);
  assert.equal(await page.locator('.pb1126FrameStoreCart .pb1249CameraCategory').count(),0,'frame store has no category action');
  const shell=storeFrame.locator('#storePhotographerWorkspace>.shell');await shell.evaluate(el=>{const fill=document.createElement('div');fill.id='scrollbarDragFixture';fill.style.height='1600px';el.append(fill);el.scrollTop=0;});
  const scrollMetrics=await shell.evaluate(el=>({height:el.clientHeight,content:el.scrollHeight,direction:getComputedStyle(el).direction,scrollbar:getComputedStyle(el).scrollbarWidth}));assert(scrollMetrics.content>scrollMetrics.height);assert.equal(scrollMetrics.scrollbar,'none');
  const thumb=storeFrame.locator('#pbFrameStoreScrollRail .pbFrameStoreScrollThumb');await thumb.waitFor();const thumbBox=await thumb.boundingBox();await page.mouse.move(thumbBox.x+thumbBox.width/2,thumbBox.y+thumbBox.height/2);await page.mouse.down();await page.mouse.move(thumbBox.x+thumbBox.width/2,thumbBox.y+thumbBox.height+300,{steps:8});await page.mouse.up();const dragged=await shell.evaluate(el=>el.scrollTop);assert(dragged>0,'dragging the custom left scrollbar must move store content');
  assert.equal(await cart.locator('.pb1242CartCount').count(),1);assert.equal(await cart.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(238, 240, 243)');const headerBefore=await page.locator('#pb1126DesktopHeader').evaluate(el=>getComputedStyle(el).backgroundColor);await cart.click();await storeFrame.locator('#saleCartDrawer').waitFor({state:'visible'});assert.equal(await page.locator('#pb1126DesktopHeader').evaluate(el=>getComputedStyle(el).backgroundColor),headerBefore);assert(await page.evaluate(()=>Boolean(document.elementFromPoint(100,20)?.closest('#pb1126DesktopHeader'))),'cart must not cover or fade the parent header');await page.screenshot({path:'/tmp/r1242-cart.png'});await storeFrame.locator('#saleCartClose').click();
  await tabs.filter({hasText:'مالی'}).click();await storeFrame.locator('#financePanel').waitFor();
 }finally{await browser.close()}
});

test('Windows camera store uses the current navigation-only parent and keeps the real cart in Sales',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const cameraShop={...shop,id:'10000000-0000-4000-8000-000000000002',name:'دوربین مرکزی',business_category:'equipment_rental_sale',rental_enabled:true,sale_enabled:true,connected:true,canRent:true,canBuy:true};
  await openStore(page,true,false,true,cameraShop);
  const tabs=page.locator('.pb1126FrameStoreTabs .pb1126FrameStoreControl');
  assert.equal(await page.locator('.pb1126FrameStoreTitle').count(),0,'camera identity belongs to the store, not a duplicate parent title');
  assert.equal(await page.locator('.pb1126FrameStoreCart').count(),0,'parent must not clone a second camera cart');
  assert.equal(await page.locator('#pb1126DesktopHeader').evaluate(el=>el.classList.contains('pb1126CameraStore')),true);
  assert.equal(await tabs.count(),4);assert((await tabs.first().boundingBox()).x>900);
  assert.deepEqual((await tabs.allTextContents()).map(x=>x.trim()),['اجاره تجهیزات','فروش تجهیزات','آفیش‌های من','مالی']);
  const frame=page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]');
  assert.equal(await frame.locator('#photographerStoreHeaderName').textContent(),cameraShop.name);
  await tabs.filter({hasText:'آفیش‌های من'}).click();await frame.locator('#bookingsPanel').waitFor({state:'visible'});
  await tabs.filter({hasText:'مالی'}).click();await frame.locator('#financePanel').waitFor({state:'visible'});
  await tabs.filter({hasText:'اجاره تجهیزات'}).click();await frame.locator('#equipmentPanel').waitFor({state:'visible'});
  await tabs.filter({hasText:'فروش تجهیزات'}).click();await frame.locator('#salesPanel').waitFor({state:'visible'});
  await frame.locator('#saleCartBtn').click();await frame.locator('#saleCartDrawer').waitFor({state:'visible'});
  await frame.locator('#saleCartClose').click();assert.equal(await frame.locator('#saleCartDrawer').evaluate(el=>el.classList.contains('open')),false,'the actual Sales cart remains interactive and closes');
 }finally{await browser.close()}
});

test('Windows Store tab reopens the shop chooser from inside the selected shop',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await openStore(page,true,false,true);
  const storeFrame=page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]');
  await page.locator('[data-pb1126-kind="store"]').click();
  await storeFrame.locator('body.pbR96ChoosingStore').waitFor();
 await page.screenshot({path:'/tmp/r1239-store-chooser.png'});
  const sharedPanel=await page.locator('.pb1126ContentPanel[data-panel=store]').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,viewport:document.documentElement.clientWidth,iframe:el.querySelector('iframe').getBoundingClientRect().toJSON()}));
  assert(Math.abs(sharedPanel.left)<1&&Math.abs(sharedPanel.right-sharedPanel.viewport)<1,'the shared tab panel must reach both viewport edges: '+JSON.stringify(sharedPanel));
  assert(Math.abs(sharedPanel.iframe.left)<1&&Math.abs(sharedPanel.iframe.right-sharedPanel.viewport)<1,'the tab iframe must reach both viewport edges: '+JSON.stringify(sharedPanel));
  const chooserSurface=await storeFrame.locator('#storePhotographerWorkspace>.shell').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,viewport:innerWidth,background:getComputedStyle(document.querySelector('#storePhotographerWorkspace')).backgroundColor,shellBackground:getComputedStyle(el).backgroundColor}));
  assert(Math.abs(chooserSurface.left)<1&&Math.abs(chooserSurface.right-chooserSurface.viewport)<1,'Windows store chooser must fill the entire iframe viewport: '+JSON.stringify(chooserSurface));
  assert(await storeFrame.locator('#storeChooserPanelR96').isVisible());
  await storeFrame.locator('[data-enter-store-r96]').click();
  await storeFrame.locator('.frameProductCard').waitFor();
  await page.locator('[data-pb1126-kind="store"]').click();
  await storeFrame.locator('body.pbR96ChoosingStore').waitFor();
  assert(await storeFrame.locator('#storeChooserPanelR96').isVisible(),'the Windows Store tab reopens the chooser while a store is already selected');
 }finally{await browser.close()}
});

test('Windows photographer tools open closable overlays without switching tabs or adding outer scrollbars',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await openStore(page,true,false,true);
  const storeFrame=page.frameLocator('.pb1126ContentPanel iframe[title="فروشگاه"]');
  const activeStore=page.locator('[data-pb1126-kind="store"]');
  const scroll=await page.evaluate(()=>({html:[document.documentElement.scrollHeight,innerHeight],body:[document.body.scrollHeight,document.body.clientHeight],root:[document.querySelector('#root').scrollHeight,document.querySelector('#root').clientHeight]}));
  assert(scroll.html[0]<=scroll.html[1]+1,'the photographer document must not add an empty outer scrollbar');
  assert(scroll.body[0]<=scroll.body[1]+1,'body must not create a second scroll region');
  assert(scroll.root[0]<=scroll.root[1]+1,'the React root must stay within the viewport');
  const frameScroll=await storeFrame.locator('html').evaluate(el=>({height:el.scrollHeight,client:el.clientHeight}));
  assert(frameScroll.height<=frameScroll.client+1,'frame store iframe must not scroll outside its catalog pane');
  const shopSurface=await storeFrame.locator('#storePhotographerWorkspace>.shell').evaluate(el=>({gutter:getComputedStyle(el).scrollbarGutter,overflow:getComputedStyle(el).overflowY,scrollbar:getComputedStyle(el).scrollbarWidth,width:el.getBoundingClientRect().width,viewport:innerWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));
  assert.equal(shopSurface.gutter,'auto');assert.equal(shopSurface.overflow,'auto');assert.equal(shopSurface.scrollbar,'none');assert.equal(shopSurface.left,0);assert(Math.abs(shopSurface.width-shopSurface.viewport)<1);assert(Math.abs(shopSurface.right-shopSurface.viewport)<1);
  const openAndClose=async(selector,path)=>{
   await page.locator(selector).click();
   if(path.endsWith('/wallet'))assert.match(await page.locator('#pb1126DesktopHeader .pb1124Wallet').innerText(),/کیف پول.*۱٬۰۰۰.*تومان/,'desktop wallet action shows the current balance');
   const modal=page.locator('#pb1126UtilityWindow');await modal.waitFor({state:'visible'});
   assert.equal(await modal.getAttribute('role'),'presentation');
   assert.equal(await modal.locator('[role=dialog]').getAttribute('aria-modal'),'true');
   assert((await modal.locator('iframe[src*="'+path+'"]').getAttribute('src')).includes(path));
   const utility=modal.frameLocator('iframe[src*="'+path+'"]');
   if(path.endsWith('/wallet'))await utility.locator('.customerWalletPage .walletBalanceHero').waitFor({timeout:12000});
   else {await utility.locator('.standalonePhotographerSettings').waitFor({state:'visible',timeout:12000});}
   const dialogBox=await modal.locator('[role=dialog]').boundingBox();assert(Math.abs(dialogBox.y+dialogBox.height/2-450)<2,'utility dialog is vertically centered');
   if(path.endsWith('/wallet')){await utility.locator('#pb1242WalletHistoryToggle').waitFor();assert.equal(await utility.locator('.customerWalletHistory').isVisible(),false);const inner=await utility.locator('.photographerMain').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));assert(inner.scroll<=inner.height+1,'initial wallet fits without a scrollbar: '+JSON.stringify(inner));}
   await page.screenshot({path:path.endsWith('/wallet')?'/tmp/r1242-wallet.png':'/tmp/r1242-settings.png'});
   assert.equal(await activeStore.getAttribute('aria-current'),'page','the underlying Store tab stays selected');
   assert(await storeFrame.locator('.frameProductCard').isVisible(),'the current shop remains open underneath the utility window');
   await modal.locator('#pb1126UtilityClose').click();
   assert(await modal.isHidden(),'utility window closes while retaining its cached iframe');
   assert.equal(await activeStore.getAttribute('aria-current'),'page');
   assert(await storeFrame.locator('.frameProductCard').isVisible());
  };
  await openAndClose('#pb1126DesktopHeader .pb1124Wallet','/photographer/wallet');
  await openAndClose('.pb1163-settings','/photographer/settings');
  await page.locator('.pb1163-notifications').click();
  const notification=page.locator('.globalModalLayer .systemNotificationCenter');
  await notification.waitFor({timeout:5000});
  assert((await notification.innerText()).includes('رویدادهای PhotoBridge'));
  await page.locator('.globalModalLayer [aria-label="بستن"]').click();
 }finally{await browser.close()}
});


test('R2013 mobile order geometry and invoice remain visible with both empty and populated order lists',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:780},isMobile:true,hasTouch:true});
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
  const card='<div class="card customerOrderCard liveOrderCard status-ready" data-order-id="test"><div class="liveOrderMainRow"><div class="customerOrderHead"><div>سفارش ۲۴۹</div><span class="orderStatus ready">آماده تحویل</span></div><div class="liveTimeline"><div class="current"><b>آماده</b></div></div><div class="customerOrderQuickRail compactOrderActionRail"><div class="customerOrderQuickActions"><button class="pb2012OrderInvoice pb2012InvoiceLookup">فاکتور</button><button class="detail">جزئیات</button></div></div></div></div>';
  for(const populated of [false,true]){
   await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><body class="pbF37UnifiedActive pbF37PrintMode pbF37HasTabs"><div id="pbF37Subheader"><div id="pbF37Tabs" class="pb2006PrintTabs"><button>چاپ عکس</button><button>صحافی آلبوم</button><button>مالی</button></div></div><div id="root"><main class="photographerMain photographerPrintWorkspace pbFixedRoleHeader"><div class="photographerRolePageScrollArea rolePageScrollArea" style="position:fixed!important;top:181px!important;bottom:78px!important;padding-top:3px!important"><section class="ordersWorkspace customerOrders liveCustomerOrders"><div class="photographerMobileOrderLaunch"><button>انتخاب عکس</button></div><div class="pb761PhotoStatuses"><button>در جریان</button><button>نیازمند اصلاح</button><button>آماده تحویل</button><button>تحویل شده</button></div><div class="customerOrderGrid liveOrderGrid">'+(populated?card:'<div class="card">سفارشی در این وضعیت نیست.</div>')+'</div></section></div></main></div></body>');
   await page.addStyleTag({content:css});
   const rail=await page.locator('.pb761PhotoStatuses').boundingBox(),sc=await page.locator('.photographerRolePageScrollArea').boundingBox();
   assert(rail&&sc&&rail.y-sc.y>=0&&rail.y-sc.y<=6,'no empty-state gap above filters');
   if(populated){
    assert(await page.locator('.pb2012OrderInvoice').isVisible(),'real invoice action visible');
    assert(!(await page.locator('.customerOrderHead>.orderStatus').isVisible()),'redundant ready badge hidden');
    const invoice=await page.locator('.pb2012OrderInvoice').boundingBox(),detail=await page.locator('button.detail').boundingBox();
    assert(Math.abs(invoice.y-detail.y)<=2,'invoice and Details share a row');
   }
  }
 }finally{await browser.close()}
});


test('R2015 desktop photo and album native third row is visible and clickable in the active document',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
  const script=fs.readFileSync('dist/web/photobridge-r1461-print-navigation.js','utf8');
  for(const album of [false,true]){
   const pathname=album?'/photographer/album':'/photographer/orders/flow';
   const controls=album?'<div id="photographer-album-new-order-slot"><button id="new-order">ثبت سفارش آلبوم</button></div><div id="photographer-album-status-desktop-slot"><div class="albumHeaderStatuses"><button id="status">در جریان</button></div></div>':'<div class="photographerLabContextActions"><button id="new-order" class="photographerContextAction primary">ثبت سفارش چاپ</button></div><div class="photographerContextStatusesDesktop"><button id="status">در جریان</button></div>';
   await page.route('https://photobridge.test'+pathname,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html class="pb1126Desktop"><body><header id="pb1126DesktopHeader" style="position:fixed;top:0;height:114px;width:100%"></header><div id="root"><main class="photographerMain photographerPrintWorkspace"><div class="photographerLabContextRail" style="display:none!important;visibility:hidden!important"><div class="photographerLabContextMain">'+controls+'</div></div><div class="photographerRolePageScrollArea" style="position:fixed;bottom:0;left:0;right:0"><section class="ordersWorkspace liveCustomerOrders"><div class="customerOrderGrid liveOrderGrid"></div></section></div></main></div></body></html>'}));
   await page.goto('https://photobridge.test'+pathname);
   await page.addStyleTag({content:css});
   await page.addScriptTag({content:script});
   await page.locator('main.pb2015OrderBoard').waitFor();
   const rail=await page.locator('.photographerLabContextRail').boundingBox();
   const area=await page.locator('.photographerRolePageScrollArea').boundingBox();
   assert(rail&&area&&Math.abs(rail.y-114)<=2&&Math.abs(rail.height-44)<=2&&area.y>=rail.y+rail.height-2);
   for(const id of ['new-order','status']){
    const button=page.locator('#'+id);
    await button.evaluate(el=>el.addEventListener('click',()=>el.dataset.clicked='yes'));
    await button.click();assert.equal(await button.getAttribute('data-clicked'),'yes');
   }
   await page.unroute('https://photobridge.test'+pathname);
  }
 }finally{await browser.close()}
});


test('R2016 desktop intake buttons are below the real header and order viewport does not jump when cards appear/disappear',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:800}});
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
  const script=fs.readFileSync('dist/web/photobridge-r1461-print-navigation.js','utf8');
  const inset=fs.readFileSync('dist/web/photobridge-r1318-print-insets.js','utf8');
  for(const pathname of ['/photographer/upload','/photographer/orders/flow','/photographer/album']){
   const intake=pathname.endsWith('upload');
   const content=intake?'<div class="simplePrintPilotMobileHeaderHost"><div class="simplePrintPilotHeader"><div class="simplePrintPilotHeaderActions"><button class="simplePrintPilotPrimaryAdd">انتخاب سایز و فایل چاپ</button></div></div></div>':'<div class="photographerLabContextRail"><div class="photographerLabContextMain"><div class="photographerLabContextActions"><button class="photographerContextAction primary">سفارش جدید</button></div></div></div>';
   const board=intake?'<div class="simplePrintPilot"><div class="simplePrintPilotDesktopGrid"><div class="simplePrintPilotMain">عکس‌ها</div><aside class="simplePrintPilotQuote">ریز قیمت</aside></div></div>':'<section class="ordersWorkspace liveCustomerOrders"><div class="customerOrderGrid liveOrderGrid"></div></section>';
   const html='<!doctype html><html class="pb1126Desktop"><body class="pbAuthenticatedPhotographerPortal"><header id="pb1126DesktopHeader" style="position:fixed;top:0;height:121px;width:100%"></header><div id="root"><main class="photographerMain photographerPrintWorkspace '+(intake?'simplePrintPilotWorkspaceMode':'')+'">'+content+'<div class="photographerRolePageScrollArea" style="top:0!important;height:100vh!important">'+board+'</div></main></div></body></html>';
   const url='https://photobridge.test'+pathname;
   await page.route(url,route=>route.fulfill({contentType:'text/html',body:html}));
   await page.goto(url);await page.addStyleTag({content:css});await page.addScriptTag({content:script});await page.addScriptTag({content:inset});
   await page.locator('main.pb2016ManagedViewport').waitFor();
   const rail=page.locator(intake?'.simplePrintPilotHeader':'.photographerLabContextRail'),area=page.locator('.photographerRolePageScrollArea');
   const before=await area.boundingBox(),r=await rail.boundingBox();
   assert(r&&before&&Math.abs(r.y-121)<=2&&Math.abs(before.y-165)<=2,'third row and content use the measured parent edge');
   if(intake){const add=rail.locator('.simplePrintPilotPrimaryAdd');await add.evaluate(el=>el.onclick=()=>el.dataset.clicked='yes');await add.click();assert.equal(await add.getAttribute('data-clicked'),'yes')}
   else for(let i=0;i<4;i++){
    await area.evaluate((el,n)=>{el.querySelector('.customerOrderGrid').innerHTML=n%2?'<div class="customerOrderCard liveOrderCard" style="height:120px">سفارش</div>':''},i);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const next=await area.boundingBox();assert(next&&Math.abs(next.y-before.y)<=1&&Math.abs(next.height-before.height)<=1,'list geometry does not change when cards mount');
   }
   await page.unroute(url);
  }
 }finally{await browser.close()}
});


test('R2018 all four desktop tabs use identical visual treatment and the two new-order actions are centered',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:800}});
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
  const classes=['photographerPrintPhotoTab','photographerPrintAlbumTab','finance','archive'];
  const labels=['چاپ عکس','صحافی آلبوم','مالی','آرشیو'];
  const tabs=classes.map((cls,i)=>'<button class="'+cls+'">'+labels[i]+'</button><button class="pb1978VideoGuideButton '+(i>1?'pb2005UtilityGuide':'')+'"><span class="pb569GuideArrow">▶</span><em class="pb569GuideLabel">راهنما</em></button>').map((html,i)=>html+(i===1?'<span class="pb1632ModeDivider" aria-hidden="true"></span>':'')).join('');
  for(const album of [false,true]){
   const order=album?'<div id="photographer-album-new-order-slot"><button>سفارش جدید آلبوم</button></div>':'<div class="photographerLabContextActions"><button class="photographerContextAction primary">چاپ عکس جدید</button></div>';
   await page.setContent('<html class="pb1126Desktop"><body class="pbAuthenticatedPhotographerPortal"><div id="pb1126ChromeHost"><header id="pb1126DesktopHeader" class="pb1458PrintToolbar"><div class="pb1126Secondary pb1127PrintRow"><div class="pb1127PrintModes pb1989ModelTwo">'+tabs+'</div></div></header></div><div id="root"><main class="photographerMain photographerPrintWorkspace pb2015OrderBoard pb2016OrderList pb2016ManagedViewport" style="--pb2016ChromeEdge:114px"><div class="photographerLabContextRail"><div class="photographerLabContextMain">'+order+'</div></div></main></div></body></html>');
   await page.addStyleTag({content:css});
   const selector='.pb1127PrintModes>button:not(.pb1978VideoGuideButton)';
   const buttons=page.locator(selector);
   assert.equal(await buttons.count(),4);
   const original=await buttons.evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return [s.height,s.backgroundColor,s.color,s.fontSize,s.borderRadius]}));
   original.forEach(v=>assert.deepEqual(v,original[0]));
   const guides=page.locator('.pb1127PrintModes>button.pb1978VideoGuideButton');
   assert.equal(await guides.count(),4);
   assert.equal(await guides.locator('.pb569GuideArrow').count(),4);
   assert.equal(await guides.locator('.pb569GuideLabel').count(),4);
   const gaps=await page.locator('.pb1127PrintModes').evaluate(nav=>{const buttons=[...nav.querySelectorAll(':scope>button')].map(n=>n.getBoundingClientRect());return buttons.slice(1).map((r,i)=>Math.round(buttons[i].left-r.right))});
   assert.deepEqual(gaps,[0,10,0,10,0,10,0],'joined pairs and equal group gaps');
   const edges=await page.locator('.pb1127PrintModes').evaluate(nav=>[...nav.querySelectorAll(':scope>button')].map(b=>{const s=getComputedStyle(b);return [s.borderTopLeftRadius,s.borderTopRightRadius,s.borderRightWidth,s.borderLeftWidth]}));
   edges.forEach((edge,i)=>assert.deepEqual(edge,i%2===0?['0px','10px','1px','0px']:['10px','0px','1px','1px'],'one internal border and no inner rounding'));
   const looks=await guides.evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),a=getComputedStyle(n.querySelector('.pb569GuideArrow'));return [s.height,s.backgroundColor,s.color,s.borderRadius,a.width,a.height,a.backgroundColor]}));
   looks.forEach(v=>assert.deepEqual(v,looks[0]));
   for(let i=0;i<4;i++){
    await buttons.evaluateAll((nodes,n)=>nodes.forEach((el,index)=>el.classList.toggle('active',n===index)),i);
    const color=await buttons.nth(i).evaluate(n=>{const s=getComputedStyle(n);return [s.backgroundColor,s.color]});
    assert.deepEqual(color,['rgb(59, 130, 246)','rgb(255, 255, 255)']);
    const styles=await guides.evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),a=n.querySelector('.pb569GuideArrow').getBoundingClientRect(),b=n.querySelector('.pb569GuideLabel').getBoundingClientRect();return {bg:s.backgroundColor,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,direction:s.flexDirection,stacked:a.bottom<=b.top+1}}));
    styles.forEach((s,n)=>{assert.equal(s.bg,n===i?color[0]:'rgb(255, 255, 255)');assert.equal(s.width,40);assert.equal(s.height,32);assert.equal(s.direction,'column');assert(s.stacked,'Play icon above guide label')});

   }
   const action=page.locator(album?'#photographer-album-new-order-slot':'.photographerLabContextActions');
   const box=await action.boundingBox();assert(box&&Math.abs(box.x+box.width/2-720)<=2,'new order is centered in the viewport');
   await page.locator('.pb1126Secondary').evaluate(el=>el.hidden=true);
   assert(!(await buttons.first().isVisible()),'initial hidden secondary row cannot flash incomplete controls');
  }
 }finally{await browser.close()}
});


test('R2019 real RTL photo and album order buttons center in third row with native status siblings',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:800}});
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
  for(const width of [1024,1440,1920]){
   await page.setViewportSize({width,height:800});
   for(const embedded of [false,true])for(const mode of ['photo','album-slot','album-nested']){
    const album=mode!=='photo',edge=embedded?0:114;
    const button='<button class="photographerContextAction primary" onclick="this.dataset.clicked=1">'+(album?'سفارش آلبوم جدید':'چاپ عکس جدید')+'</button>';
    const slot='<div id="photographer-album-new-order-slot">'+button+'</div>';
    const action=album?(mode==='album-nested'?'<div class="photographerLabContextActions">'+slot+'</div>':slot):'<div class="photographerLabContextActions">'+button+'</div>';
    const statuses='<div class="photographerContextStatusesDesktop"><button>درحال انجام</button><button>آماده</button></div>';
    await page.setContent('<html dir="rtl" class="'+(embedded?'pb1126Embedded':'pb1126Desktop')+'"><body class="pbAuthenticatedPhotographerPortal"><div id="root"><main class="photographerMain photographerPrintWorkspace pb2015OrderBoard pb2016OrderList pb2016ManagedViewport '+(album?'pb1464Album':'pb1461Orders')+'" style="--pb2016ChromeEdge:'+edge+'px;--pb2014OrderTop:'+edge+'px"><div class="photographerLabContextRail"><div class="photographerLabContextMain">'+action+statuses+'</div></div><div class="photographerRolePageScrollArea"><section class="ordersWorkspace liveCustomerOrders"></section></div></main></div></body></html>');
    await page.addStyleTag({content:css});
    const control=page.locator('.photographerContextAction.primary'),box=await control.boundingBox();
    assert(box&&Math.abs(box.x+box.width/2-width/2)<=2,JSON.stringify({width,embedded,mode,box}));
    assert(box.y>=edge&&box.y+box.height<=edge+44,'action is within third row');
    await control.click();assert.equal(await control.getAttribute('data-clicked'),'1');
   }
  }
 }finally{await browser.close()}
});

(()=>{'use strict';const C=window.PBFrameCatalog,selected=new Map();
const isFrame=()=>Boolean(saleShopConfig?.production);
/* R1224: frame cards are keyed, persistent DOM. Repeated wallet, order and
   visibility refreshes must never detach photos, reset scroll/dots or flash. */
let frameRenderedShop='';
function frameCardSignature(g,item){
 return JSON.stringify([item.id,g.model,g.material,g.description,g.category,g.variants.map(x=>[
  x.id,x.updated_at,x.sale_price,x.active,x.title,x.model,x.description,x.image_url,
  x.image_urls,x.thumbnail_url,x.thumbnail_urls,x.color_image_urls,x.variant_specs
 ])]);
}
function frameFreshCard(g,id){
 const temp=document.createElement('template');temp.innerHTML=C.card(g,id,{esc,money}).trim();return temp.content.firstElementChild;
}
function frameUpdatePhotoNodes(current,next,card){
 const a=current?.querySelector('.framePhotoViewport'),b=next?.querySelector('.framePhotoViewport');
 if(!current||!next||!a||!b){if(current&&next)current.replaceWith(next);else if(current)current.remove();else if(next)card.querySelector('.saleItemHead')?.append(next);return;}
 const oldImg=[...a.querySelectorAll('.saleItemPhoto')],newImg=[...b.querySelectorAll('.saleItemPhoto')];
 const sourceOld=oldImg.map(x=>x.getAttribute('src')),sourceNew=newImg.map(x=>x.getAttribute('src'));
 const sameSource=sourceOld.length===sourceNew.length&&sourceOld.every((src,i)=>src===sourceNew[i]);
 const copyAttrs=()=>{
  const actual=a.querySelectorAll('[data-frame-show-gallery]'),fresh=b.querySelectorAll('[data-frame-show-gallery]');
  for(let i=0;i<actual.length;i++){
   const latest=fresh[i];if(!latest)continue;
   for(const key of ['data-frame-show-gallery','data-frame-gallery-index']){
    if(actual[i].getAttribute(key)!==latest.getAttribute(key))actual[i].setAttribute(key,latest.getAttribute(key));
   }
   const alt=newImg[i]?.getAttribute('alt');if(alt!==undefined&&oldImg[i]?.getAttribute('alt')!==alt)oldImg[i].setAttribute('alt',alt);
  }
 };
 if(sameSource){card._framePhotoToken=undefined;copyAttrs();return;}
 const token=Symbol('frame-photo-change');card._framePhotoToken=token;
 const urls=sourceNew.filter(Boolean);
 const loaders=urls.map(url=>new Promise((done,reject)=>{
   const img=new Image();img.onload=()=>{const decoded=typeof img.decode==='function'?img.decode().catch(()=>{}):Promise.resolve();decoded.then(done);};
   img.onerror=reject;img.src=url;if(img.complete&&img.naturalWidth>0)done();
 }));
 Promise.all(loaders).then(()=>{
  if(!card.isConnected||card._framePhotoToken!==token)return;
  if(oldImg.length===newImg.length){
   newImg.forEach((image,i)=>{const url=image.getAttribute('src');if(oldImg[i].getAttribute('src')!==url)oldImg[i].setAttribute('src',url);});
   copyAttrs();
  }else{
   const view=next.querySelector('.framePhotoViewport');if(view)view.scrollLeft=a.scrollLeft;
   current.replaceWith(next);
  }
 }).catch(()=>{if(card._framePhotoToken===token){ // Keep the old image visible if a new source fails.
  card._framePhotoToken=undefined;
 }});
}
function frameUpdateCard(existing,fresh){
 const quantity=existing.querySelector('input[id^="saleQty-"]')?.value||'1';
 existing.dataset.selectedItem=fresh.dataset.selectedItem;
 for(const selector of ['.saleItemInfo','.frameSharedDescription','.frameStoreChoices','.frameSizePriceRow','.saleItemBuy']){
  const oldNode=existing.querySelector(':scope > '+selector)||existing.querySelector(':scope > .saleItemHead > '+selector);
  const newNode=fresh.querySelector(':scope > '+selector)||fresh.querySelector(':scope > .saleItemHead > '+selector);
  if(oldNode&&newNode){
   if(oldNode.outerHTML!==newNode.outerHTML)oldNode.replaceWith(newNode);
  }else if(oldNode&&!newNode)oldNode.remove();
  else if(!oldNode&&newNode){
   const before=selector==='.frameSharedDescription'?existing.querySelector('.frameStoreChoices,.frameSizePriceRow'):selector==='.frameStoreChoices'?existing.querySelector('.frameSizePriceRow'):null;
   existing.insertBefore(newNode,before);
  }
 }
 const input=existing.querySelector('input[id^="saleQty-"]');if(input)input.value=quantity;
 const oldVisual=existing.querySelector('.saleItemHead .framePhotoCarousel,.saleItemHead .saleItemPhotoPlaceholder');
 const freshVisual=fresh.querySelector('.saleItemHead .framePhotoCarousel,.saleItemHead .saleItemPhotoPlaceholder');
 if(oldVisual||freshVisual)frameUpdatePhotoNodes(oldVisual,freshVisual,existing);
}
function render(){
 applyFrameCustomerView();if(!isFrame()){frameRenderedShop='';return;}
 const host=document.getElementById('saleItems');if(!host)return;
 const currentShop=String(shopId||'');
 if(frameRenderedShop!==currentShop){frameRenderedShop=currentShop;selected.clear();host.replaceChildren();}
 const groups=C.groups(saleItems),wanted=new Set();
 for(let i=0;i<groups.length;i++){
  const g=groups[i],item=C.choose(g,selected.get(g.id));if(!item)continue;
  selected.set(g.id,item.id);wanted.add(String(g.id));
  const signature=frameCardSignature(g,item);
  let card=[...host.children].find(x=>x.classList?.contains('frameProductCard')&&x.dataset.frameModel===String(g.id));
  if(!card){card=frameFreshCard(g,item.id);card.dataset.frameRenderSignature=signature;host.insertBefore(card,host.children[i]||null);}
  else{
   if(card.dataset.frameRenderSignature!==signature){
    frameUpdateCard(card,frameFreshCard(g,item.id));
    card.dataset.frameRenderSignature=signature;
   }
   if(host.children[i]!==card)host.insertBefore(card,host.children[i]||null);
  }
 }
 for(const el of [...host.children])if(el.classList.contains('frameProductCard')&&!wanted.has(el.dataset.frameModel))el.remove();
 if(!wanted.size&&host.textContent!=='مدلی برای سفارش وجود ندارد.')host.innerHTML='<div class="empty">مدلی برای سفارش وجود ندارد.</div>';
 if(wanted.size)host.querySelector(':scope > .empty')?.remove();
 applySaleCategory();mountFrameSizeTriggers();
}
const originalRender=renderSales;renderSales=function(){originalRender();render();renderFrameOrderRows();};
// Standalone model-card tests do not supply the full checkout implementation.
function frameRevealOpenCart(){
 const isProd=isFrame()||document.body.classList.contains('frameCustomerStore');
 const drawer=document.getElementById('saleCartDrawer');
 if(!isProd||!drawer?.classList.contains('open'))return;
 // A stale inline transform from old builds prevented the drawer from entering.
 // Preserve the new CSS transform/transition instead of forcing transition:none.
 for(const key of ['transform','translate','transition','left','right'])drawer.style.removeProperty(key);
 drawer.style.setProperty('visibility','visible','important');
 drawer.style.setProperty('pointer-events','auto','important');
}
if(typeof openSaleCart==='function'&&typeof closeSaleCart==='function'){
 const frameOriginalOpenCart=openSaleCart,frameOriginalCloseCart=closeSaleCart;
 openSaleCart=function(...args){
  const drawer=document.getElementById('saleCartDrawer');
  const animate=Boolean(drawer&&customerFrame()&&!drawer.classList.contains('open'));
  if(animate)drawer.classList.add('frameCartMotionStart');
  const result=frameOriginalOpenCart.apply(this,args);
  frameRevealOpenCart();
  if(animate){
   // Start offscreen, force a style frame, then let CSS animate to the open state.
   void drawer.offsetHeight;
   requestAnimationFrame(()=>{if(drawer.classList.contains('open'))drawer.classList.remove('frameCartMotionStart');});
  }
  return result;
 };
 closeSaleCart=function(...args){
  const result=frameOriginalCloseCart.apply(this,args);
  const drawer=document.getElementById('saleCartDrawer');
  if(drawer){drawer.classList.remove('frameCartMotionStart');for(const key of ['transform','translate','visibility','pointer-events','left','right','transition'])drawer.style.removeProperty(key);}
  return result;
 };
 // Other legacy event handlers may capture the old checkout function by reference.
 document.addEventListener('click',e=>{
  if(!e.target.closest('[data-frame-customer-cart],#saleCartCheckout'))return;
  requestAnimationFrame(frameRevealOpenCart);
  setTimeout(frameRevealOpenCart,50);
 },true);
}
function frameForceCloseCart(){
 const drawer=document.getElementById('saleCartDrawer'),backdrop=document.getElementById('saleCartBackdrop');
 if(drawer){
  drawer.classList.remove('open','frameCartMotionStart');drawer.setAttribute('aria-hidden','true');
  for(const key of ['transform','translate','visibility','pointer-events','left','right','transition'])drawer.style.removeProperty(key);
 }
 if(backdrop)backdrop.hidden=true;
 if(!document.getElementById('frameCheckoutDialog'))document.body.style.overflow='';
}
if(typeof openStoreSection==='function'){
 const frameOriginalOpenSection=openStoreSection;
 openStoreSection=function(id,...args){
  if(customerFrame()&&id!=='salesPanel')frameForceCloseCart();
  return frameOriginalOpenSection.call(this,id,...args);
 };
}
const originalCart=renderSaleCart;renderSaleCart=function(){originalCart();if(isFrame()){const rows=[...document.querySelectorAll('#saleCartLines .saleCartLine')];for(const [index,line] of rows.entries()){const entry=saleCart[index],item=saleItems.find(x=>String(x.id)===String(entry?.itemId));if(item){const title=line.querySelector('b');if(title){title.textContent=item.variant_specs?.baseModel||item.title||'قاب و شاسی';const variant=C.label(item);if(variant){const meta=document.createElement('small');meta.className='frameCartVariant';meta.textContent=variant;title.after(meta);}}}}}};
function changeChoice(e){const el=e.target.closest('[data-frame-choice]');if(!el||!isFrame())return;const card=el.closest('[data-frame-model]'),g=C.groups(saleItems).find(x=>String(x.id)===card.dataset.frameModel);if(!g)return;const current=C.choose(g,selected.get(g.id)),quantity=card.querySelector('input[id^=saleQty-]')?.value||'1',next=C.changeChoice(g,current,el.dataset.frameChoice,el.dataset.frameColor||el.value);if(next){selected.set(g.id,next.id);render();const qty=document.getElementById('saleQty-'+next.id);if(qty)qty.value=quantity;}}
document.addEventListener('change',changeChoice);
document.addEventListener('click',e=>{if(e.target.closest('[data-frame-color]')){changeChoice(e);return;}const btn=e.target.closest('[data-frame-show-gallery]');if(btn){pb834OpenShopGallery('sale',btn.dataset.frameShowGallery);if(typeof pb834ShopGalleryState!=='undefined'){pb834ShopGalleryState.index=Number(btn.dataset.frameGalleryIndex)||0;pb834RenderShopGallery();}}});


const frameStageList=[['awaiting_approval','در انتظار تأیید'],['in_production','در حال تولید'],['ready','آماده تحویل'],['delivered','تحویل‌شده']];
let frameOrdersOrigin=null;
function ensureFrameOrdersPanel(enabled){
 const orders=document.getElementById('saleOrders'),sales=document.getElementById('salesPanel');
 if(!orders||!sales)return;
 let panel=document.getElementById('frameOrdersPanel');
 if(enabled){
  if(!panel){panel=document.createElement('section');panel.id='frameOrdersPanel';panel.className='rentalPanel';panel.innerHTML='<div class="box"><header class="frameOrdersHead"><h2>سفارش‌های من</h2><button type="button" data-frame-order-refresh>به‌روزرسانی وضعیت</button></header><div class="frameOrdersHost"></div></div>';sales.after(panel);}
  const dest=panel.querySelector('.frameOrdersHost');
  if(orders.parentNode!==dest){frameOrdersOrigin={parent:orders.parentElement,next:orders.nextSibling};dest.append(orders);}
 }else if(panel){
  const dest=frameOrdersOrigin?.parent||document.getElementById('salesContent');
  if(dest)dest.insertBefore(orders,frameOrdersOrigin?.next?.parentNode===dest?frameOrdersOrigin.next:null);
  panel.remove();frameOrdersOrigin=null;
 }
}
function frameStepMarkup(stage){
 if(stage==='cancelled')return '<div class="frameOrderCancelled">سفارش لغو شده است</div>';
 const index=frameStageList.findIndex(row=>row[0]===stage);
 return '<div class="frameOrderStepper" aria-label="مراحل سفارش">'+frameStageList.map(([key,label],i)=>'<div class="frameOrderStep '+(i<=index?'complete ':'')+(i===index?'current':'')+'"><span class="frameOrderCircle" aria-hidden="true">'+(i<index?'✓':(i+1))+'</span><small>'+label+'</small></div>').join('')+'</div>';
}
function frameOrderIsHistory(order){
 return ['delivered','cancelled','rejected','refunded','completed'].includes(String(order?.production_stage||order?.status||'').toLowerCase());
}
function renderFrameOrderRows(){
 if(!customerFrame())return;
 const root=document.getElementById('saleOrders');if(!root)return;
 const rows=(saleOrders||[]).filter(o=>String(o.shop_id)===String(shopId));
 let visible=0;
 for(const [i,el] of [...root.querySelectorAll('.saleOrderCustomer')].entries()){
  const order=rows[i],info=el.querySelector('div');
  const show=Boolean(order)&&(frameOrderView==='history'?frameOrderIsHistory(order):!frameOrderIsHistory(order));
  if(el.hidden===show)el.hidden=!show;
  if(show)visible++;
  if(!info||!order?.production_stage)continue;
  el.classList.add('frameOrderCustomer');
  info.querySelector('.frameOrderStepper,.frameOrderCancelled')?.remove();
  info.insertAdjacentHTML('beforeend',frameStepMarkup(order.production_stage));
 }
 const panel=document.getElementById('frameOrdersPanel');
 const title=panel?.querySelector('.frameOrdersHead h2');
 const label=frameOrderView==='history'?'سوابق خرید':'سفارش‌های من';
 if(title&&title.textContent!==label)title.textContent=label;
 let empty=panel?.querySelector('#frameOrderViewEmpty');
 if(!empty&&panel){empty=document.createElement('div');empty.id='frameOrderViewEmpty';empty.className='empty';root.after(empty);}
 if(empty){empty.hidden=visible>0||!rows.length;empty.textContent=frameOrderView==='history'?'هنوز خرید تکمیل‌شده‌ای ثبت نشده است.':'سفارش در جریان ندارید.';}
}



window.pbFrameConfirmCheckout=function({total,wallet}){
 return new Promise(resolve=>{
  const previous=document.activeElement,priorOverflow=document.body.style.overflow;
  const dialog=document.createElement('section');dialog.id='frameCheckoutDialog';dialog.className='frameCheckoutDialog';
  dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','frameCheckoutTitle');
  dialog.innerHTML='<button type="button" class="frameCheckoutBackdrop" data-frame-checkout-cancel aria-label="بستن"></button><div class="frameCheckoutCard"><header><div><b id="frameCheckoutTitle">تأیید ثبت سفارش</b><small>فروشگاه قاب و شاسی</small></div><button type="button" data-frame-checkout-cancel aria-label="بستن">×</button></header><div class="frameCheckoutBody"><p>مشخصات سبد خرید را بررسی کنید. پس از ثبت، مراحل تولید در بخش «سفارش‌ها» نمایش داده می‌شود.</p><div class="frameCheckoutSummary"><span>مبلغ سفارش</span><b></b></div><div class="frameCheckoutSummary"><span>روش تحویل</span><b data-frame-delivery-label></b></div><p class="frameCheckoutPayment"></p></div><footer><button type="button" data-frame-checkout-cancel>بازگشت</button><button type="button" class="frameCheckoutSubmit" data-frame-checkout-submit>تأیید و ثبت سفارش</button></footer></div>';
  dialog.querySelector('.frameCheckoutSummary b').textContent=money(total);
  const method=document.getElementById('productionDeliveryMethod')?.value||'pickup';
  dialog.querySelector('[data-frame-delivery-label]').textContent=method==='courier'?'ارسال با پیک به آدرس ثبت‌شده':'تحویل حضوری';
  dialog.querySelector('.frameCheckoutPayment').textContent=wallet?'پس از تأیید، مبلغ از کیف پول شما پرداخت می‌شود.':'پرداخت و تسویه مطابق شرایط فروشگاه انجام می‌شود.';
  const done=accepted=>{
   if(!dialog.isConnected)return;
   dialog.remove();document.body.style.overflow=priorOverflow;document.removeEventListener('keydown',onKey);
   if(previous?.isConnected)previous.focus({preventScroll:true});
   resolve(accepted);
  };
  const onKey=e=>{if(e.key==='Escape'){e.preventDefault();done(false)}if(e.key==='Tab'){const focusable=[...dialog.querySelectorAll('button:not([disabled])')];const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  dialog.addEventListener('click',e=>{if(e.target.closest('[data-frame-checkout-cancel]'))done(false);else if(e.target.closest('[data-frame-checkout-submit]'))done(true)});
  document.body.append(dialog);document.body.style.overflow='hidden';document.addEventListener('keydown',onKey);
  dialog.querySelector('.frameCheckoutSubmit')?.focus({preventScroll:true});
 });
};

let frameSizeSheet=null,frameSizeSheetPreviousFocus=null,frameSizeSheetPreviousOverflow='';
function mountFrameSizeTriggers(){
 if(!customerFrame())return;
 for(const select of document.querySelectorAll('#saleItems .frameSizePriceRow select[data-frame-choice="size"]')){
  const field=select.closest('label');if(!field||field.querySelector('[data-frame-size-trigger]'))continue;
  const button=document.createElement('button');button.type='button';button.className='frameSizeTrigger';
  button.dataset.frameSizeTrigger=select.closest('[data-frame-model]')?.dataset.frameModel||'';
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-label','انتخاب سایز');
  button.innerHTML='<span></span><span aria-hidden="true">⌄</span>';
  button.querySelector('span').textContent=select.selectedOptions[0]?.textContent||'انتخاب سایز';
  field.append(button);
 }
}
function closeFrameSizeSheet(){
 const sheet=frameSizeSheet;if(!sheet)return;
 frameSizeSheet=null;sheet.remove();document.body.style.overflow=frameSizeSheetPreviousOverflow;
 if(frameSizeSheetPreviousFocus?.isConnected)frameSizeSheetPreviousFocus.focus({preventScroll:true});
 frameSizeSheetPreviousFocus=null;
}
function openFrameSizeSheet(trigger){
 if(!customerFrame()||!window.matchMedia('(max-width:820px)').matches)return;
 const field=trigger.closest('label'),select=field?.querySelector('select[data-frame-choice="size"]');
 if(!select)return;
 closeFrameSizeSheet();
 frameSizeSheetPreviousFocus=trigger;frameSizeSheetPreviousOverflow=document.body.style.overflow;
 const sheet=document.createElement('section');sheet.id='frameSizeSheet';sheet.className='frameSizeSheet';
 sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','انتخاب سایز قاب و شاسی');
 const model=trigger.closest('[data-frame-model]')?.querySelector('.saleItemInfo b')?.textContent||'';
 const options=[...select.options].filter(o=>!o.disabled&&o.value);
 sheet.innerHTML='<button type="button" class="frameSizeBackdrop" data-frame-size-close aria-label="بستن انتخاب سایز"></button><div class="frameSizeDialog"><header><div><b>انتخاب سایز</b><small></small></div><button type="button" data-frame-size-close aria-label="بستن">×</button></header><div class="frameSizeOptions" role="listbox"></div></div>';
 sheet.querySelector('.frameSizeDialog header small').textContent=model;
 const host=sheet.querySelector('.frameSizeOptions');
 for(const option of options){
  const button=document.createElement('button');button.type='button';button.dataset.frameSizeValue=option.value;
  button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.value===select.value));
  button.innerHTML='<span></span><span aria-hidden="true"></span>';
  button.firstElementChild.textContent=option.textContent;
  button.lastElementChild.textContent=option.value===select.value?'✓':'';
  host.append(button);
 }
 frameSizeSheet=sheet;document.body.append(sheet);document.body.style.overflow='hidden';
 sheet.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});
 sheet.querySelector('.frameSizeDialog header button')?.focus({preventScroll:true});
 sheet.addEventListener('click',event=>{
  if(event.target.closest('[data-frame-size-close]')){closeFrameSizeSheet();return;}
  const btn=event.target.closest('[data-frame-size-value]');
  if(!btn)return;
  const value=btn.dataset.frameSizeValue,group=trigger.dataset.frameSizeTrigger;
  closeFrameSizeSheet();
  select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));
  requestAnimationFrame(()=>document.querySelector('[data-frame-size-trigger="'+CSS.escape(group)+'"]')?.focus({preventScroll:true}));
 });
}
document.addEventListener('click',e=>{const trigger=e.target.closest('[data-frame-size-trigger]');if(trigger&&window.matchMedia('(max-width:820px)').matches){e.preventDefault();e.stopPropagation();openFrameSizeSheet(trigger)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&frameSizeSheet){e.preventDefault();closeFrameSizeSheet();}});

let categoryOrigin=null,frameShellTop=null,frameCartPortals=null,frameOrderView='orders';const frameHiddenControls=new Map(),frameControlLabels=new Map(),frameLayoutDisplays=new Map();
const customerFrame=()=>typeof selectedShopRecord==='function'?['frame','chassis','frame_chassis'].includes(selectedShopRecord()?.business_category):isFrame();
function positionFrameNavigation(){
 const bar=document.getElementById('photographerStoreIdentityBar'),nav=document.getElementById('frameCustomerNav'),shell=document.querySelector('#storePhotographerWorkspace>.shell');
 if(!customerFrame()||document.body.classList.contains('pbR96ChoosingStore')){
  if(shell&&frameShellTop){if(frameShellTop.value)shell.style.setProperty('top',frameShellTop.value,frameShellTop.priority);else shell.style.removeProperty('top');frameShellTop=null;}
  return;
 }
 if(!bar||!nav)return;
 const desktop=window.matchMedia('(min-width:821px)').matches&&!document.documentElement.classList.contains('pb1126Embedded');
 // R1229: use the *actual existing desktop header row* for the shop name,
 // rather than adding a second identity ribbon below it. Keep mobile as-is.
 const role=document.getElementById('photographerStoreRoleHeader');
 if(desktop){if(role&&nav.previousElementSibling!==role)role.after(nav);}
 else if(nav.previousElementSibling!==bar)bar.after(nav);
 // Anchor the shop title to the measured photographer header, not the legacy
 // fixed 64px offset (which becomes wrong when long studio names wrap).
 if(!desktop){
  const top=Math.round(role?.getBoundingClientRect().bottom||64);
  if(bar.style.getPropertyValue('top')!==top+'px'||bar.style.getPropertyPriority('top')!=='important')bar.style.setProperty('top',top+'px','important');
 }else if(bar.style.getPropertyValue('top'))bar.style.removeProperty('top');
 // Desktop starts immediately below the real unified header, with no ghost
 // 42px store-title strip; mobile retains its existing title strip.
 const bottom=desktop?Math.round(role?.getBoundingClientRect().bottom||64):bar.getBoundingClientRect().bottom;
 const contentTop=bottom+nav.getBoundingClientRect().height;
 document.documentElement.style.setProperty('--frame-customer-nav-top',bottom+'px');
 document.documentElement.style.setProperty('--frame-customer-content-top',contentTop+'px');
 if(!desktop){
  const dock=document.getElementById('photographerStoreBottomNav');
  const bounds=dock?.getBoundingClientRect();
  // Use the real top of the bottom dock, including safe-area changes, instead
  // of reserving an approximate 70px that can leave a visible blank gap.
  // Embedded mobile shop is hosted below the *parent app's* bottom dock.
  // Its local dock is hidden, so reserving 70px inside the iframe creates
  // precisely the visible white gap reported at the bottom of the catalog.
  const visible=Boolean(bounds&&bounds.height>0&&getComputedStyle(dock).display!=='none');
  const space=visible?Math.max(0,Math.round(window.innerHeight-bounds.top)):0;
  if(document.documentElement.style.getPropertyValue('--frame-bottom-dock-space')!==space+'px')
   document.documentElement.style.setProperty('--frame-bottom-dock-space',space+'px');
 }
 if(shell){
  if(!frameShellTop)frameShellTop={value:shell.style.getPropertyValue('top'),priority:shell.style.getPropertyPriority('top')};
  if(shell.style.getPropertyValue('top')!==contentTop+'px')shell.style.setProperty('top',contentTop+'px','important');
 }
}
window.addEventListener('resize',()=>{if(customerFrame())requestAnimationFrame(positionFrameNavigation)},{passive:true});
function applyFrameCustomerView(){const enabled=customerFrame()&&!document.body.classList.contains('pbR96ChoosingStore');document.body.classList.toggle('frameCustomerStore',enabled);ensureFrameOrdersPanel(enabled);
 const backdrop=document.getElementById('saleCartBackdrop'),drawer=document.getElementById('saleCartDrawer');
 if(enabled&&drawer&&backdrop){
  if(!frameCartPortals)frameCartPortals=[backdrop,drawer].map(node=>({node,parent:node.parentNode,next:node.nextSibling}));
  if(backdrop.parentNode!==document.body)document.body.append(backdrop);
  if(drawer.parentNode!==document.body)document.body.append(drawer);
 }else if(!enabled&&frameCartPortals){
  for(const {node,parent,next}of frameCartPortals)if(parent?.isConnected)parent.insertBefore(node,next?.parentNode===parent?next:null);
  frameCartPortals=null;
 }
for(const el of document.querySelectorAll('.salesFilterDockV809,#saleFilterBarR68,#saleCartBtn,#saleBrandBtnR68,#rentalBrandBtnR68,#rentalCartBtnV810,#storeSectionNavV673,[data-store-panel=equipmentPanel],[data-store-panel=bookingsPanel]')){if(enabled){if(!frameHiddenControls.has(el))frameHiddenControls.set(el,{hidden:el.hidden,display:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.hidden=true;el.style.setProperty('display','none','important');}else if(frameHiddenControls.has(el)){const prior=frameHiddenControls.get(el);el.hidden=prior.hidden;if(prior.display)el.style.setProperty('display',prior.display,prior.priority);else el.style.removeProperty('display');frameHiddenControls.delete(el);}}for(const button of document.querySelectorAll('[data-store-panel=salesPanel]')){const label=button.querySelector('b')||button;if(enabled){if(!frameControlLabels.has(label))frameControlLabels.set(label,label.innerHTML);if(label.textContent!=='فروشگاه')label.textContent='فروشگاه';}else if(frameControlLabels.has(label)){label.innerHTML=frameControlLabels.get(label);frameControlLabels.delete(label);}}const bar=document.getElementById('photographerStoreIdentityBar');let nav=document.getElementById('frameCustomerNav');if(enabled){document.getElementById('pbR1123StoreDesktopNav')?.classList.add('frameDesktopHost')}else document.getElementById('pbR1123StoreDesktopNav')?.classList.remove('frameDesktopHost');if(enabled&&bar&&!nav){nav=document.createElement('nav');nav.id='frameCustomerNav';nav.setAttribute('aria-label','بخش‌های فروشگاه قاب');nav.innerHTML='<button type="button" data-frame-customer-view="salesPanel">فروشگاه</button><button type="button" data-frame-customer-view="financePanel">مالی</button><button type="button" data-frame-customer-view="frameOrdersPanel">سفارش‌ها</button><button type="button" data-frame-customer-history>سوابق خرید</button><button type="button" data-frame-customer-cart>سبد خرید <small data-frame-cart-count>۰</small></button>';bar.after(nav);new ResizeObserver(positionFrameNavigation).observe(bar);new MutationObserver(positionFrameNavigation).observe(bar,{attributes:true,attributeFilter:['style','class']});}

 const category=document.getElementById('saleCategoryBtnR68'),salesContent=document.getElementById('salesContent');
 if(enabled&&category&&salesContent){
  if(!categoryOrigin)categoryOrigin={parent:category.parentNode,next:category.nextSibling};
  let sub=salesContent.querySelector('#frameCustomerCategoryRow');
  if(!sub){sub=document.createElement('div');sub.id='frameCustomerCategoryRow';sub.className='frameCustomerCategoryRow';sub.innerHTML='<b>دسته‌بندی فروشگاه</b><div class="frameCustomerCategoryButton"></div>';salesContent.prepend(sub);}
  const slot=sub.querySelector('.frameCustomerCategoryButton');
  if(category.parentElement!==slot)slot.append(category);
 }else if(!enabled&&categoryOrigin&&category){
  const origin=categoryOrigin;
  if(origin.parent?.isConnected)origin.parent.insertBefore(category,origin.next?.parentElement===origin.parent?origin.next:null);
  salesContent?.querySelector('#frameCustomerCategoryRow')?.remove();
  categoryOrigin=null;
 }

 if(nav){nav.hidden=!enabled;nav.querySelectorAll('[data-frame-customer-view]').forEach(button=>{const panel=document.getElementById(button.dataset.frameCustomerView),active=panel?.classList.contains('mobileActive')&&(button.dataset.frameCustomerView!=='frameOrdersPanel'||frameOrderView==='orders');button.classList.toggle('active',Boolean(active));button.setAttribute('aria-current',active?'page':'false');});const history=nav.querySelector('[data-frame-customer-history]');if(history){const active=document.getElementById('frameOrdersPanel')?.classList.contains('mobileActive')&&frameOrderView==='history';history.classList.toggle('active',Boolean(active));history.setAttribute('aria-current',active?'page':'false');}const count=nav.querySelector('[data-frame-cart-count]'),old=document.getElementById('saleCartCount');if(count&&old)count.textContent=old.textContent;}
 for(const el of [bar,document.getElementById('storeIdentityToggle'),document.getElementById('photographerStoreHeaderName')].filter(Boolean)){if(enabled){if(!frameLayoutDisplays.has(el))frameLayoutDisplays.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.style.setProperty('display',window.matchMedia('(min-width:821px)').matches&&!document.documentElement.classList.contains('pb1126Embedded')?'none':el===bar?'grid':'block','important');}else if(frameLayoutDisplays.has(el)){const saved=frameLayoutDisplays.get(el);if(saved.value)el.style.setProperty('display',saved.value,saved.priority);else el.style.removeProperty('display');frameLayoutDisplays.delete(el);}}
 if(enabled&&bar){const names=bar.querySelectorAll('#photographerStoreHeaderName');for(const [index,name]of [...names].entries()){if(index===0){const raw=String(selectedShopRecord()?.name||'').trim();name.textContent=raw.startsWith('فروشگاه قاب و شاسی')?raw:'فروشگاه قاب و شاسی'+(raw?' '+raw:'');}else name.remove();}}
 // Make the real desktop header row show the store title instead of the
 // legacy «خرید تجهیزات / مالی» buttons. Keep the original buttons in the
 // DOM for non-frame store owners and revert cleanly on store switching.
 const desktopHost=document.getElementById('pbR1123StoreDesktopNav');
 let desktopTitle=desktopHost?.querySelector('#frameDesktopStoreTitle');
 const desktopFrame=enabled&&window.matchMedia('(min-width:821px)').matches&&!document.documentElement.classList.contains('pb1126Embedded');
 if(desktopFrame&&desktopHost){
  if(!desktopTitle){desktopTitle=document.createElement('strong');desktopTitle.id='frameDesktopStoreTitle';desktopHost.append(desktopTitle);}
  const value=bar?.querySelector('#photographerStoreHeaderName')?.textContent||'انتخاب فروشگاه';
  if(desktopTitle.textContent!==value)desktopTitle.textContent=value;
  if(desktopTitle.title!==value)desktopTitle.title=value;
 }else if(desktopTitle)desktopTitle.remove();
 if(enabled&&bar){
  if(!bar.dataset.frameBorderOriginal){
   bar.dataset.frameBorderOriginal=JSON.stringify({top:bar.style.getPropertyValue('border-top'),topPriority:bar.style.getPropertyPriority('border-top'),bottom:bar.style.getPropertyValue('border-bottom'),bottomPriority:bar.style.getPropertyPriority('border-bottom')});
  }
  bar.style.setProperty('border-top','0','important');
  bar.style.setProperty('border-bottom','0','important');
 }else if(!enabled&&bar?.dataset.frameBorderOriginal){
  try{const prev=JSON.parse(bar.dataset.frameBorderOriginal);for(const [side,value,priority]of [['top',prev.top,prev.topPriority],['bottom',prev.bottom,prev.bottomPriority]]){if(value)bar.style.setProperty('border-'+side,value,priority);else bar.style.removeProperty('border-'+side)}}catch{}
  delete bar.dataset.frameBorderOriginal;
 }
 const studio=document.getElementById('storePhotographerName');
 if(studio){
  const small=enabled&&window.matchMedia('(max-width:820px)').matches;
  if(small){
   if(!studio.dataset.frameNameStyleBackup)studio.dataset.frameNameStyleBackup=JSON.stringify(studio.getAttribute('style')||'');
   for(const [key,value]of [['white-space','normal'],['overflow','visible'],['text-overflow','clip'],['max-height','none'],['line-height','1.23'],['overflow-wrap','anywhere']]){
    if(studio.style.getPropertyValue(key)!==value||studio.style.getPropertyPriority(key)!=='important')studio.style.setProperty(key,value,'important');
   }
  }else if(studio.dataset.frameNameStyleBackup!==undefined){
   try{studio.setAttribute('style',JSON.parse(studio.dataset.frameNameStyleBackup))}catch{}
   delete studio.dataset.frameNameStyleBackup;
  }
 }
 if(enabled&&studio){const raw=typeof photographerMe!=='undefined'?(photographerMe?.user?.photographerName||photographerMe?.user?.studioName||photographerMe?.user?.name||studio.textContent):studio.textContent;const clean=String(raw||'').trim().replace(/^(?:عکاسی\s*)+/u,'').trim();const title=clean?'عکاسی '+clean:'عکاسی';if(studio.textContent!==title)studio.textContent=title;if(studio.title!==title)studio.title=title;}
 positionFrameNavigation();syncFrameFinance();}
if(typeof syncPhotographerStoreIdentity==='function'){const original=syncPhotographerStoreIdentity;syncPhotographerStoreIdentity=function(...args){original(...args);applyFrameCustomerView();};}
if(typeof showMobilePanel==='function'){const original=showMobilePanel;showMobilePanel=function(id){if(customerFrame()&&['storePanel','equipmentPanel','bookingsPanel'].includes(id))id='salesPanel';original(id);applyFrameCustomerView();};}

/* R1220: the frame photographer is a payer, not the shop owner. Keep underlying
   finance records unchanged and only relabel this customer's view. */
const frameFinanceOriginalLabels=new Map();
let frameLedgerWithDetails=false;
function frameFinanceLabel(el,label){
 if(!el)return;
 if(customerFrame()){
  if(!frameFinanceOriginalLabels.has(el))frameFinanceOriginalLabels.set(el,el.textContent);
  if(el.textContent!==label)el.textContent=label;
 }else if(frameFinanceOriginalLabels.has(el)){
  el.textContent=frameFinanceOriginalLabels.get(el);frameFinanceOriginalLabels.delete(el);
 }
}
function renderFrameStatementDetails(){
 const tbody=document.querySelector('#financePanel #ledger .accountingTable tbody');
 if(!tbody)return;
 tbody.querySelectorAll('.frameLedgerDetailsRow').forEach(row=>row.remove());
 if(!customerFrame()||!frameLedgerWithDetails||typeof financeStatementFilteredV812!=='function')return;
 const entries=financeStatementFilteredV812().slice().reverse();
 const rows=[...tbody.children].filter(el=>el.tagName==='TR');
 entries.forEach((entry,index)=>{
  const target=rows[index];if(!target)return;
  const date=entry.entry_date||entry.created_at;
  const details=[
   ['نوع سند',typeof accountTypeLabel==='function'?accountTypeLabel(entry.entry_type||''):(entry.entry_type||'گردش حساب')],
   ['شرح کامل',entry.description||'—'],
   ['تاریخ ثبت',date&&typeof dateFa==='function'?dateFa(date):'—'],
   ['ماهیت',entry.direction==='debit'?'بدهکار':'بستانکار'],
   ['مبلغ',typeof money==='function'?money(entry.amount||0):String(entry.amount||0)],
   ['شماره پیگیری',entry.reference_number||entry.payment_reference||entry.reference_id||entry.invoice_number||'—'],
   ['مرجع فاکتور',entry.invoice_id||'—'],
   ['روش پرداخت',entry.payment_method?(typeof financePaymentMethodLabelV811==='function'?financePaymentMethodLabelV811(entry):entry.payment_method):'—']
  ].filter(([key,value])=>value!==null&&value!==undefined&&value!==''&&(value!=='—'||['شرح کامل','شماره پیگیری'].includes(key)));
  const row=document.createElement('tr');row.className='frameLedgerDetailsRow';
  const cell=document.createElement('td');cell.colSpan=target.children.length||6;
  const wrap=document.createElement('div');wrap.className='frameLedgerDetailsGrid';
  for(const [key,value]of details){
   const item=document.createElement('div'),label=document.createElement('small'),text=document.createElement('b');
   label.textContent=key;text.textContent=String(value);item.append(label,text);wrap.append(item);
  }
  cell.append(wrap);row.append(cell);target.after(row);
 });
}
function syncFrameFinance(){
 const frame=customerFrame(),panel=document.getElementById('financePanel');
 if(!panel)return;
 frameFinanceLabel(panel.querySelector('[data-finance-tab-v811="payments"]'),'پرداختی‌ها');
 frameFinanceLabel(panel.querySelector('.financeSectionHeadingV815 small'),'وضعیت حساب، فاکتورها، پرداختی‌ها و حساب معین فروشگاه');
 const empty=panel.querySelector('#financePaymentsV811 .empty');
 if(frame&&empty&&empty.textContent.includes('دریافتی'))empty.textContent=empty.textContent.replace(/دریافتی/g,'پرداختی');
 const toolbar=panel.querySelector('.statementToolbarV812');
 let toggle=panel.querySelector('#frameFinanceDetailsToggle');
 if(!frame){toggle?.remove();panel.querySelectorAll('.frameLedgerDetailsRow').forEach(el=>el.remove());return;}
 if(toolbar&&!toggle){
  toggle=document.createElement('button');toggle.type='button';toggle.id='frameFinanceDetailsToggle';
  toggle.className='btn secondary frameFinanceDetailsToggle';toggle.textContent='با جزئیات';
  toolbar.append(toggle);
 }
 if(toggle){toggle.setAttribute('aria-pressed',String(frameLedgerWithDetails));toggle.classList.toggle('active',frameLedgerWithDetails);}
 renderFrameStatementDetails();
}
if(typeof renderFinance==='function'){
 const frameOriginalFinanceRender=renderFinance;
 renderFinance=function(...args){const result=frameOriginalFinanceRender.apply(this,args);syncFrameFinance();return result;};
}
if(typeof renderFinanceStatementV812==='function'){
 const frameOriginalStatementRender=renderFinanceStatementV812;
 renderFinanceStatementV812=function(...args){const result=frameOriginalStatementRender.apply(this,args);syncFrameFinance();return result;};
}
document.addEventListener('click',e=>{
 if(!customerFrame()||!e.target.closest('#frameFinanceDetailsToggle'))return;
 frameLedgerWithDetails=!frameLedgerWithDetails;
 syncFrameFinance();
});

const updateCart=renderSaleCart;renderSaleCart=function(...args){updateCart(...args);applyFrameCustomerView();};
document.addEventListener('click',e=>{if(!customerFrame()||document.body.classList.contains('pbR96ChoosingStore'))return;
 const history=e.target.closest('[data-frame-customer-history]');
 if(history&&window.matchMedia('(min-width:821px)').matches){e.preventDefault();frameOrderView='history';openStoreSection('frameOrdersPanel');renderFrameOrderRows();applyFrameCustomerView();void loadSales();return;}
 const view=e.target.closest('[data-frame-customer-view]');if(view){if(view.dataset.frameCustomerView==='frameOrdersPanel')frameOrderView='orders';openStoreSection(view.dataset.frameCustomerView);if(view.dataset.frameCustomerView==='frameOrdersPanel'){renderFrameOrderRows();void loadSales();}applyFrameCustomerView();return;}if(e.target.closest('[data-frame-customer-categories]')){openStoreSection('salesPanel');document.getElementById('saleCategoryBtnR68')?.click();return;}if(e.target.closest('[data-frame-customer-cart]'))openSaleCart();if(e.target.closest('[data-frame-order-refresh]'))void loadSales();});
window.addEventListener('resize',positionFrameNavigation);
const customerStyle=document.createElement('style');customerStyle.textContent=`
.frameCustomerStore #storeSectionNavV673,.frameCustomerStore #pbR1123StoreDesktopNav,.frameCustomerStore [data-store-panel=equipmentPanel],.frameCustomerStore [data-store-panel=bookingsPanel],.frameCustomerStore #rentalCartBtnV810,.frameCustomerStore #saleFilterBarR68,.frameCustomerStore #saleBrandBtnR68,.frameCustomerStore #rentalBrandBtnR68,.frameCustomerStore #photographerStoreIdentityBar .storeIdentityLabel,.frameCustomerStore #photographerStoreIdentityBar [data-shop-category],.frameCustomerStore #storeIdentityActionsV809{display:none!important}
.frameCustomerStore #photographerStoreIdentityBar{display:grid!important;grid-template-columns:minmax(0,1fr)!important;height:48px!important;min-height:48px!important;max-height:48px!important;padding:4px 12px!important;align-items:center!important;overflow:hidden!important}
.frameCustomerStore #photographerStoreIdentityBar>#storeIdentityToggle{position:static!important;inset:auto!important;transform:none!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto!important;padding:0!important;margin:0!important;display:block!important;text-align:center!important}
.frameCustomerStore #photographerStoreIdentityBar #photographerStoreHeaderName{display:block!important;position:static!important;transform:none!important;margin:0!important;font-size:16px!important;line-height:24px!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-align:center!important}
.frameCustomerStore #photographerStoreHeaderName::before,.frameCustomerStore #photographerStoreHeaderName::after{content:none!important}
#frameCustomerNav[hidden],body:not(.frameCustomerStore) #frameCustomerNav{display:none!important}
.frameCustomerStore #frameCustomerNav{position:fixed;top:var(--frame-customer-nav-top,112px);left:0;right:0;height:44px;z-index:510;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:4px max(10px,calc((100vw - 1120px)/2));background:#fff;border-bottom:1px solid #dbe5f2}
#frameCustomerNav button{font:inherit;font-size:13px;white-space:nowrap;border:1px solid #dbe5f2;border-radius:8px;background:#fff;padding:6px 4px;color:#101828;cursor:pointer}#frameCustomerNav #saleCategoryBtnR68{min-height:34px!important;height:34px!important;padding:3px!important}#frameCustomerNav #saleCategoryBtnR68 small{display:inline!important;font-size:12px!important;background:transparent;padding:0}#frameCustomerNav #saleCategoryBtnR68 b{display:none!important}#frameCustomerNav button.active{color:#315efb;border-color:#315efb}#frameCustomerNav small{font-size:10px;background:#eef3ff;border-radius:8px;padding:1px 4px}
html.pb1126Embedded body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar{top:0!important}html.pb1126Embedded body.frameCustomerStore #storePhotographerWorkspace>.shell{top:var(--frame-customer-content-top,92px)!important;padding-top:0!important}.frameCustomerStore #storePhotographerWorkspace>.shell{padding-top:0!important;top:var(--frame-customer-content-top,156px)!important}.frameCustomerStore .salesFilterDockV809 .pbR68FilterBar{grid-template-columns:1fr!important}.frameCustomerStore #saleCategoryBtnR68{width:100%!important}.frameCustomerStore #mobilePanelTitleBar{display:none!important}
@media(max-width:600px){#frameCustomerNav button{font-size:12px}.frameCustomerStore #photographerStoreIdentityBar #photographerStoreHeaderName{font-size:14px!important}}

.frameCustomerStore #frameCustomerNav [data-frame-customer-cart]{background:#f59e0b!important;border-color:#d97706!important;color:#101828!important;font-weight:800}#frameCustomerNav [data-frame-customer-cart] small{background:#ffffffa6;color:#101828}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{background:#fff!important;background-image:none!important;box-shadow:none!important;filter:none!important;border:0!important;border-top:1px solid #dbe5f2!important;border-bottom:1px solid #dbe5f2!important}
.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar::before,.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar::after{display:none!important;content:none!important}
.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #storeIdentityToggle,.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #photographerStoreHeaderName{position:static!important;inset:auto!important;transform:none!important;display:block!important;width:100%!important;max-width:100%!important;padding:0!important;margin:0!important;text-align:center!important;background:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;filter:none!important}
@media(max-width:820px){
 .frameCustomerStore #frameCustomerNav{height:84px;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:34px 34px;gap:6px;padding:5px 10px}
 #frameCustomerNav [data-frame-customer-view=salesPanel]{grid-area:1/1}#frameCustomerNav [data-frame-customer-view=financePanel]{grid-area:1/2}#frameCustomerNav [data-frame-customer-view=frameOrdersPanel]{grid-area:1/3}#frameCustomerNav [data-frame-customer-cart]{grid-area:1/4}#frameCustomerNav #saleCategoryBtnR68{grid-area:2/1/3/5}
 /* Preserve the native photographer header and its portrait, identity and action alignment. */
 .frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .workspaceIdentity,.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .workspaceIdentityCopy{min-width:0!important}
 .frameCustomerStore #storePhotographerWorkspace #storePhotographerName{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
 .frameCustomerStore #salesPanel .frameProductCard .frameSizePriceRow{margin:8px 0 3px!important}.frameCustomerStore #salesPanel .frameProductCard .saleItemBuy{margin-top:0!important;align-items:flex-start!important}.frameCustomerStore .frameProductCard .saleItemBuy>.field>span:first-child{display:none!important}
}

.frameCustomerStore #salesContent>h3{display:none!important}
.frameCustomerStore #frameOrdersPanel{min-width:0}
.frameCustomerStore .frameOrdersHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.frameCustomerStore .frameOrdersHead h2{margin:0;font-size:16px}
.frameCustomerStore .frameOrdersHead button{font:inherit;font-size:11px;border:1px solid #dbe5f2;background:#fff;color:#315efb;border-radius:8px;padding:8px 12px}
.frameCustomerStore #saleOrders{display:grid;gap:10px}
.frameCustomerStore #saleOrders .saleOrderCustomer{padding:12px!important;border:1px solid #e4e7ec;border-radius:12px;background:#fff;min-width:0}
.frameCustomerStore .frameOrderStepper{display:flex;align-items:flex-start;margin-top:12px;direction:rtl;width:100%;gap:0}
.frameCustomerStore .frameOrderStep{flex:1;min-width:0;text-align:center;position:relative}
.frameCustomerStore .frameOrderStep:not(:last-child):after{content:'';position:absolute;top:11px;left:-50%;width:100%;height:2px;background:#d0d5dd;z-index:0}
.frameCustomerStore .frameOrderStep.complete:not(:last-child):after{background:#315efb}
.frameCustomerStore .frameOrderCircle{display:grid;place-items:center;width:24px;height:24px;border:2px solid #d0d5dd;border-radius:50%;background:#fff;color:#667085;margin:0 auto 5px;position:relative;z-index:1;font-size:11px}
.frameCustomerStore .frameOrderStep.complete .frameOrderCircle{background:#315efb;border-color:#315efb;color:#fff}
.frameCustomerStore .frameOrderStep.current .frameOrderCircle{box-shadow:0 0 0 3px #dbe4ff}
.frameCustomerStore .frameOrderStep small{display:block;white-space:normal;font-size:9px;line-height:1.5;color:#667085}
.frameCustomerStore .frameOrderCancelled{font-size:11px;color:#b42318;margin-top:9px}
.frameCustomerStore #saleCartDrawer .saleCartLines{padding:5px 10px}
.frameCustomerStore #saleCartDrawer .saleCartLine{grid-template-columns:38px minmax(0,1fr) auto;gap:7px;padding:7px 0}
.frameCustomerStore #saleCartDrawer .saleCartLine img,.frameCustomerStore #saleCartDrawer .saleCartPhotoPlaceholder{width:38px;height:38px;border-radius:7px}
.frameCustomerStore #saleCartDrawer .saleCartLine b{font-size:10.5px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.frameCustomerStore #saleCartDrawer .saleCartLine small{font-size:9px;line-height:1.4}.frameCustomerStore #saleCartDrawer .frameCartVariant{font-size:9px;color:#475467;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.frameCustomerStore #saleCartDrawer .saleCartQty{gap:2px}
.frameCustomerStore #saleCartDrawer .saleCartQty button{width:23px;height:23px}
.frameCustomerStore #saleCartDrawer .saleCartQty span{min-width:17px;font-size:9px}
.frameCustomerStore #saleCartDrawer .saleCartRemove{font-size:9px;padding:0}
.frameCustomerStore #salesCheckoutNotice{display:none!important}
.frameCustomerStore #saleCartDrawer #saleCartCheckoutHint{font-size:10px;line-height:1.5}
@media(max-width:820px){.frameCustomerStore #frameCustomerNav button{font-size:11px}.frameCustomerStore .frameOrderStep small{font-size:8px}}

/* R1218: the photographer/store separator is a real line, not a shadow or pale-blue glow. */
html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader{border-bottom:1px solid #ccd7e5!important;box-shadow:none!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{background:#fff!important;background-image:none!important;background-color:#fff!important;box-shadow:none!important;filter:none!important;text-shadow:none!important;border:0!important;border-top:1px solid #ccd7e5!important;border-bottom:1px solid #ccd7e5!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar #storeIdentityToggle,html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar #photographerStoreHeaderName{background:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;filter:none!important}
html body.frameCustomerStore #storePhotographerWorkspace>.shell{background:#f5f7fb!important;background-image:none!important}
.frameCustomerStore #frameSizeSheet,.frameSizeSheet{position:fixed;inset:0;z-index:2147483000;display:grid;align-items:end;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
.frameSizeSheet *{font-family:Vazirmatn,Tahoma,Arial,sans-serif!important;box-sizing:border-box}
.frameSizeBackdrop{position:absolute;inset:0;background:rgba(15,23,42,.48);border:0;width:100%;cursor:pointer}
.frameSizeDialog{position:relative;z-index:1;background:#fff;border-radius:22px 22px 0 0;width:100%;max-height:min(74dvh,650px);display:flex;flex-direction:column;overflow:hidden;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -12px 48px #10182826;text-align:right}
.frameSizeDialog header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e4e7ec;padding:15px 16px}
.frameSizeDialog header b{font-size:16px;color:#101828}
.frameSizeDialog header small{display:block;font-size:11px;color:#667085;margin-top:4px}
.frameSizeDialog header button{background:#f2f4f7;border:0;border-radius:9px;width:34px;height:34px;font-size:22px}
.frameSizeOptions{overflow-y:auto;overscroll-behavior:contain;padding:8px 12px 16px;display:grid;gap:7px}
.frameSizeOptions button{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;width:100%;background:#fff;border:1px solid #e4e7ec;border-radius:11px;color:#344054;text-align:right;min-height:45px;font-size:14px;cursor:pointer}
.frameSizeOptions button[aria-selected="true"]{border-color:#315efb;background:#eef2ff;color:#315efb;font-weight:900}
@media(max-width:820px){
 .frameCustomerStore #saleItems .frameSizePriceRow label{position:relative}
 .frameCustomerStore #saleItems .frameSizePriceRow select[data-frame-choice="size"]{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important;padding:0!important;border:0!important}
 .frameCustomerStore .frameSizeTrigger{display:flex!important;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:40px;padding:7px 10px;background:#fff;border:1px solid #dbe5f2;border-radius:9px;color:#344054;font:800 13px Vazirmatn,Tahoma,Arial,sans-serif;direction:rtl;text-align:right}
 .frameCustomerStore #salesPanel .frameProductCard .saleItemBuy{align-items:center!important;margin-top:5px!important}
 .frameCustomerStore #salesPanel .frameProductCard .saleItemBuy>.btn{min-height:34px!important;height:34px!important;margin-top:3px!important;align-self:center!important}
}
@media(min-width:821px){.frameSizeTrigger{display:none!important}}

.frameCheckoutDialog{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:14px;direction:rtl;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
.frameCheckoutDialog *{box-sizing:border-box;font-family:Vazirmatn,Tahoma,Arial,sans-serif!important}
.frameCheckoutBackdrop{position:absolute;inset:0;background:rgba(15,23,42,.5);border:0;cursor:pointer}
.frameCheckoutCard{position:relative;z-index:1;background:#fff;box-shadow:0 20px 65px #10182840;border:1px solid #e4e7ec;border-radius:18px;width:min(440px,100%);max-height:calc(100dvh - 24px);overflow-y:auto;text-align:right;color:#101828}
.frameCheckoutCard header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:15px 17px;border-bottom:1px solid #e4e7ec}
.frameCheckoutCard header b{font-size:17px;line-height:1.5}.frameCheckoutCard header small{display:block;font-size:11px;color:#667085;margin-top:4px}
.frameCheckoutCard header button{width:34px;height:34px;border:0;border-radius:9px;background:#f2f4f7;color:#344054;font-size:21px}
.frameCheckoutBody{padding:17px;display:grid;gap:10px;font-size:13px;line-height:1.85}
.frameCheckoutBody p{margin:0}.frameCheckoutBody .frameCheckoutPayment{font-size:11px;color:#667085}
.frameCheckoutSummary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:#f8fafc;border:1px solid #eef1f5;border-radius:10px}
.frameCheckoutSummary b{color:#101828;text-align:left;font-size:13px}
.frameCheckoutCard footer{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:13px 17px 17px;border-top:1px solid #e4e7ec}
.frameCheckoutCard footer button{font-size:13px;font-weight:800;min-height:44px;padding:10px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;color:#344054;cursor:pointer}
.frameCheckoutCard footer .frameCheckoutSubmit{background:#315efb;color:#fff;border-color:#315efb}
@media(max-width:600px){.frameCheckoutDialog{align-items:end;padding:0}.frameCheckoutCard{width:100%;border-radius:22px 22px 0 0;max-height:90dvh;padding-bottom:env(safe-area-inset-bottom,0px)}.frameCheckoutCard footer{padding-bottom:17px}}

/* Ensure the desktop parent stays visible after legacy r1123 hiding rules,
   even when the frame navigation has been physically moved into that parent. */
@media(min-width:821px){
html body.frameCustomerStore #pbR1123StoreDesktopNav{display:flex!important;visibility:visible!important;opacity:1!important;position:relative!important;min-width:0!important;pointer-events:auto!important}
html body.frameCustomerStore #pbR1123StoreDesktopNav #frameCustomerNav{display:flex!important;visibility:visible!important;opacity:1!important}
}
/* R1218 customer navigation: replace the two redundant desktop shop header items with
   the real Store/Finance/Orders/Cart controls; keep categories beneath Store. */
body.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav{display:flex!important;align-items:center!important;justify-content:center!important;gap:0!important;min-width:0!important}
body.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav>button{display:none!important}
body.frameCustomerStore #frameCustomerCategoryRow{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:8px 12px;margin:0 0 12px;background:#fff;border:1px solid #e4e7ec;border-radius:11px}
body.frameCustomerStore #frameCustomerCategoryRow>b{font-size:12px;font-weight:900;line-height:1.6;color:#344054;flex:0 0 auto}
body.frameCustomerStore #frameCustomerCategoryRow .frameCustomerCategoryButton{flex:0 1 220px;min-width:0}
body.frameCustomerStore #frameCustomerCategoryRow #saleCategoryBtnR68{display:flex!important;align-items:center;justify-content:space-between;width:100%!important;min-width:0!important;height:36px!important;min-height:36px!important;padding:7px 10px!important;background:#f8fafc!important;border:1px solid #dbe5f2!important;border-radius:8px!important;color:#344054!important;font:800 11px Vazirmatn,Tahoma,Arial,sans-serif!important}
body.frameCustomerStore #frameCustomerCategoryRow #saleCategoryBtnR68 small{display:inline!important;font-size:11px!important}
body.frameCustomerStore #frameCustomerCategoryRow #saleCategoryBtnR68 b{display:inline!important;max-width:65%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px!important}
@media(min-width:821px){
 body.frameCustomerStore #photographerStoreRoleHeader #frameCustomerNav{position:relative!important;inset:auto!important;top:auto!important;right:auto!important;left:auto!important;bottom:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;width:max-content!important;max-width:100%!important;height:44px!important;min-height:0!important;margin:0!important;padding:0 4px!important;gap:5px!important;border:0!important;background:transparent!important;box-shadow:none!important;z-index:auto!important}
 body.frameCustomerStore #photographerStoreRoleHeader #frameCustomerNav button{flex:0 1 auto!important;min-height:36px!important;height:36px!important;padding:7px 10px!important;font-size:12px!important;white-space:nowrap!important;border:0!important;border-bottom:3px solid transparent!important;border-radius:0!important;background:transparent!important}
 body.frameCustomerStore #photographerStoreRoleHeader #frameCustomerNav button.active{border-bottom-color:#315efb!important;color:#315efb!important}
 body.frameCustomerStore #photographerStoreRoleHeader #frameCustomerNav [data-frame-customer-cart]{background:#fff3cf!important;border:1px solid #f59e0b!important;border-radius:8px!important;min-height:34px!important;height:34px!important}
 body.frameCustomerStore #storeSectionNavV673{display:none!important}
 body.frameCustomerStore #storePhotographerWorkspace>.shell{top:var(--frame-customer-content-top,112px)!important}
}
@media(max-width:820px){
 body.frameCustomerStore #frameCustomerNav{height:44px!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:36px!important;padding:4px 8px!important}
 body.frameCustomerStore #frameCustomerNav [data-frame-customer-view=salesPanel]{grid-area:1/1!important}
 body.frameCustomerStore #frameCustomerNav [data-frame-customer-view=financePanel]{grid-area:1/2!important}
 body.frameCustomerStore #frameCustomerNav [data-frame-customer-view=frameOrdersPanel]{grid-area:1/3!important}
 body.frameCustomerStore #frameCustomerNav [data-frame-customer-cart]{grid-area:1/4!important}
 body.frameCustomerStore #frameCustomerCategoryRow{padding:7px 9px;gap:8px}
 body.frameCustomerStore #frameCustomerCategoryRow .frameCustomerCategoryButton{flex:1;max-width:220px}
}

body.frameCustomerStore #saleCartDrawer{position:fixed!important;top:0!important;bottom:0!important;left:0!important;height:100dvh!important;max-height:100dvh!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;overflow:hidden!important;z-index:5201!important}
body.frameCustomerStore #saleCartDrawer .saleCartLines{overflow-y:auto!important;min-height:0!important;overscroll-behavior:contain}
body.frameCustomerStore #saleCartDrawer .saleCartFooter{position:relative!important;bottom:auto!important;display:grid!important;flex:0 0 auto!important;max-height:none!important}
body.frameCustomerStore #saleCartBackdrop{position:fixed!important;inset:0!important;z-index:5200!important}

/* Paint explicit one-pixel separators even when a legacy inline border reset wins. */
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{position:fixed!important;isolation:isolate!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::before,
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::after{content:""!important;display:block!important;position:absolute!important;left:0!important;right:0!important;width:100%!important;height:1px!important;background:#ccd7e5!important;pointer-events:none!important;z-index:2!important;border:0!important;box-shadow:none!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::before{top:0!important;bottom:auto!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::after{bottom:0!important;top:auto!important}


html body.frameCustomerStore #saleCartBackdrop[hidden]{display:none!important;visibility:hidden!important;pointer-events:none!important}
html body.frameCustomerStore #saleCartDrawer:not(.open){display:none!important;visibility:hidden!important;pointer-events:none!important}
/* Explicitly override legacy drawer translation on the active state. Legacy CSS
   kept translateX(-105%) despite .open, leaving Checkout fully offscreen. */
html body.frameCustomerStore #saleCartDrawer.open{left:0!important;right:auto!important;transform:none!important;translate:none!important;visibility:visible!important;pointer-events:auto!important;transition:none!important}
@media(max-width:820px){
 html body.frameCustomerStore #saleCartDrawer.open{top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%!important;height:min(89dvh,760px)!important;max-height:calc(100dvh - 6px)!important;transform:translate3d(0,0,0)!important}
}
@media(min-width:821px){
html body.frameCustomerStore #pbR1123StoreDesktopNav>button{display:none!important}
html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar .storeIdentityActionsV809,
html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar .storeHeaderActionV809,
html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar [data-store-panel]{display:none!important}
html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar{height:36px!important;min-height:36px!important;max-height:36px!important;padding:2px 12px!important}
}

/* R1220 · frame storefront only, mobile header, checkout and ledger refinements. */
@media(max-width:820px){
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader{border-bottom:0!important;box-shadow:none!important;filter:none!important}
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  background:#fff!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;
  filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #storeIdentityToggle,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #photographerStoreHeaderName{
  background:transparent!important;background-image:none!important;box-shadow:none!important;text-shadow:none!important;filter:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::before,
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::after{
  background:#ccd7e5!important;
  -webkit-mask-image:linear-gradient(to right,transparent 0%,#000 8%,#000 92%,transparent 100%)!important;
  mask-image:linear-gradient(to right,transparent 0%,#000 8%,#000 92%,transparent 100%)!important
 }
 html body.frameCustomerStore #saleCartDrawer #saleCartCheckout:not(:disabled){
  background:#2154e8!important;background-image:linear-gradient(135deg,#3168ff,#1d4ed8)!important;
  color:#fff!important;opacity:1!important;filter:none!important;border:1px solid #1d4ed8!important;
  box-shadow:0 4px 13px rgba(29,78,216,.3)!important;font-weight:900!important
 }
 html body.frameCustomerStore #saleCartDrawer #saleCartCheckout:disabled{opacity:.5!important;box-shadow:none!important}
}
body.frameCustomerStore #saleCartDrawer .paymentPendingNote,
body.frameCustomerStore #saleCartDrawer .approvalNotice{display:none!important}
body.frameCustomerStore #financePanel .frameFinanceDetailsToggle{flex:0 0 auto;width:auto;min-height:38px;padding:7px 13px;border:1px solid #cbd5e1;background:#fff;color:#344054;font:800 12px Vazirmatn,Tahoma,Arial,sans-serif}
body.frameCustomerStore #financePanel .frameFinanceDetailsToggle.active{background:#315efb!important;color:#fff!important;border-color:#315efb!important}
body.frameCustomerStore #financePanel .frameLedgerDetailsRow>td{background:#f8faff!important;padding:10px!important;border-bottom:1px solid #e5eaf4!important}
body.frameCustomerStore #financePanel .frameLedgerDetailsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;direction:rtl;text-align:right;white-space:normal}
body.frameCustomerStore #financePanel .frameLedgerDetailsGrid>div{display:flex;flex-direction:column;gap:2px;min-width:0;overflow-wrap:anywhere}
body.frameCustomerStore #financePanel .frameLedgerDetailsGrid small{font-size:10px;color:#667085}
body.frameCustomerStore #financePanel .frameLedgerDetailsGrid b{font-size:11px;color:#101828;font-weight:750}

/* R1221: shared frame shop preview & shopper cart. */
html body.frameCustomerStore #salesCheckoutNotice,
html body.frameCustomerStore #saleCartDrawer .approvalNotice,
html body.frameCustomerStore #saleCartDrawer .paymentPendingNote{display:none!important}
html body.pbR96ChoosingStore #frameCustomerNav{display:none!important}
html body.pbR96ChoosingStore.frameCustomerStore #storePhotographerWorkspace>.shell{top:var(--pb-store-chooser-top,0px)!important}
html body.frameCustomerStore #salesPanel .frameProductCard .saleItemBuy{align-items:center!important}
html body.frameCustomerStore #salesPanel .frameProductCard .saleItemBuy>.btn{
 display:flex!important;justify-content:center!important;align-items:center!important;
 margin-top:0!important;align-self:center!important;min-height:34px!important;height:34px!important;
 padding:5px 8px!important;white-space:nowrap!important;font-size:12px!important;line-height:1.2!important;
 transform:translateY(-1px)
}
html body.frameCustomerStore #salesPanel .frameProductCard .saleItemBuy .qtyStepperV810{
 height:34px!important;min-height:34px!important;align-items:center!important
}
html body.frameCustomerStore #pb834ShopGallery .pb834ShopGalleryNav.prev{
 left:10px!important;right:auto!important;direction:ltr!important
}
html body.frameCustomerStore #pb834ShopGallery .pb834ShopGalleryNav.next{
 right:10px!important;left:auto!important;direction:ltr!important
}
html body.frameCustomerStore #pb834ShopGallery .pb834ShopGalleryHead{
 display:flex!important;flex-wrap:nowrap!important;gap:7px!important;align-items:center!important;min-width:0
}
html body.frameCustomerStore #pb834ShopGallery #pb834ShopGalleryTitle{
 display:block!important;flex:1 1 auto!important;min-width:0!important;max-width:100%;
 font-size:clamp(10px,2.9vw,13px)!important;line-height:1.4!important;
 overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important
}
html body.frameCustomerStore #pb834ShopGallery #pb834ShopGalleryClose{flex:0 0 34px!important}
/* The old store CSS sets transition:none and transform:none with !important.
   Use an explicit entering class so the drawer starts below the viewport. */
html body.frameCustomerStore #saleCartDrawer.open{
 transform:translate3d(0,0,0)!important;translate:none!important;
 transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .22s ease!important;
 will-change:transform
}
html body.frameCustomerStore #saleCartDrawer.open.frameCartMotionStart{
 transform:translate3d(-105%,0,0)!important;opacity:.97!important;transition:none!important
}
@media(max-width:820px){
 html body.frameCustomerStore #saleCartDrawer.open.frameCartMotionStart{
  transform:translate3d(0,105%,0)!important;opacity:.97!important
 }
}
@media(prefers-reduced-motion:reduce){
 html body.frameCustomerStore #saleCartDrawer.open{transition:none!important;will-change:auto}
}

/* R1222: mobile studio/store geometry uses one measured header boundary.
   No blue halo or late transition is allowed on these static header labels. */
@media(max-width:820px){
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreRoleHeader#photographerStoreRoleHeader{
  height:85px!important;min-height:85px!important;max-height:85px!important;
  overflow:visible!important;box-shadow:none!important;filter:none!important;
  border:0!important;background-image:none!important;
  transition:none!important;animation:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreRoleHeader#photographerStoreRoleHeader::before{
  content:none!important;display:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreRoleHeader#photographerStoreRoleHeader::after{
  content:none!important;display:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .workspaceIdentity,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .workspaceIdentityCopy{
  min-width:0!important;max-width:100%!important;overflow:visible!important;
  transition:none!important;animation:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader #storePhotographerName{
  display:block!important;white-space:normal!important;overflow:visible!important;
  text-overflow:clip!important;overflow-wrap:anywhere!important;word-break:normal!important;
  max-height:none!important;max-width:100%!important;line-height:1.23!important;
  font-size:clamp(10px,2.9vw,12.5px)!important;letter-spacing:0!important;
  text-shadow:none!important;filter:none!important;animation:none!important;transition:none!important;
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader #storePhotographerManager,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .todayStamp,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreRoleHeader .workspaceIdentityMeta{
  animation:none!important;transition:none!important;text-shadow:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  border:0!important;box-shadow:0 14px 27px -14px rgba(38,126,246,.27),0 24px 42px -23px rgba(38,126,246,.14)!important;filter:none!important;
  background:#fff!important;background-image:none!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  text-shadow:none!important;animation:none!important;transition:none!important;
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::before{
  display:none!important;content:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::after{
  display:none!important;content:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #storeIdentityToggle,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #photographerStoreHeaderName{
  box-shadow:none!important;text-shadow:none!important;background:transparent!important;background-image:none!important;
  filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  animation:none!important;transition:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #storeIdentityToggle::before,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #storeIdentityToggle::after,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #photographerStoreHeaderName::before,
 html body.frameCustomerStore #storePhotographerWorkspace #photographerStoreIdentityBar #photographerStoreHeaderName::after{
  display:none!important;content:none!important
 }
 /* Keep the category row comfortably below the buttons/navigation strip. */
 html body.frameCustomerStore #salesPanel #frameCustomerCategoryRow{margin-top:18px!important;margin-bottom:15px!important}
 html body.frameCustomerStore #frameCustomerNav{animation:none!important;transition:none!important}
 html body.frameCustomerStore #frameCustomerNav button{animation:none!important;transition:none!important}
}

/* R1226: the blue shop-title glow belongs behind the mobile navigation,
   not under a solid white ribbon. Keep the actual buttons fully opaque. */
@media(max-width:820px){
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreRoleHeader#photographerStoreRoleHeader{
  border-bottom:1px solid #c3d3e5!important;
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  border-top:0!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav{
  background:transparent!important;background-color:transparent!important;
  background-image:none!important;opacity:1!important;
  border:0!important;border-bottom:0!important;
  box-shadow:none!important;filter:none!important;overflow:visible!important;
  isolation:isolate!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav::before{
  content:""!important;display:block!important;position:absolute!important;
  inset:-9px -12px -18px!important;z-index:-1!important;pointer-events:none!important;
  /* R1227: softer and more diffused than the previous concentrated blue rim. */
  background:radial-gradient(ellipse 115% 155% at 50% 12%,rgba(42,126,246,.13) 0%,rgba(54,142,250,.065) 49%,rgba(54,142,250,0) 100%)!important;
  border:0!important;box-shadow:none!important;opacity:1!important;
  filter:blur(8px)!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button{
  background:#fff!important;background-color:#fff!important;background-image:none!important;
  opacity:1!important;filter:none!important;backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;box-shadow:none!important;
  color:#273649!important;border:1px solid #cbd8e8!important;
  font-weight:850!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button.active{
  background:#fff!important;background-color:#fff!important;
  color:#2457e6!important;border-color:#7d9ef5!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-cart]{
  background:#fff!important;background-color:#fff!important;
  border:1px solid #e9ac35!important;color:#a45d0a!important;
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-cart] small{
  opacity:1!important;background:#fff3d6!important;color:#995007!important;
 }
}
`;document.head.append(customerStyle);applyFrameCustomerView();

/* Frame previews can render the old red «پیش‌خرید» notice even when there is
   no frameCustomerStore body class yet. Suppress it at its actual render source. */
if(typeof renderShopperWallet==='function'){
 const priorShopperWallet=renderShopperWallet;
 renderShopperWallet=function(...args){
  const result=priorShopperWallet.apply(this,args),notice=document.getElementById('salesCheckoutNotice');
  if(notice){const production=isFrame();notice.hidden=production;if(production){notice.replaceChildren();notice.style.setProperty('display','none','important')}else notice.style.removeProperty('display');}
  return result;
 };
}
/* The inline card gallery already uses left=previous/right=next. Match the
   full-screen preview (including keyboard keys) to that same direction. */
if(typeof pb834RenderShopGallery==='function'){
 const previousGalleryRender=pb834RenderShopGallery;
 let previewToken=0;
 pb834RenderShopGallery=function(...args){
  if(!customerFrame())return previousGalleryRender.apply(this,args);
  const st=typeof pb834ShopGalleryState!=='undefined'?pb834ShopGalleryState:null;
  const stage=document.getElementById('pb834ShopGalleryStage');
  const thumbs=document.getElementById('pb834ShopGalleryThumbs');
  const available=st?.urls?.map((_,i)=>i).filter(i=>!st.bad.has(i))||[];
  if(!stage||!thumbs||!available.length)return previousGalleryRender.apply(this,args);
  if(!available.includes(st.index))st.index=available[0];
  const key=JSON.stringify([st.urls,st.thumbUrls,st.title,available]);
  const previous=stage.querySelector('img');
  const sameGallery=stage.dataset.frameStableGallery===key&&previous?.isConnected;
  if(!sameGallery){
   const value=previousGalleryRender.apply(this,args);
   stage.dataset.frameStableGallery=key;
   const prev=stage.querySelector('.pb834ShopGalleryNav.prev'),next=stage.querySelector('.pb834ShopGalleryNav.next');
   if(prev){prev.textContent='‹';prev.setAttribute('aria-label','عکس قبلی');}
   if(next){next.textContent='›';next.setAttribute('aria-label','عکس بعدی');}
   return value;
  }
  const title=document.getElementById('pb834ShopGalleryTitle');
  const label=st.title+' · '+fa(available.indexOf(st.index)+1)+' از '+fa(available.length);
  if(title&&title.textContent!==label)title.textContent=label;
  const src=st.urls[st.index];
  if(previous.getAttribute('src')!==src){
   // Keep the previous decoded photo in place until the next one has loaded.
   const token=++previewToken,newImage=new Image();
   newImage.onload=()=>{
    const ready=typeof newImage.decode==='function'?newImage.decode().catch(()=>{}):Promise.resolve();
    ready.then(()=>{if(token===previewToken&&previous.isConnected&&typeof pb834ShopGalleryState!=='undefined'&&pb834ShopGalleryState===st&&st.urls[st.index]===src)previous.setAttribute('src',src)});
   };
   newImage.onerror=()=>{if(token===previewToken&&typeof pb834ShopGalleryState!=='undefined'&&pb834ShopGalleryState===st){st.bad.add(st.index);pb834RenderShopGallery();}};
   newImage.src=src;
   if(newImage.complete&&newImage.naturalWidth>0)newImage.onload();
  }else previewToken++;
  thumbs.querySelectorAll('button[data-i]').forEach(button=>{
   const on=Number(button.dataset.i)===st.index;
   if(button.classList.contains('active')!==on)button.classList.toggle('active',on);
  });
  return undefined;
 };
 document.addEventListener('keydown',event=>{
  if(!customerFrame()||!document.getElementById('pb834ShopGallery')?.classList.contains('open')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();event.stopImmediatePropagation();
  pb834ShopStep(event.key==='ArrowRight'?1:-1);
 },true);
}
document.addEventListener('click',event=>{
 const mobile=matchMedia('(max-width:820px)').matches;
 const storeEntry=event.target.closest('#photographerStoreRoleHeader .storeDesktopPrimary')||
  (mobile&&event.target.closest(
   '#photographerStoreBottomNav [data-store-home],'+
   '#photographerStoreBottomNav [aria-label="فروشگاه"],'+
   '.photographerBottomAppNav [data-store-home]'
  ));
 if(!storeEntry||typeof enterStoreChooserR96!=='function')return;
 event.preventDefault();event.stopImmediatePropagation();
 enterStoreChooserR96('store');applyFrameCustomerView();
},true);

/* R1228: Windows layout: header, store name, four centered tabs, catalog.
   Mobile layout: same soft blue surface as the other photographer tabs. */
const frameR1228Layout=document.createElement('style');
frameR1228Layout.id='frameR1228Layout';
frameR1228Layout.textContent=`
@media(min-width:821px){
 html body.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav,
 html body.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav.frameDesktopHost,
 html body.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav>button,
 html body.frameCustomerStore #storeSectionNavV673{
  display:none!important;visibility:hidden!important;pointer-events:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  position:fixed!important;top:var(--pb-store-role-header-h,64px)!important;left:0!important;right:0!important;
  width:100%!important;height:42px!important;min-height:42px!important;max-height:42px!important;
  display:grid!important;place-items:center!important;box-sizing:border-box!important;
  padding:4px 16px!important;background:#fff!important;background-image:none!important;
  border:0!important;border-bottom:1px solid #dce5f1!important;
  box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  text-shadow:none!important;isolation:isolate!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::before,
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar::after{
  content:none!important;display:none!important;box-shadow:none!important
 }
 html body.frameCustomerStore #photographerStoreIdentityBar #storeIdentityToggle,
 html body.frameCustomerStore #photographerStoreIdentityBar #photographerStoreHeaderName{
  width:100%!important;max-width:100%!important;min-width:0!important;
  margin:0!important;text-align:center!important;background:transparent!important;
  box-shadow:none!important;filter:none!important;opacity:1!important
 }
 html body.frameCustomerStore #photographerStoreIdentityBar #photographerStoreHeaderName{
  font-size:15px!important;line-height:26px!important;color:#101828!important;
  white-space:nowrap!important;text-overflow:ellipsis!important;overflow:hidden!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav{
  position:fixed!important;top:var(--frame-customer-nav-top,106px)!important;
  inset-inline:0!important;left:0!important;right:0!important;
  z-index:511!important;width:100%!important;max-width:none!important;
  height:49px!important;min-height:49px!important;box-sizing:border-box!important;
  display:flex!important;flex-direction:row!important;align-items:center!important;
  justify-content:center!important;gap:8px!important;
  margin:0!important;padding:4px 16px!important;
  background:#fff!important;background-image:none!important;opacity:1!important;
  border:0!important;border-bottom:1px solid #e2e8f0!important;
  box-shadow:none!important;filter:none!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-view],
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-history]{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  flex:0 0 auto!important;min-width:100px!important;height:36px!important;min-height:36px!important;
  padding:5px 13px!important;border:1px solid transparent!important;border-radius:8px!important;
  background:transparent!important;background-image:none!important;
  color:#475467!important;font:850 12.5px Vazirmatn,Tahoma,sans-serif!important;
  box-shadow:none!important;opacity:1!important;cursor:pointer!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button.active:not([data-frame-customer-cart]){
  color:#245be4!important;border-color:#cbdafe!important;background:#edf3ff!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-cart]{
  position:absolute!important;left:max(12px,calc((100vw - 1140px)/2))!important;right:auto!important;
  display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;
  width:auto!important;min-width:104px!important;height:36px!important;min-height:36px!important;
  padding:5px 11px!important;background:#fff7df!important;color:#935b0b!important;
  border:1px solid #f1c978!important;border-radius:8px!important;
  box-shadow:none!important;opacity:1!important;cursor:pointer!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>.shell{
  top:var(--frame-customer-content-top,155px)!important;
  background:#f5f7fb!important;background-image:none!important
 }
 html body.frameCustomerStore #frameOrdersPanel .saleOrderCustomer[hidden],
 html body.frameCustomerStore #frameOrderViewEmpty[hidden]{display:none!important}
}
@media(max-width:820px){
 /* Exactly the pale, open blue used below the white header in other mobile tabs. */
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav{
  background:linear-gradient(180deg,#e5f2ff 0%,#eaf5ff 62%,#f1f7ff 100%)!important;
  background-color:transparent!important;background-clip:padding-box!important;
  box-shadow:none!important;border:0!important;filter:none!important;opacity:1!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav::before{
  content:none!important;display:none!important;background:none!important;filter:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  box-shadow:none!important;filter:none!important;
  border-bottom:1px solid #e1eaf5!important;background:#fff!important;background-image:none!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button{
  background:#fff!important;background-color:#fff!important;background-image:none!important;
  opacity:1!important;filter:none!important;backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  border:1px solid #ccdbee!important;color:#273649!important;
  font-weight:850!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button.active{
  background:#fff!important;color:#2556d8!important;border-color:#7d9ef5!important
 }
 html body.frameCustomerStore #frameCustomerNav#frameCustomerNav button[data-frame-customer-history]{display:none!important}
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #storePhotographerWorkspace,
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #storePhotographerWorkspace>.shell{
  background:linear-gradient(180deg,#e5f2ff 0%,#eaf5ff 62%,#f1f7ff 100%)!important;
  background-color:#eaf5ff!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #salesPanel,
 html body.frameCustomerStore #storePhotographerWorkspace #salesPanel>.box{
  background:transparent!important;background-color:transparent!important;background-image:none!important;
  border:0!important;box-shadow:none!important;outline:0!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #salesPanel>.box{
  padding:0!important;margin:0!important;border-radius:0!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #salesContent{
  background:transparent!important;background-image:none!important;padding:0!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #saleItems{
  background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important
 }
 html body.frameCustomerStore #storePhotographerWorkspace #saleItems>.frameProductCard{
  background:#fff!important;background-image:none!important;
  opacity:1!important;border-radius:13px!important
 }
}

/* R1229: collapse the desktop chrome to exactly two rows: original unified
   header with the selected store name, then centered Store/Finance/Orders/History
   tabs. No redundant «خرید تجهیزات / مالی» or empty store-identity ribbon. */
@media(min-width:821px){
 html body.rentalPhotographerMode.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav,
 html body.rentalPhotographerMode.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav.frameDesktopHost{
  display:flex!important;visibility:visible!important;pointer-events:auto!important;
  align-items:center!important;justify-content:center!important;
  flex:1 1 auto!important;min-width:0!important;max-width:100%!important;
  margin:0 auto!important;padding:0 12px!important;background:transparent!important;
  border:0!important;box-shadow:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav>button{
  display:none!important;visibility:hidden!important;pointer-events:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore #frameDesktopStoreTitle{
  display:block!important;width:100%!important;max-width:100%!important;
  overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;
  font:900 15px/1.5 Vazirmatn,Tahoma,sans-serif!important;
  text-align:center!important;color:#101828!important;
  background:transparent!important;box-shadow:none!important;text-shadow:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;
  max-height:0!important;margin:0!important;padding:0!important;
  border:0!important;box-shadow:none!important;background-image:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore #frameCustomerNav#frameCustomerNav{
  top:var(--frame-customer-nav-top,64px)!important;
  margin-top:0!important;transform:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore #storePhotographerWorkspace>.shell{
  top:var(--frame-customer-content-top,113px)!important;
  margin-top:0!important;padding-top:0!important
 }
}

/* Embedded Windows content owns a visible in-frame store-title strip at y=0.
   The unified role header in this mode belongs to the desktop parent app and
   is intentionally hidden here. Do not remove the only visible title. */
@media(min-width:821px){
 html.pb1126Embedded body.rentalPhotographerMode.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar#photographerStoreIdentityBar{
  display:grid!important;visibility:visible!important;position:fixed!important;
  top:0!important;left:0!important;right:0!important;width:100%!important;
  height:42px!important;min-height:42px!important;max-height:42px!important;
  padding:3px 14px!important;place-items:center!important;
  background:#fff!important;box-shadow:none!important;border:0!important;border-bottom:1px solid #e0e8f4!important
 }
 html.pb1126Embedded body.rentalPhotographerMode.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar #storeIdentityToggle,
 html.pb1126Embedded body.rentalPhotographerMode.frameCustomerStore #storePhotographerWorkspace>#photographerStoreIdentityBar #photographerStoreHeaderName{
  display:block!important;visibility:visible!important;box-shadow:none!important
 }
 html.pb1126Embedded body.rentalPhotographerMode.frameCustomerStore #photographerStoreRoleHeader #pbR1123StoreDesktopNav{display:none!important}
}

/* Mobile: the blue surface must remain visible and fill the full viewport down
   to the actual bottom dock. No 92px phantom margin or fading to white near
   the bottom; only the individual product cards stay opaque white. */
@media(max-width:820px){
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore),
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #storePhotographerWorkspace{
  background:#e8f3ff!important;background-image:none!important;
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #frameCustomerNav#frameCustomerNav{
  background:linear-gradient(180deg,#e5f2ff 0%,#e8f3ff 100%)!important;
  background-color:#e8f3ff!important;
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #storePhotographerWorkspace>.shell{
  position:fixed!important;top:var(--frame-customer-content-top,174px)!important;
  bottom:var(--frame-bottom-dock-space,70px)!important;
  inset-inline:0!important;left:0!important;right:0!important;width:100vw!important;
  max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;
  margin:0!important;padding:7px 10px 0!important;box-sizing:border-box!important;
  overflow-x:hidden!important;overflow-y:auto!important;
  background:#e8f3ff!important;background-image:none!important;
  -webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #storePhotographerWorkspace>.shell>#app{
  min-height:100%!important;margin:0!important;padding:0!important;
  background:transparent!important
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #salesPanel,
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #salesPanel>.box{
  margin:0!important;padding:0!important;max-width:none!important;width:100%!important;
  background:transparent!important;background-image:none!important;
  border:0!important;box-shadow:none!important
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #saleItems{
  margin:0!important;padding:0 0 6px!important;background:transparent!important;
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #saleItems>.frameProductCard{
  background:#fff!important;opacity:1!important
 }
 html body.rentalPhotographerMode.frameCustomerStore:not(.pbR96ChoosingStore) #frameCustomerNav button{
  background:#fff!important;background-image:none!important;opacity:1!important
 }
}
`;
document.head.append(frameR1228Layout);
const style=document.createElement('style');style.textContent=C.cardStyles();document.head.append(style);if(isFrame())render();
})();



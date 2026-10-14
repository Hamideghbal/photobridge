(()=>{'use strict';const C=window.PBFrameCatalog,selected=new Map();
const isFrame=()=>Boolean(saleShopConfig?.production);
function render(){applyFrameCustomerView();if(!isFrame())return;const host=document.getElementById('saleItems');if(!host)return;const groups=C.groups(saleItems);host.innerHTML=groups.map(g=>{const item=C.choose(g,selected.get(g.id));if(!item)return '';selected.set(g.id,item.id);return C.card(g,item.id,{esc,money});}).join('')||'<div class="empty">مدلی برای سفارش وجود ندارد.</div>';applySaleCategory();}
const originalRender=renderSales;renderSales=function(){originalRender();render();renderFrameOrderRows();};
const originalCart=renderSaleCart;renderSaleCart=function(){originalCart();if(isFrame()){const rows=[...document.querySelectorAll('#saleCartLines .saleCartLine')];for(const [index,line] of rows.entries()){const entry=saleCart[index],item=saleItems.find(x=>String(x.id)===String(entry?.itemId));if(item)line.querySelector('b').textContent=item.title||C.label(item);}}};
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
function renderFrameOrderRows(){
 if(!customerFrame())return;
 const root=document.getElementById('saleOrders');if(!root)return;
 const rows=(saleOrders||[]).filter(o=>String(o.shop_id)===String(shopId));
 for(const [i,el] of [...root.querySelectorAll('.saleOrderCustomer')].entries()){
  const order=rows[i],info=el.querySelector('div');if(!info||!order?.production_stage)continue;
  el.classList.add('frameOrderCustomer');
  info.querySelector('.frameOrderStepper,.frameOrderCancelled')?.remove();
  info.insertAdjacentHTML('beforeend',frameStepMarkup(order.production_stage));
 }
}

let categoryOrigin=null,frameShellTop=null;const frameHiddenControls=new Map(),frameControlLabels=new Map(),frameLayoutDisplays=new Map();
const customerFrame=()=>typeof selectedShopRecord==='function'?['frame','chassis','frame_chassis'].includes(selectedShopRecord()?.business_category):isFrame();
function positionFrameNavigation(){const bar=document.getElementById('photographerStoreIdentityBar'),nav=document.getElementById('frameCustomerNav'),shell=document.querySelector('#storePhotographerWorkspace>.shell');if(!customerFrame()){if(shell&&frameShellTop){if(frameShellTop.value)shell.style.setProperty('top',frameShellTop.value,frameShellTop.priority);else shell.style.removeProperty('top');frameShellTop=null;}return;}if(!bar||!nav)return;const bottom=bar.getBoundingClientRect().bottom,contentTop=bottom+nav.getBoundingClientRect().height;document.documentElement.style.setProperty('--frame-customer-nav-top',bottom+'px');document.documentElement.style.setProperty('--frame-customer-content-top',contentTop+'px');if(shell){if(!frameShellTop)frameShellTop={value:shell.style.getPropertyValue('top'),priority:shell.style.getPropertyPriority('top')};if(shell.style.getPropertyValue('top')!==contentTop+'px')shell.style.setProperty('top',contentTop+'px','important');}}

function applyFrameCustomerView(){const enabled=customerFrame();document.body.classList.toggle('frameCustomerStore',enabled);ensureFrameOrdersPanel(enabled);for(const el of document.querySelectorAll('.salesFilterDockV809,#saleFilterBarR68,#saleCartBtn,#saleBrandBtnR68,#rentalBrandBtnR68,#rentalCartBtnV810,#pbR1123StoreDesktopNav,#storeSectionNavV673,[data-store-panel=equipmentPanel],[data-store-panel=bookingsPanel]')){if(enabled){if(!frameHiddenControls.has(el))frameHiddenControls.set(el,{hidden:el.hidden,display:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.hidden=true;el.style.setProperty('display','none','important');}else if(frameHiddenControls.has(el)){const prior=frameHiddenControls.get(el);el.hidden=prior.hidden;if(prior.display)el.style.setProperty('display',prior.display,prior.priority);else el.style.removeProperty('display');frameHiddenControls.delete(el);}}for(const button of document.querySelectorAll('[data-store-panel=salesPanel]')){const label=button.querySelector('b')||button;if(enabled){if(!frameControlLabels.has(label))frameControlLabels.set(label,label.innerHTML);if(label.textContent!=='فروشگاه')label.textContent='فروشگاه';}else if(frameControlLabels.has(label)){label.innerHTML=frameControlLabels.get(label);frameControlLabels.delete(label);}}const bar=document.getElementById('photographerStoreIdentityBar');let nav=document.getElementById('frameCustomerNav');if(enabled&&bar&&!nav){nav=document.createElement('nav');nav.id='frameCustomerNav';nav.setAttribute('aria-label','بخش‌های فروشگاه قاب');nav.innerHTML='<button type="button" data-frame-customer-view="salesPanel">فروشگاه</button><button type="button" data-frame-customer-view="financePanel">مالی</button><button type="button" data-frame-customer-view="frameOrdersPanel">سفارش‌ها</button><button type="button" data-frame-customer-categories>دسته‌بندی</button><button type="button" data-frame-customer-cart>سبد خرید <small data-frame-cart-count>۰</small></button>';bar.after(nav);new ResizeObserver(positionFrameNavigation).observe(bar);new MutationObserver(positionFrameNavigation).observe(bar,{attributes:true,attributeFilter:['style','class']});}
 const category=document.getElementById('saleCategoryBtnR68');if(enabled&&nav&&category){if(!categoryOrigin)categoryOrigin={parent:category.parentNode,next:category.nextSibling};nav.querySelector('[data-frame-customer-categories]')?.remove();if(category.parentNode!==nav)nav.insertBefore(category,nav.querySelector('[data-frame-customer-cart]'));}else if(!enabled&&categoryOrigin&&category&&category.parentNode===nav){categoryOrigin.parent.insertBefore(category,categoryOrigin.next);}
 if(nav){nav.hidden=!enabled;nav.querySelectorAll('[data-frame-customer-view]').forEach(button=>{const panel=document.getElementById(button.dataset.frameCustomerView),active=panel?.classList.contains('mobileActive');button.classList.toggle('active',Boolean(active));button.setAttribute('aria-current',active?'page':'false');});const count=nav.querySelector('[data-frame-cart-count]'),old=document.getElementById('saleCartCount');if(count&&old)count.textContent=old.textContent;}
 for(const el of [bar,document.getElementById('storeIdentityToggle'),document.getElementById('photographerStoreHeaderName')].filter(Boolean)){if(enabled){if(!frameLayoutDisplays.has(el))frameLayoutDisplays.set(el,{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});el.style.setProperty('display',el===bar?'grid':'block','important');}else if(frameLayoutDisplays.has(el)){const saved=frameLayoutDisplays.get(el);if(saved.value)el.style.setProperty('display',saved.value,saved.priority);else el.style.removeProperty('display');frameLayoutDisplays.delete(el);}}
 if(enabled&&bar){const names=bar.querySelectorAll('#photographerStoreHeaderName');for(const [index,name]of [...names].entries()){if(index===0){const raw=String(selectedShopRecord()?.name||'').trim();name.textContent=raw.startsWith('فروشگاه قاب و شاسی')?raw:'فروشگاه قاب و شاسی'+(raw?' '+raw:'');}else name.remove();}}
 const studio=document.getElementById('storePhotographerName');if(enabled&&studio){const raw=typeof photographerMe!=='undefined'?(photographerMe?.user?.photographerName||photographerMe?.user?.studioName||photographerMe?.user?.name||studio.textContent):studio.textContent;const clean=String(raw||'').trim().replace(/^(?:عکاسی\s*)+/u,'').trim();const title=clean?'عکاسی '+clean:'عکاسی';if(studio.textContent!==title)studio.textContent=title;}
 positionFrameNavigation();}
if(typeof syncPhotographerStoreIdentity==='function'){const original=syncPhotographerStoreIdentity;syncPhotographerStoreIdentity=function(...args){original(...args);applyFrameCustomerView();};}
if(typeof showMobilePanel==='function'){const original=showMobilePanel;showMobilePanel=function(id){if(customerFrame()&&['storePanel','equipmentPanel','bookingsPanel'].includes(id))id='salesPanel';original(id);applyFrameCustomerView();};}
const updateCart=renderSaleCart;renderSaleCart=function(...args){updateCart(...args);applyFrameCustomerView();};
document.addEventListener('click',e=>{if(!customerFrame())return;const view=e.target.closest('[data-frame-customer-view]');if(view){openStoreSection(view.dataset.frameCustomerView);if(view.dataset.frameCustomerView==='frameOrdersPanel')void loadSales();return;}if(e.target.closest('[data-frame-customer-categories]')){openStoreSection('salesPanel');document.getElementById('saleCategoryBtnR68')?.click();return;}if(e.target.closest('[data-frame-customer-cart]'))openSaleCart();if(e.target.closest('[data-frame-order-refresh]'))void loadSales();});
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
.frameCustomerStore #saleCartDrawer .saleCartLine small{font-size:9px;line-height:1.4}
.frameCustomerStore #saleCartDrawer .saleCartQty{gap:2px}
.frameCustomerStore #saleCartDrawer .saleCartQty button{width:23px;height:23px}
.frameCustomerStore #saleCartDrawer .saleCartQty span{min-width:17px;font-size:9px}
.frameCustomerStore #saleCartDrawer .saleCartRemove{font-size:9px;padding:0}
.frameCustomerStore #salesCheckoutNotice{display:none!important}
.frameCustomerStore #saleCartDrawer #saleCartCheckoutHint{font-size:10px;line-height:1.5}
@media(max-width:820px){.frameCustomerStore #frameCustomerNav button{font-size:11px}.frameCustomerStore .frameOrderStep small{font-size:8px}}
`;document.head.append(customerStyle);applyFrameCustomerView();
const style=document.createElement('style');style.textContent=C.cardStyles();document.head.append(style);if(isFrame())render();
})();



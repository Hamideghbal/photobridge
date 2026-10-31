/* One desktop photographer header; legacy Store/Print documents are content only. */
(()=>{
 'use strict';

 const query=new URLSearchParams(location.search);
 if(query.get('pbDesktopContent')==='1'){
  /* PB1316 atomic print row */
  const pb1316Wheel=e=>{
   if(e.ctrlKey||e.shiftKey||!e.deltaY||!matchMedia('(min-width:821px)').matches)return;
   const root=document.querySelector('main.photographerMain.photographerPrintWorkspace');
   const target=e.target?.nodeType===1?e.target:e.target?.parentElement;
   if(!root||!target||!root.contains(target)||target.closest('dialog,[role="dialog"],.pb748Modal,.pb1178TariffDialog,textarea,select,[contenteditable="true"]'))return;
   const viewport=root.querySelector(':scope>.photographerRolePageScrollArea')||root.querySelector('.photographerRolePageScrollArea');
   if(!viewport||!viewport.contains(target))return;
   const candidates=[];
   for(let node=target;node&&node!==root;node=node.parentElement){
    if(node.clientHeight>1&&node.scrollHeight>node.clientHeight+2&&!candidates.includes(node))candidates.push(node);
   }
   if(!candidates.includes(viewport))candidates.push(viewport);
   const snapshot=candidates.map(node=>node.scrollTop);
   const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?Math.max(1,viewport.clientHeight):1);
   requestAnimationFrame(()=>{
    if(!viewport.isConnected||candidates.some((node,i)=>node.scrollTop!==snapshot[i]))return;
    for(const node of candidates){
     const limit=node.scrollHeight-node.clientHeight;
     if(limit<=1||!(delta>0?node.scrollTop<limit-1:node.scrollTop>1))continue;
     const old=node.scrollTop;node.scrollTop=Math.max(0,Math.min(limit,old+delta));
     if(node.scrollTop!==old)break;
    }
   });
  };
  addEventListener('wheel',pb1316Wheel,{capture:true,passive:true});
  /* PB1314 print workspace */
  let pb1314ReadySent=false,pb1314Observer=null;
  const pb1314Signal=()=>{
   if(pb1314ReadySent||!document.querySelector('#pbR99LabChooser,.photographerPrintModeNav,#photographerStoreRoleHeader,.pbR96StoreChooser'))return;
   pb1314ReadySent=true;pb1314Observer?.disconnect();
   try{if(parent!==window)parent.dispatchEvent(new parent.CustomEvent('photobridge-panel-ready',{detail:{frame:window.frameElement}}));}catch{}
  };
  const pb1314Watch=()=>{if(!document.body)return;pb1314Observer=new MutationObserver(pb1314Signal);pb1314Observer.observe(document.body,{subtree:true,childList:true});pb1314Signal();};
  if(query.get('pbUtilityWindow')!=='1'&&(location.pathname.startsWith('/photographer/orders')||location.pathname.startsWith('/equipment-rental/book'))){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pb1314Watch,{once:true});else queueMicrotask(pb1314Watch);}document.documentElement.classList.add('pb1126Embedded');if(query.get('pbUtilityWindow')==='1'){document.documentElement.classList.add('pb1126Desktop',location.pathname.includes('/wallet')?'pb1242UtilityWallet':'pb1242UtilitySettings');}if(query.get('pbDesktopFrameStore')==='1')document.documentElement.classList.add('pb1126FrameStoreHost');return;}
 /* PB1309 embedded before viewport */
 if(!matchMedia('(min-width:821px)').matches)return;
 if(!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(login|signup|register|invite)(?:\/|$)/.test(location.pathname)){
  if(location.pathname==='/equipment-rental/book'&&new URLSearchParams(location.search).get('pbOfficeLogin')!=='1')location.replace('/photographer/gallery?pbDesktopPanel=store&pbDesktopStoreQuery='+encodeURIComponent(location.search));
  return;
 }
 if(document.body?.classList.contains('pbAuthenticatedPhotographerPortal'))document.documentElement.classList.add('pb1126Desktop');
 const tabs=[['print','چاپ','/photographer/orders/flow?workspace=print&pbLabChooser=1'],['ai','هوش مصنوعی','/photographer/ai/retouch'],['gallery','گالری','/photographer/gallery'],['album','طراحی آلبوم','/photographer/album-design'],['instagram','اینستاگرام','/photographer/album-design?pb_mode=instagram'],['store','فروشگاه','/equipment-rental/book']];
 let settings={tabs:{ai:false,album:false,instagram:false}},chrome,selected=null,scheduled=false,authenticated=false;
 try{const saved=JSON.parse(sessionStorage.getItem('pb1126-desktop-tabs'));if(saved?.tabs)settings=saved;}catch{}
 let walletBalance=null,walletRefreshing=false;
 const faWallet=n=>Math.round(Number(n)||0).toLocaleString('fa-IR');
 async function refreshWallet(){if(walletRefreshing)return;walletRefreshing=true;try{const r=await fetch('/api/customer/services-wallet',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}});if(r.ok){const w=await r.json();if(Number.isFinite(Number(w.balance))){walletBalance=Number(w.balance);schedule();}}}catch{}finally{walletRefreshing=false;}}
 window.addEventListener('photobridge-wallet-balance',e=>{if(Number.isFinite(Number(e.detail?.balance))){walletBalance=Number(e.detail.balance);schedule();}});
 window.addEventListener('focus',()=>void refreshWallet());
 const panels=new Map();let utilityPanel=null,utilityReturnFocus=null,utilityPreviousOverflow='',utilityEscapeHandler=null;
 const kind=()=>new URLSearchParams(location.search).get('pbDesktopPanel')||(/\/orders|\/upload|\/archive|\/finance|\/album(?:\/|$)/.test(location.pathname)?'print':location.pathname.includes('/ai/')?'ai':location.pathname.includes('/album-design')?(new URLSearchParams(location.search).get('pb_mode')==='instagram'?'instagram':'album'):'gallery');
 const nativeHeader=doc=>doc.querySelector('#photographerRoleHeaderV710,#photographerStoreRoleHeader');
 function currentDocument(){return selected?panels.get(selected)?.querySelector('iframe')?.contentDocument:document;}
 // React can replace a native button without changing its HTML. Resolve at click time:
 // a retained desktop proxy must never dispatch to the detached, old React node.
 function printControlKey(button){
  for(const name of ['photographerPrintPhotoTab','photographerPrintAlbumTab','photographerPrintTopLab','archive','finance'])if(button.classList.contains(name))return 'class:'+name;
  if(button.id)return 'id:'+button.id;
  return 'label:'+(button.getAttribute('aria-label')||button.textContent||'').replace(/\s+/g,' ').trim();
 }
 function livePrintControl(key){
  const doc=currentDocument(),header=doc&&nativeHeader(doc);
  return [...(header?.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')||[])].find(button=>printControlKey(button)===key&&button.isConnected&&!button.disabled&&!button.hidden&&button.getAttribute('aria-hidden')!=='true');
 }
 function printControlSignature(button){
  const key=printControlKey(button);
  const label=key==='class:archive'?'آرشیو':key==='class:finance'?'مالی':(button.textContent||'').replace(/\s+/g,' ').trim();
  return [key,label,button.disabled,button.classList.contains('active'),button.getAttribute('aria-current')];
 }
 /* PB1459 lab context */
 /* PB1463 lab label */
 function pb1463LabLabel(value){const name=String(value||'').trim().replace(/^لابراتوار(?:\s+عکس)?(?:\s+|$)/,'').trim();return 'لابراتوار عکس '+(name||'انتخاب‌شده')}
 function pb1459LabContext(source){
  const context=document.createElement('div');context.className='pb1459LabContext';context.setAttribute('aria-label','لابراتوار انتخاب‌شده');
  const name=source.dataset.labName||source.selectedOptions[0]?.textContent||'لابراتوار';context.title=pb1463LabLabel(name);
  if(source.options.length>1){
   const select=document.createElement('select');select.className='pb1459LabSelect';select.setAttribute('aria-label','تغییر لابراتوار چاپ');
   for(const option of source.options){const copy=option.cloneNode(true);copy.textContent=pb1463LabLabel(option.textContent);select.append(copy);}select.value=source.value;select.disabled=source.disabled;
   select.onchange=()=>{const live=currentDocument()?.querySelector('select.pb1459LabSource');if(!live||live.disabled)return;const option=[...live.options].find(o=>o.value===select.value&&!o.disabled);if(!option)return;live.value=option.value;live.dispatchEvent(new live.ownerDocument.defaultView.Event('change',{bubbles:true}));schedule();};context.append(select);
  }else{const title=document.createElement('strong');title.textContent=pb1463LabLabel(name);context.append(title)}
  return context;
 }
 function cleanClone(original){const el=original.cloneNode(true);el.removeAttribute('id');el.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));return el;}
 function placeMainIndicator(nav){
  if(!nav||!nav.isConnected)return;
  let indicator=nav.querySelector(':scope > .pb1131MovingIndicator');
  if(!indicator){
   indicator=document.createElement('span');
   indicator.className='pb1131MovingIndicator';
   indicator.setAttribute('aria-hidden','true');
   nav.append(indicator);
  }
  const active=nav.querySelector(':scope > button.active');
  if(!active||active.getBoundingClientRect().width===0){indicator.style.opacity='0';return;}
  const base=nav.getBoundingClientRect(),rect=active.getBoundingClientRect();
  const width=Math.max(18,rect.width-12)+'px';
  const x=Math.round(rect.left-base.left+6+nav.scrollLeft)+'px';
  if(!indicator.dataset.ready)indicator.style.transition='none';
  if(indicator.style.width!==width)indicator.style.width=width;
  if(indicator.style.transform!=='translateX('+x+')')indicator.style.transform='translateX('+x+')';
  indicator.style.opacity='1';
  if(!indicator.dataset.ready){
   indicator.dataset.ready='1';
   requestAnimationFrame(()=>{if(indicator.isConnected)indicator.style.removeProperty('transition');});
  }
 }
 function render(){
  scheduled=false;if(!document.body)return;
  if(!panelSessionReady){chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');return;}
  document.documentElement.classList.add('pb1126Desktop');
  if(!/^\/photographer(?:\/|$)/.test(location.pathname)||/^\/photographer\/(login|signup|register|invite)(?:\/|$)/.test(location.pathname)){chrome?.parentElement.remove();chrome=null;closePanels();document.documentElement.classList.remove('pb1126Desktop');return;}
  const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;
  if(!chrome){
   const host=document.createElement('div');host.id='pb1126ChromeHost';
   chrome=document.createElement('header');chrome.id='pb1126DesktopHeader';chrome.className='photographerHeaderRefined';chrome.setAttribute('aria-label','دسترسی‌های عکاس');
   chrome.innerHTML='<div class="photographerHeaderIdentity"></div><nav class="photographerHeaderNav pb1126MainNav"></nav><div class="pb1124PrimaryActions"><button type="button" class="pb1124Wallet">کیف پول</button><button type="button" class="pb1124Exit">خروج</button></div><div class="pb1126Secondary"></div>';
   host.append(chrome);document.body.append(host);
   chrome.querySelector('.pb1124Wallet').onclick=()=>{if(!openUtilityWindow('wallet'))nativeHeader(document)?.querySelector('.headerWalletBadge,.mobileHeaderWallet')?.click();};
   chrome.querySelector('.pb1124Exit').onclick=()=>nativeHeader(document)?.querySelector('.headerLogoutBtn,.mobileHeaderPower')?.click();
  }
  const identity=(nativeHeader(document)||native).querySelector('.photographerHeaderIdentity');
  if(identity){
   const target=chrome.querySelector('.photographerHeaderIdentity');
   const name=identity.querySelector('h1')?.textContent?.trim()||'عکاسی';
   const subtitle=identity.querySelector('.workspaceIdentityCopy small')?.textContent?.trim()||identity.querySelector('small')?.textContent?.trim()||'';
   const date=identity.querySelector('.photographerIdentityDateOnly')?.textContent?.trim()||'';
   const avatar=identity.querySelector('.pb1124Avatar img')?.getAttribute('src')||'';
   const signature=JSON.stringify([name,subtitle,date,avatar]);
   if(target.dataset.source!==signature){
    // Preserve the decoded profile photo while the clock or identity text updates.
    let photo=target.querySelector('.pb1124Avatar');if(!photo){photo=document.createElement('span');photo.className='pb1124Avatar';photo.setAttribute('aria-label','عکس پروفایل عکاسی');target.prepend(photo);}
    if(avatar){let img=photo.querySelector('img');if(!img){img=document.createElement('img');img.alt='عکس پروفایل عکاسی';photo.replaceChildren(img);}if(img.getAttribute('src')!==avatar)img.src=avatar;}else if(photo.textContent!==(name[0]||'ع'))photo.textContent=name[0]||'ع';
    let copy=target.querySelector('.workspaceIdentityCopy');if(!copy){copy=document.createElement('div');copy.className='workspaceIdentityCopy';copy.innerHTML='<h1></h1><small></small><p class="photographerIdentityDateOnly"></p>';target.append(copy);}
    for(const [selector,value] of [['h1',name],['small',subtitle],['.photographerIdentityDateOnly',date]]){const node=copy.querySelector(selector);if(node&&node.textContent!==value)node.textContent=value;}
    target.dataset.source=signature;
   }
   target.dataset.pb1168Ready=(nativeHeader(document)||native)?.dataset.pb1168IdentityReady==='1'?'1':'0';
  }
  const nav=chrome.querySelector('.pb1126MainNav'),active=selected||kind(),previousActive=nav.dataset.pb1132Active||'';
  for(const [key,label,href] of tabs){
   let button=nav.querySelector('[data-pb1126-kind="'+key+'"]');
   if(['ai','album','instagram'].includes(key)&&settings.tabs[key]===false){button?.remove();continue;}
   if(!button){button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.pb1126Kind=key;button.dataset.mainHref=href;nav.append(button);}
   button.classList.toggle('active',active===key);if(active===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  // Preserve ordering if settings enable a previously removed tab.
  const ordered=tabs.map(([key])=>nav.querySelector('[data-pb1126-kind="'+key+'"]')).filter(Boolean);if(ordered.some((b,i)=>b!==nav.querySelectorAll(':scope>button')[i])){const indicator=nav.querySelector(':scope>.pb1131MovingIndicator');nav.replaceChildren(...ordered);if(indicator)nav.append(indicator);}
  requestAnimationFrame(()=>placeMainIndicator(nav));
  if(previousActive&&previousActive!==active&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   const selectedButton=nav.querySelector('[data-pb1126-kind="'+active+'"]');
   if(selectedButton)press(selectedButton);
  }
  nav.dataset.pb1132Active=active;
  // Read the service balance independently from hidden native header badges.
  const walletButton=chrome.querySelector('.pb1124Wallet');
  const walletLabel='کیف پول · '+(walletBalance===null?'…':faWallet(walletBalance)+' تومان');
  if(walletButton&&walletButton.textContent!==walletLabel)walletButton.textContent=walletLabel;
  /* PB1458 print toolbar */
  chrome.classList.toggle('pb1458PrintToolbar',active==='print');
  const row=chrome.querySelector('.pb1126Secondary'),doc=currentDocument();
  document.documentElement.classList.toggle('pb1461ParentThird',active==='print'&&!!doc?.querySelector('.pb1461Orders,.pb1464Album,.simplePrintPilotWorkspaceMode'));

  const frameStore=active==='store'&&doc?.body?.classList.contains('frameCustomerStore')&&doc?.querySelector('#frameCustomerNav');
  const cameraStore=active==='store'&&!frameStore&&doc?.body?.classList.contains('rentalPhotographerMode')&&doc?.querySelector('#photographerStoreRoleHeader')&&doc?.querySelector('#pbR1123StoreDesktopNav')&&!doc?.body?.classList.contains('pbR96ChoosingStore');
  const storeHeader=Boolean(frameStore||cameraStore);
  const frameStoreName=storeHeader?(doc.querySelector('#photographerStoreHeaderName')?.textContent?.trim()||''):'';
  const saleCart=doc?.querySelector('#photographerStoreIdentityBar #saleCartBtn'),saleSection=doc?.querySelector('#pbR1123StoreDesktopNav [data-store-panel="salesPanel"]');
  const cameraSaleAvailable=Boolean(cameraStore&&saleSection&&!saleSection.hidden&&saleSection.getAttribute('aria-hidden')!=='true');
  const cameraCart=cameraStore?(cameraSaleAvailable?(saleCart||saleSection):doc.querySelector('#photographerStoreIdentityBar .rentalCartBtnV810:not([hidden])')):null;
  const cartDrawer=storeHeader?doc.querySelector('#saleCartDrawer'):null;
  if(cartDrawer&&!cartDrawer._pb1126LayerObserver){
   const syncCartLayer=()=>doc.defaultView.frameElement?.closest('.pb1126ContentPanel')?.classList.toggle('pb1126CartOpen',cartDrawer.classList.contains('open'));
   cartDrawer._pb1126LayerObserver=new MutationObserver(syncCartLayer);cartDrawer._pb1126LayerObserver.observe(cartDrawer,{attributes:true,attributeFilter:['class']});syncCartLayer();
  }
  if(storeHeader){chrome.style.setProperty('width','100vw','important');chrome.style.setProperty('left','0','important');chrome.style.setProperty('right','auto','important');}
  else for(const property of ['width','left','right'])chrome.style.removeProperty(property);
  document.documentElement.classList.toggle('pb1126FrameStore',Boolean(frameStore));
  chrome.classList.toggle('pb1126FrameStore',Boolean(frameStore));
  document.documentElement.classList.toggle('pb1126CameraStore',Boolean(cameraStore));
  chrome.classList.toggle('pb1126CameraStore',Boolean(cameraStore));
  const choosing=active==='store'?(!doc?.querySelector('#photographerStoreRoleHeader')||doc.body?.classList.contains('pbR96ChoosingStore')):active==='print'?(!!doc?.querySelector('#pbR99LabChooser')||doc?.body?.classList.contains('pbR100F14ChoosingLab')||doc?.documentElement?.classList.contains('pbR100F14LabChooserBoot')||(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print')):false;
  document.documentElement.classList.toggle('pb1127Choosing',choosing);
  chrome.classList.toggle('pb1127Choosing',choosing);
  row.hidden=choosing;
  document.documentElement.classList.toggle('pb1133LabChat',active==='print'&&!choosing&&!selected);
  if(doc?.documentElement&&doc!==document)doc.documentElement.classList.toggle('pb1133LabChat',active==='print'&&!choosing);
  const pb1459LabSource=active==='print'&&!choosing?doc?.querySelector('select.pb1459LabSource'):null;
  const pb1459LabSignature=pb1459LabSource?JSON.stringify([pb1459LabSource.outerHTML,pb1459LabSource.value,pb1459LabSource.disabled]):'';
  const sources=choosing?[]:active==='store'?[...native.querySelectorAll('#pbR1123StoreDesktopNav>button')]:active==='print'?[...native.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')]:[...native.querySelectorAll('.roleHeaderToolButtons>button:not(.headerWalletBadge):not(.headerLogoutBtn)')];
  const visible=sources.filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack')&&!el.classList.contains('pb1458LabPrices')); /* PB1462 toolbar prices retired */
  const cameraStoreControls=cameraStore?visible.filter(el=>el.dataset.storePanel!=='salesPanel'):[];
  const frameStoreControls=frameStore?[...frameStore.querySelectorAll('button[data-frame-customer-view],button[data-frame-customer-history],button[data-frame-customer-cart]')].filter(el=>getComputedStyle(el).display!=='none'):[];
  const headerControls=frameStore?frameStoreControls:cameraStore?cameraStoreControls:[];
  const signature=pb1459LabSignature+'|'+active+'|'+choosing+'|'+(storeHeader?'store:'+frameStoreName+headerControls.map(el=>el.outerHTML).join('')+(cameraCart?.outerHTML||''):(active==='print'?JSON.stringify(visible.map(printControlSignature)):visible.map(el=>el.outerHTML).join('')));
  if(row.dataset.source!==signature){
   row.replaceChildren();row.classList.toggle('pb1127PrintRow',active==='print');
   if(storeHeader){
    const title=document.createElement('strong');title.className='pb1126FrameStoreTitle';
    if(frameStore){
     const prefix='فروشگاه قاب شاسی',shopName=frameStoreName.replace(/^فروشگاه قاب(?: و)? شاسی\s*/,'').trim();
     const shop=document.createElement('span');shop.className='pb1126FrameStoreShopName';shop.textContent=shopName;
     const category=document.createElement('small');category.className='pb1126FrameStoreCategory';category.textContent=prefix;title.append(category,shop);
    }else{
     const prefix='فروشگاه تجهیزات عکاسی و فیلمبرداری',shopName=frameStoreName.replace(/^فروشگاه تجهیزات (?:عکاسی و فیلمبرداری|تصویربرداری)\s*/,'').trim();
     const category=document.createElement('small');category.className='pb1126FrameStoreCategory';category.textContent=prefix;
     const shop=document.createElement('span');shop.className='pb1126FrameStoreShopName';shop.textContent=shopName;title.append(category,shop);
    }
    const nav=document.createElement('nav');nav.className='pb1126FrameStoreTabs';nav.setAttribute('aria-label','بخش‌های فروشگاه');
    const cart=document.createElement('div');cart.className='pb1126FrameStoreCart';
    const controls=frameStore?frameStoreControls:cameraStoreControls;
    for(const original of controls){
     const copy=cleanClone(original);copy.classList.add('pb1126FrameStoreControl');copy.style.removeProperty('display');
     if(cameraStore){const labels={equipmentPanel:'اجاره تجهیزات',bookingsPanel:'آفیش‌های من',financePanel:'مالی'};if(labels[copy.dataset.storePanel])copy.textContent=labels[copy.dataset.storePanel];}
     copy.onclick=()=>{original.click();requestAnimationFrame(()=>{schedule();reveal(motionContent(doc));});};
     if(original.matches('[data-frame-customer-cart]')){const count=original.querySelector('[data-frame-cart-count],.saleCartCount')?.textContent?.trim()||doc.querySelector('#saleCartCount')?.textContent?.trim()||'۰';copy.replaceChildren(document.createTextNode('سبد خرید '));const badge=document.createElement('span');badge.className='pb1242CartCount';badge.textContent=count;copy.append(badge);}
     (original.matches('[data-frame-customer-cart]')?cart:nav).append(copy);
    }
    // Camera/photo-video store: bring the REAL category action up beside cart.
    // Keep the original filter logic in the embedded shop, not a disconnected copy.
    if(cameraStore){
     const categoryButton=doc.querySelector('#saleCategoryBtnR68');
     if(categoryButton){
      const categoryCopy=document.createElement('button');
      categoryCopy.type='button';categoryCopy.className='pb1126FrameStoreControl pb1249CameraCategory';
      categoryCopy.textContent='دسته‌بندی';categoryCopy.setAttribute('aria-label','دسته‌بندی فروشگاه');
      categoryCopy.onclick=()=>{if(!categoryButton.isConnected)return;
       if(typeof doc.defaultView.openStoreSection==='function')doc.defaultView.openStoreSection('salesPanel');
       else saleSection?.click();
       categoryButton.click();
      };
      cart.append(categoryCopy);
     }
    }
    if(cameraCart){const copy=cleanClone(cameraCart);copy.classList.add('pb1126FrameStoreControl');copy.style.removeProperty('display');if(cameraCart===saleSection){copy.textContent='سبد خرید';copy.setAttribute('aria-label','سبد خرید');copy.onclick=()=>{if(typeof doc.defaultView.openSaleCart==='function')doc.defaultView.openSaleCart();else{saleSection.click();doc.defaultView.setTimeout(()=>doc.querySelector('#saleCartBtn')?.click(),0);}};}else copy.onclick=()=>cameraCart.click();cart.append(copy);}
    row.append(title,nav,cart);
   }
   let modes,utilities;
   if(active==='print'&&!choosing){modes=document.createElement('div');modes.className='pb1127PrintModes';utilities=document.createElement('div');utilities.className='pb1127PrintUtilities';row.append(modes);if(pb1459LabSource)row.append(pb1459LabContext(pb1459LabSource));row.append(utilities);}
   for(const original of storeHeader?[]:visible){
    const copy=cleanClone(original);copy.style.removeProperty('display');
    const printKey=active==='print'?printControlKey(original):null;
    copy.onclick=()=>{const target=printKey?livePrintControl(printKey):original;if(!target||target.disabled)return;press(copy);target.click();requestAnimationFrame(()=>reveal(motionContent(currentDocument())));};
    if(active==='store'){const labels={equipmentPanel:'اجاره تجهیزات',salesPanel:'خرید تجهیزات',bookingsPanel:'آفیش‌های من',financePanel:'مالی'};if(labels[copy.dataset.storePanel])copy.textContent=labels[copy.dataset.storePanel];}
    if(copy.classList.contains('archive'))copy.textContent='آرشیو';
    if(copy.classList.contains('finance')){copy.textContent='مالی';copy.setAttribute('aria-label','مالی');}
    if(utilities&&original.closest('.photographerPrintModeUtilityCluster'))utilities.append(copy);else (modes||row).append(copy);
   }
   if(utilities){for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)utilities.append(b);}}
   row.dataset.source=signature;
  }
  const printPanel=panels.get('print');
  const loading=printPanel?.querySelector('.pb1126Loading');
  const nativeModes=active==='print'&&!choosing&&visible.some(button=>button.classList.contains('photographerPrintPhotoTab'))&&visible.some(button=>button.classList.contains('photographerPrintAlbumTab'));
  const clonedModes=!!row.querySelector('.pb1127PrintModes .photographerPrintPhotoTab')&&!!row.querySelector('.pb1127PrintModes .photographerPrintAlbumTab');
  const waiting=active==='print'&&!choosing&&(!nativeModes||!clonedModes||!loading?.hidden||document.documentElement.classList.contains('pb1315PanelChanging'));
  document.documentElement.classList.toggle('pb1316PrintRowPending',waiting);
  row.classList.toggle('pb1316Ready',active==='print'&&!choosing&&!waiting);
  row.hidden=choosing||waiting;
  /* PB1317 actual desktop header bottom */
  // The canonical header can grow beyond the old fixed 114px estimate.
  if(active==='print'&&printPanel&&!printPanel.hidden){
   requestAnimationFrame(()=>{
    if(selected!=='print'||printPanel.hidden||!printPanel.isConnected||!chrome?.isConnected)return;
    const edge=window.pb1319DesktopPrintInset?.(chrome)??Math.ceil(Math.max(chrome.getBoundingClientRect().bottom,...[...chrome.querySelectorAll('.pb1126Secondary,.pb1127PrintModes,.pb1127PrintUtilities,.pb1126Secondary>*,.pb1126Secondary>*>*')].filter(el=>!el.hidden&&getComputedStyle(el).display!=='none'&&el.getBoundingClientRect().height>0).map(el=>el.getBoundingClientRect().bottom)));
    if(edge>=60&&edge<innerHeight-64){
     const next=edge+'px';
     if(printPanel.style.getPropertyValue('top')!==next)printPanel.style.setProperty('top',next,'important');
    }
   });
  }
 }
 const pressTimers=new WeakMap();
 function press(el){
  if(!el||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  clearTimeout(pressTimers.get(el));
  el.animate?.([{transform:'translateY(2px) scale(.98)'},{transform:'translateY(0) scale(1)'}],{duration:180,easing:'ease-out'});
  /* R1193 no CSS tab animation replay required */
  /* R1193 Web Animations button feedback completes by itself */
 }
 function motionContent(doc){return doc?.querySelector('.clientGalleryWorkspace,.clientGalleryManager,.rentalPanel.mobileActive,.simplePrintPilot')||doc?.querySelector('.photographerRolePageScrollArea')?.firstElementChild||doc?.querySelector('#pbR99LabChooser')?.firstElementChild;}
 const contentAnimations=new WeakMap();
 function reveal(el){if(!el||window.__PB_ALLOW_WHOLE_PAGE_MOTION__!==true||matchMedia('(prefers-reduced-motion:reduce)').matches)return;contentAnimations.get(el)?.cancel();contentAnimations.set(el,el.animate([{opacity:.85},{opacity:1}],{duration:420,easing:'cubic-bezier(.25,.65,.35,1)'}));}


 /* PB1311 panel document lifecycle */
 let panelSessionReady=document.body?.classList.contains('pbAuthenticatedPhotographerPortal')===true;
 let pendingPanel=null;
 let warmQueued=false,warmEpoch=0;
 function clearPanelDocuments(){
  warmEpoch++;warmQueued=false;closePanels();
  for(const p of panels.values())p.remove();panels.clear();
  if(utilityPanel){utilityPanel.hidden=true;document.body.style.overflow=utilityPreviousOverflow;}
  for(const f of utilityFrames.values())f.remove();utilityFrames.clear();
 }
 function resumePanelDocuments(){
  if(!panelSessionReady){const requested=pendingPanel||selected||new URLSearchParams(location.search).get('pbDesktopPanel');clearPanelDocuments();panelSessionReady=true;pendingPanel=null;if(['print','store'].includes(requested))open(requested,false);}
  queueWarmPanels();
 }
 const whenIdle=fn=>typeof requestIdleCallback==='function'?requestIdleCallback(fn,{timeout:1500}):setTimeout(fn,250);
 function queueWarmPanels(){
  if(warmQueued||!panelSessionReady||!authenticated||document.hidden||navigator.connection?.saveData)return;
  warmQueued=true;const epoch=warmEpoch;
  whenIdle(()=>{
   if(epoch!==warmEpoch||!authenticated)return;
   const print=preparePanel('print'),frame=print.querySelector('iframe');
   const next=()=>whenIdle(()=>{if(epoch===warmEpoch&&authenticated)preparePanel('store');});
   if(frame.contentDocument?.querySelector('.photographerPrintModeNav,#pbR99LabChooser'))next();else frame.addEventListener('load',next,{once:true});
  });
 }
 window.addEventListener('focus',queueWarmPanels);

 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
 function closePanels(){for(const p of panels.values())p.hidden=true;selected=null;document.documentElement.classList.remove('pb1126PanelOpen','pb1315PanelChanging','pb1316PrintRowPending');}
 function preparePanel(key){
  let panel=panels.get(key);if(!panel){
   panel=document.createElement('section');panel.hidden=true;panel.className='pb1126ContentPanel';panel.dataset.panel=key;
   const loading=document.createElement('div');loading.className='pb1126Loading';loading.textContent='در حال دریافت…';loading.setAttribute('role','status');
   const frame=document.createElement('iframe');frame.title=key==='store'?'فروشگاه':'چاپ';
   frame.addEventListener('load',()=>{try{const u=new URL(frame.contentWindow.location.href);if(u.href==='about:blank')return;if(u.origin!==location.origin||!/^\/(equipment-rental|photographer)(\/|$)/.test(u.pathname)||/^\/photographer\/(login|signup|register)/.test(u.pathname)){location.assign(u.href);return;}loading.hidden=true;schedule();if(!panel.hidden)requestAnimationFrame(()=>reveal(motionContent(frame.contentDocument)||frame));new MutationObserver(schedule).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});}catch{}});
   frame.addEventListener('load',()=>pb1315Watch(panel));
   panel.append(frame,loading);document.body.append(panel);panels.set(key,panel);
   /* PB1461 refresh route */
   const savedPrint=key==='print'?new URLSearchParams(location.search).get('pbPrintRoute'):null;
   let restoredPrint=null;try{if(savedPrint?.startsWith('/')&&!savedPrint.startsWith('//')){const u=new URL(savedPrint,location.origin);if(u.origin===location.origin&&/^\/photographer\/(?:orders\/(?:flow|needs_fix|ready|completed)|upload|album|archive|finance)\/?$/.test(u.pathname)&&u.searchParams.get('pbLabChooser')!=='1'){u.searchParams.set('pbDesktopContent','1');u.searchParams.set('workspace','print');restoredPrint=u.pathname+u.search}}}catch{}
   const q=new URLSearchParams(key==='store'?query.get('pbDesktopStoreQuery')||'':'workspace=print&pbLabChooser=1');q.set('pbDesktopContent','1');if(key==='store')q.set('pbDesktopFrameStore','1');frame.src=restoredPrint||(key==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;
  }
  return panel;
 }
 function open(key,push=true){
  if(!panelSessionReady){pendingPanel=key;return;}
  if(selected===key)return;
  const panel=preparePanel(key);
  closePanels();panel.hidden=false;selected=key;document.documentElement.classList.add('pb1126PanelOpen');
  if(push){const u=new URL(location.href);u.searchParams.set('pbDesktopPanel',key);history.pushState({pb1126Panel:key},'',u);}
  render();reveal(motionContent(panel.querySelector('iframe').contentDocument));
 }
 const utilityPages={wallet:{title:'کیف پول',path:'/photographer/wallet'},settings:{title:'تنظیمات عکاسی',path:'/photographer/settings'}};
 const utilityFrames=new Map();
 function closeUtilityWindow(){
  if(!utilityPanel)return;
  void refreshWallet();
  utilityPanel.hidden=true;document.body.style.overflow=utilityPreviousOverflow;
  if(utilityEscapeHandler){window.removeEventListener('keydown',utilityEscapeHandler,true);utilityEscapeHandler=null;}
  const focus=utilityReturnFocus;utilityReturnFocus=null;if(focus?.isConnected)focus.focus({preventScroll:true});
 }
 function openUtilityWindow(kind){
  const page=utilityPages[kind];if(!page)return false;
  if(kind==='wallet')void refreshWallet();
  utilityReturnFocus=document.activeElement;utilityPreviousOverflow=document.body.style.overflow;
  if(!utilityPanel){
   utilityPanel=document.createElement('div');utilityPanel.id='pb1126UtilityWindow';utilityPanel.setAttribute('role','presentation');utilityPanel.hidden=true;
   const dialog=document.createElement('section');dialog.className='pb1126UtilityDialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','pb1126UtilityTitle');
   const bar=document.createElement('header');bar.className='pb1126UtilityBar';
   const title=document.createElement('strong');title.id='pb1126UtilityTitle';
   const close=document.createElement('button');close.type='button';close.id='pb1126UtilityClose';close.className='pb1126UtilityClose';close.setAttribute('aria-label','بستن');close.title='بستن';close.textContent='×';close.addEventListener('click',closeUtilityWindow);
   const frameHost=document.createElement('div');frameHost.className='pb1126UtilityFrames';frameHost.style.cssText='display:flex;flex:1 1 auto;min-height:0';
   bar.append(title,close);dialog.append(bar,frameHost);utilityPanel.append(dialog);
   utilityPanel.addEventListener('mousedown',event=>{if(event.target===utilityPanel)closeUtilityWindow();});
   document.body.append(utilityPanel);document.body.style.overflow='hidden';
   utilityEscapeHandler=event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeUtilityWindow();}};
   window.addEventListener('keydown',utilityEscapeHandler,true);
  }
  utilityPanel.dataset.kind=kind;
  const title=utilityPanel.querySelector('#pb1126UtilityTitle'),frameHost=utilityPanel.querySelector('.pb1126UtilityFrames');
  let frame=utilityFrames.get(kind);if(!frame){frame=document.createElement('iframe');frame.className='pb1126UtilityFrame';frame.title=page.title;frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('photobridge-wallet-balance',()=>void refreshWallet());}catch{}});frame.src=page.path+'?pbDesktopContent=1&pbUtilityWindow=1';utilityFrames.set(kind,frame);frameHost.append(frame);}
  for(const [key,cached] of utilityFrames)cached.style.display=key===kind?'block':'none';
  title.textContent=page.title;document.body.style.overflow='hidden';utilityPanel.hidden=false;
  utilityPanel.querySelector('#pb1126UtilityClose').focus({preventScroll:true});
  return true;
 }
 window.pb1126OpenPhotographerWindow=openUtilityWindow;
 window.addEventListener('click',event=>{
  const button=event.target?.closest?.('.pb1124Wallet,.pb1163-settings');if(!button)return;
  const kind=button.classList.contains('pb1124Wallet')?'wallet':'settings';
  if(!openUtilityWindow(kind))return;
  event.preventDefault();event.stopImmediatePropagation();
 },true);
 function openStoreChooser(doc){if(doc?.body?.classList.contains('pbR96ChoosingStore'))return true;const button=doc?.querySelector('[data-store-home]');if(!button)return false;button.click();return true;}
 function openPrintChooser(doc){
  if(doc?.querySelector('#pbR99LabChooser'))return true;
  if(!doc?.defaultView||!doc.querySelector('.photographerPrintModeNav'))return false;
  const w=doc.defaultView,url=new URL('/photographer/orders/flow',location.origin);
  url.searchParams.set('workspace','print');url.searchParams.set('pbLabChooser','1');url.searchParams.set('pbDesktopContent','1');
  w.history.pushState(null,'',url);w.dispatchEvent(new w.PopStateEvent('popstate'));return true;
 }
 function navigate(key){
  if(key==='print'||key==='store'){
   open(key);const panel=panels.get(key),frame=panel?.querySelector('iframe');if(!frame)return;
   let complete=false;
   const goToChooser=()=>{
    if(complete||!frame.isConnected||panel.hidden||selected!==key)return;
    const doc=frame.contentDocument;
    if(!doc?.body||frame.contentWindow?.location.href==='about:blank')return;
    complete=key==='print'?openPrintChooser(doc):openStoreChooser(doc);
    if(complete)schedule();
   };
   goToChooser();
   if(!complete)frame.addEventListener('load',goToChooser,{once:true});
   return;
  }
  closePanels();const tab=tabs.find(x=>x[0]===key);if(!tab)return;history.pushState(null,'',tab[2]);window.dispatchEvent(new PopStateEvent('popstate'));render();requestAnimationFrame(()=>requestAnimationFrame(()=>reveal(motionContent(document))));
 }
 // Register before legacy full-document navigation handlers.
 window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();press(b);navigate(b.dataset.pb1126Kind);},true);
 /* PB1315 stable laboratory transition */
 const pb1315Documents=new WeakSet();
 function pb1315Sync(panel){
  if(!panel?.isConnected||panel.dataset.panel!=='print'||panel.hidden)return;
  const doc=panel.querySelector('iframe')?.contentDocument;
  if(!doc?.body)return;
  const chooser=doc.querySelector('#pbR99LabChooser');
  const choosing=chooser&&!chooser.hidden&&doc.defaultView?.getComputedStyle(chooser).display!=='none';
  const scroll=doc.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea');
  const workspace=!!doc.querySelector('.photographerPrintModeNav')&&!!scroll?.children.length;
  const boot=doc.documentElement.classList.contains('pbR100F37LabEnterBoot');
  const transitioning=boot||(!choosing&&!workspace);
  const loader=panel.querySelector('.pb1126Loading');
  if(loader)loader.hidden=!transitioning;
  if(selected==='print'){
   document.documentElement.classList.toggle('pb1315PanelChanging',transitioning);
   const row=chrome?.querySelector('.pb1126Secondary');
   if(row&&transitioning)row.hidden=true;
   if(!transitioning)schedule();
  }
 }
 function pb1315Watch(panel){
  if(!panel?.isConnected||panel.dataset.panel!=='print')return;
  const frame=panel.querySelector('iframe'),doc=frame?.contentDocument;
  if(!doc?.body||!doc.defaultView)return;
  if(!pb1315Documents.has(doc)){
   pb1315Documents.add(doc);
   new MutationObserver(()=>pb1315Sync(panel)).observe(doc.documentElement,{attributes:true,attributeFilter:['class']});
   doc.defaultView.addEventListener('beforeunload',()=>{
    if(!panel.hidden&&selected==='print'){
     const loader=panel.querySelector('.pb1126Loading');if(loader)loader.hidden=false;
     document.documentElement.classList.add('pb1315PanelChanging');
     const row=chrome?.querySelector('.pb1126Secondary');if(row)row.hidden=true;
    }
   });
  }
  pb1315Sync(panel);
 }
 window.addEventListener('photobridge-panel-ready',event=>{
  if(!panelSessionReady)return;
  for(const panel of panels.values()){
   const frame=panel.querySelector('iframe');
   if(frame!==event.detail?.frame)continue;
   if(!frame.contentDocument?.querySelector('#pbR99LabChooser,.photographerPrintModeNav,#photographerStoreRoleHeader,.pbR96StoreChooser'))return;
   pb1315Watch(panel);schedule();break;
  }
 });
 window.addEventListener('photobridge-desktop-identity-ready',schedule);
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('popstate',()=>{const panel=new URLSearchParams(location.search).get('pbDesktopPanel');if(['store','print'].includes(panel))open(panel,false);else{closePanels();schedule();}});
 window.addEventListener('photobridge-navigation-tabs',e=>{if(e.detail?.tabs){authenticated=true;settings=e.detail;queueWarmPanels();try{sessionStorage.setItem('pb1126-desktop-tabs',JSON.stringify(settings));}catch{}schedule();}});
 window.addEventListener('photobridge-auth-session-changed',e=>{if(e.detail?.labRole==='customer'){authenticated=true;resumePanelDocuments();void refreshWallet();return;}panelSessionReady=false;pendingPanel=null;authenticated=false;clearPanelDocuments();chrome?.parentElement.remove();chrome=null;document.documentElement.classList.remove('pb1126Desktop','pb1127Choosing','pb1310GalleryHome');walletBalance=null;try{sessionStorage.removeItem('pb1126-desktop-tabs');}catch{}closePanels();for(const p of panels.values())p.remove();panels.clear();schedule();});
 function start(){render();void refreshWallet();const panel=query.get('pbDesktopPanel');if(['store','print'].includes(panel))open(panel,false);new MutationObserver(records=>{if(records.some(record=>!chrome?.contains(record.target)))schedule();}).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* PB1464 album third row */

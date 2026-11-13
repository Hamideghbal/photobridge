import fs from 'node:fs';
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* R1835 desktop store location */')){
 const declaration=/function\s+openStoreChooser\s*\(\s*doc\s*\)\s*\{/g;
 if([...nav.matchAll(declaration)].length!==1)throw Error('R1835 Store chooser declaration missing');
 nav=nav.replace(declaration,match=>`/* R1835 desktop store location */
 window.addEventListener('photobridge-store-location',event=>{
  const frame=panels.get('store')?.querySelector('iframe');
  if(selected!=='store'||event.detail?.frame!==frame)return;
  const u=new URL(location.href);u.searchParams.set('pbDesktopStoreQuery',frame.contentWindow.location.search);
  history.replaceState(history.state,'',u);
 });
 `+match);
 fs.writeFileSync(navFile,nav);
}
const settingsFile='dist/web/photobridge-r1635-photographer-inline-settings.js';
let settings=fs.readFileSync(settingsFile,'utf8');
if(!settings.includes('/* R1835 Store owns its secondary header */')){
 const target='  if(!row)return;';
 if(settings.split(target).length!==2)throw Error('R1835 inline settings row missing');
 settings=settings.replace(target,()=>target+`
  /* R1835 Store owns its secondary header */
  if(header.querySelector('.pb1126MainNav>button.active')?.dataset.pb1126Kind==='store'){
   row.querySelector('.pb1635SettingsNav')?.remove();
   if(panel)close();
   return;
  }`);
 new Function(settings);fs.writeFileSync(settingsFile,settings);
}
const categoryFile='dist/web/photobridge-r1249-camera-category.js';
let category=fs.readFileSync(categoryFile,'utf8');
const categoryBefore='if(button.parentNode!==header||button.nextSibling!==cart)header.insertBefore(button,cart);';
const categoryAfter='if(button.parentNode!==cart.parentNode||button.nextSibling!==cart)cart.parentNode.insertBefore(button,cart);';
if(category.includes(categoryBefore))category=category.replace(categoryBefore,categoryAfter);
else if(!category.includes(categoryAfter))throw Error('R1835 category control target missing');
// The sale cart can be moved into the sales toolbar by the current mobile layout.
category=category.replace("const cart=header?.querySelector('#saleCartBtn,.rentalCartBtnV810,.saleCartBtn');", "const cart=document.getElementById('saleCartBtn')||header?.querySelector('.rentalCartBtnV810');");
fs.writeFileSync(categoryFile,category);
const mobileFile='dist/web/photobridge-r1106-mobile-store-panel.js';
let mobile=fs.readFileSync(mobileFile,'utf8');
if(!mobile.includes('/* R1835 mobile store location */')){
 const target='function showChooser(panel,kind){';
 if(!mobile.includes(target))throw Error('R1835 mobile navigation target missing');
 mobile=mobile.replace(target,`/* R1835 mobile store location */
window.addEventListener('photobridge-store-location',event=>{
 const frame=panels.get('store')?.querySelector('iframe');
 if(selected!=='store'||event.detail?.frame!==frame)return;
 const u=new URL(location.href);u.searchParams.set('pbStoreQuery',frame.contentWindow.location.search);
 history.replaceState(history.state,'',u);
});
function showChooser(panel,kind){`);
 const chooserTarget="  const button=doc.querySelector('[data-store-home]');";
 if(!mobile.includes(chooserTarget))throw Error('R1835 explicit mobile Store chooser target missing');
 mobile=mobile.replace(chooserTarget,()=>"  if(typeof w.enterStoreChooserR96==='function'){w.enterStoreChooserR96('store');return true;}\n"+chooserTarget);
}
if(!mobile.includes('/* R1835 keep Store press across native button replacement */')){
 const registration="// Head registration precedes both old full-document Store and Print click handlers.";
 if(!mobile.includes(registration))throw Error('R1835 mobile click registration missing');
 mobile=mobile.replace(registration,()=>`/* R1835 keep Store press across native button replacement */
let storePressR1835=null;
window.addEventListener('pointerdown',event=>{
 const button=event.target?.closest?.('.photographerBottomAppNav button,.photographerBottomAppNav a');
 storePressR1835=button&&feature(button)==='store'&&event.button===0?{button,nav:button.closest('.photographerBottomAppNav'),x:event.clientX,y:event.clientY}:null;
},true);
window.addEventListener('pointercancel',()=>{storePressR1835=null},true);
`+registration);
 const clickTarget=" const el=e.target?.closest?.('.photographerBottomAppNav button,.photographerBottomAppNav a,.photographerHomeModeNav button,.photographerStoreEntry,.photographerStoreMobileNav');if(!el)return;";
 if(!mobile.includes(clickTarget))throw Error('R1835 mobile click target missing');
 mobile=mobile.replace(clickTarget,()=>` let el=e.target?.closest?.('.photographerBottomAppNav button,.photographerBottomAppNav a,.photographerHomeModeNav button,.photographerStoreEntry,.photographerStoreMobileNav');
 if(!el&&storePressR1835&&e.target?.closest?.('.photographerBottomAppNav')===storePressR1835.nav&&Math.hypot(e.clientX-storePressR1835.x,e.clientY-storePressR1835.y)<12)el=storePressR1835.button;
 storePressR1835=null;if(!el)return;`);
}
fs.writeFileSync(mobileFile,mobile);
const bookFile='dist/api/equipment-rental-book.html';
let book=fs.readFileSync(bookFile,'utf8');
if(!book.includes('function persistStoreLocationR1835')){
 const replace=(from,to)=>{if(!book.includes(from))throw Error('R1835 missing book target: '+from.slice(0,90));book=book.replace(from,to)};
 replace("function showMobilePanel(id){", `function persistStoreLocationR1835(id){
 const u=new URL(location.href),choosing=id==='storeChooserPanelR96';
 if(!choosing&&!shopId)return;
 const panels={equipmentPanel:'rental',salesPanel:'sales',bookingsPanel:'bookings',financePanel:'finance',storePanel:'store'};
 if(choosing){u.searchParams.delete('pbDirectShop');u.searchParams.delete('panel');}
 else {u.searchParams.set('pbDirectShop',shopId);u.searchParams.set('panel',panels[id]||'store');}
 history.replaceState(history.state,'',u);
 if(parent!==window)parent.dispatchEvent(new parent.CustomEvent('photobridge-store-location',{detail:{frame:window.frameElement}}));
}
function showMobilePanel(id){
 persistStoreLocationR1835(id);`);
 // An explicit shop URL restores that shop without briefly overwriting its saved location with the chooser.
 replace("enterStoreChooserR96(requestedStorePanelR96);$('#app').style.display='block';", "if(directShop){document.body.classList.remove('pbR96ChoosingStore');$('#app').style.visibility='hidden'}else enterStoreChooserR96(requestedStorePanelR96);$('#app').style.display='block';");
 replace("if(/^[0-9a-f-]{36}$/i.test(directShop)&&shops.some(s=>String(s.id)===directShop))await selectShop(directShop,true);", "if(/^[0-9a-f-]{36}$/i.test(directShop)&&shops.some(s=>String(s.id)===directShop)){await selectShop(directShop,true);if(!shopId)enterStoreChooserR96(requestedStorePanelR96)}else if(directShop)enterStoreChooserR96(requestedStorePanelR96);$('#app').style.visibility='';");
 fs.writeFileSync(bookFile,book);
}
for(const file of ['dist/web/index.html',bookFile]){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/(photobridge-(?:r1126-desktop-navigation|r1106-mobile-store-panel|r1249-camera-category|r1635-photographer-inline-settings)\.js)([^"'<>\s]*)/g,(_,name,q)=>{const clean=q.replace(/[?&]storeNav=[^&]*/g,'');return name+clean+(clean.includes('?')?'&':'?')+'storeNav=r1835'});
 fs.writeFileSync(file,html);
}
console.log('R1835: Store section survives desktop/mobile refresh; mobile category stays beside live cart');

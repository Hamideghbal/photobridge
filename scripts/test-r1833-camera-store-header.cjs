'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('R1833: camera Store header never shows lab tariff/location/invite controls',()=>{
 const nav=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(nav.includes("row.hidden=choosing||(active==='store'&&!storeHeader)"));
 assert(nav.includes("doc?.querySelectorAll('#pbR1123StoreDesktopNav>button')"),'only actual embedded Store tabs are read');
 assert(!nav.includes("const visiblePattern="),'avoid fragile second rewrite of Store controls');
 assert(nav.includes("for(const original of (active==='store'||storeHeader)?[]:visible)"));
 assert(nav.includes('if(cameraStore)row.append(nav)'));
 assert(nav.includes("salesPanel:'فروش تجهیزات'"));
 new Function(nav);
});
test('R1833: shop chooser and category/brand filters never share the same visible panel',()=>{
 const html=read('dist/api/equipment-rental-book.html');
 const css=read('scripts/r1833-camera-store-filters.css');
 assert(html.includes('pb1833CameraStoreFilterStyle'));
 assert(html.includes("document.body.classList.toggle('pb1833CameraStore',isCamera)"));
 assert(html.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(activeShop?.business_category||''))"));
 assert(css.includes('body.rentalPhotographerMode.pb1833CameraStore'));
 assert(css.includes('#app>.rentalPanel:not(.mobileActive)'));
 assert(css.includes('.storeFilterDockV809'));
 assert(css.includes('position:relative!important'));
 assert(css.includes('#rentalFilterBarR68'));
 assert(css.includes('#saleFilterBarR68'));
 assert(css.includes('.pbR96ChangeStore'));
 assert(html.includes("showMobilePanel(stayInStore?'equipmentPanel':'bookingsPanel')"),'after successful camera booking stay in Store, not tracking');
 assert(html.includes("const currentStore=selectedShopRecord()"),'store category determines success navigation');
});
test('R1833: build after R1832, before Windows hash snapshot; no lab/frame or server routes modified',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 const a=build.lastIndexOf("deployStep('./enable-r1832-camera-office-card-polish.mjs')");
 const b=build.lastIndexOf("deployStep('./enable-r1833-camera-store-header.mjs')");
 const c=build.lastIndexOf("runR1314(process.execPath,['scripts/prepare-store-desktop-ui.mjs']");
 assert(a>=0&&b>a&&c>b);
 const rev=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);assert(rev>=1833);
 const patch=read('scripts/enable-r1833-camera-store-header.mjs');
 assert(!/lab-desktop|dist\/api\/server\.js|dist\/api\/equipment-rental-portal\.html/.test(patch));
});

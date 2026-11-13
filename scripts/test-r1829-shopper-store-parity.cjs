'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const js=fs.readFileSync('dist/web/photobridge-r1829-shopper-store-parity.js','utf8'),css=fs.readFileSync('dist/web/photobridge-r1829-shopper-store-parity.css','utf8'),html=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
test('R1829 attaches storefront resources once and only in equipment shopper HTML',()=>{
 for(const f of ['/photobridge-r1829-shopper-store-parity.js?v=r1829','/photobridge-r1829-shopper-store-parity.css?v=r1829'])assert.equal(html.split(f).length-1,1);
 assert(!js.includes('labRoleWorkspace'));assert(!css.includes('#labRoleWorkspace'));
 assert.match(css,/body\.rentalPhotographerMode\.pbR1829CameraShopper #photographerStoreRoleHeader/);
 assert.match(css,/#photographerStoreIdentityBar/);
});
test('R1829 never enables sale for a disabled channel or frame/chassis shop',()=>{
 const window={},document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(js,{window,document,addEventListener(){},setInterval(){},requestAnimationFrame(){},MutationObserver:class{}});
 const allowed=window.pbR1829ShopperChannelEnabled;
 assert.equal(allowed(null,'sale_enabled'),false);
 assert.equal(allowed({business_category:'equipment_sale',sale_enabled:false},'sale_enabled'),false);
 assert.equal(allowed({business_category:'equipment_sale',sale_enabled:true},'sale_enabled'),true);
 assert.equal(allowed({business_category:'equipment_rental_sale',sale_enabled:null},'sale_enabled'),true);
 assert.equal(allowed({business_category:'frame_chassis',sale_enabled:true},'sale_enabled'),false);
 assert.equal(allowed({},'sale_enabled'),false);
});
test('R1829 uses existing salesPanel, cart and real navigation',()=>{
 assert(js.includes('#pbR1123StoreDesktopNav [data-store-panel="salesPanel"]'));
 assert.match(js,/#saleCartBtn/);
 assert.match(js,/#saleFilterBarR68 #saleCategoryBtnR68/);
 assert.match(js,/const canSale=allowed\(shop,'sale_enabled'\)/);
 assert.match(js,/pbR1829CameraShopper/);
});

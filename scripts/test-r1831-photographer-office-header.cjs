'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {readDeploymentPage:read}=require('./deployment-page-test-helpers.cjs');
test('R1831: camera Sales restored and purchase tools removed from photographer header',()=>{
 const js=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(js.includes("const cameraStoreControls=cameraStore?visible:[]"));
 assert(js.includes("salesPanel:'فروش تجهیزات'"));
 assert(js.includes("if(cameraStore)row.append(nav)"));
 assert(js.includes("else row.append(title,nav,cart)"),'frame/chassis keeps its old controls');
 assert(!js.includes('bring the REAL category action up beside cart'));
 new Function(js);
 assert(read('dist/web/photobridge-r1126-desktop-navigation.css').includes('/* R1831: the camera photographer'));
});
test('R1831: photographer Office opens date confirmation and selected equipment only for camera shops',()=>{
 const src=read('dist/web/photobridge-r63-photographer-store.js'),a=src.indexOf('function openOffice(){'),b=src.indexOf('  function rentalIntro()',a);
 assert(a>=0&&b>a);
 const snippet=src.slice(a,b);
 function run(category,display='block'){
  const cls=new Set(),called={confirmed:0,loaded:0,reset:0,chooser:0};
  const el={'#equipmentFlow':{style:{display}},'#equipmentPanel':{classList:{add:x=>cls.add(x),remove:x=>cls.delete(x),contains:x=>cls.has(x)}},'#start':{value:''},'#end':{value:''},'#pbR63OfficeTop small':{textContent:''},'[data-store-home]':{click:()=>called.chooser++}};
  const f=new Function('q','selectedShopRecord','onRentalDateChangedV811','openRentalDateConfirmV811','requestAnimationFrame','window',"let rs='2026-11-13',re='2026-11-16';"+snippet+";return openOffice");
  f(k=>el[k]||null,()=>({business_category:category}),()=>called.reset++,()=>called.confirmed++,cb=>cb(),{isoToJalaliInput:x=>x,renderItems:()=>called.loaded++})();
  return {cls,called,el};
 }
 const camera=run('equipment_rental');
 assert.equal(camera.called.confirmed,1);assert.equal(camera.called.reset,1);
 assert.equal(camera.called.loaded,1);assert(camera.cls.has('pbR63OfficeOpen'));
 assert.equal(camera.el['#end'].value,'2026-11-16');
 const frame=run('frame_chassis');
 assert.equal(frame.called.confirmed,0);assert.equal(frame.called.reset,0);
 assert.equal(frame.called.loaded,1,'frame/chassis equipment loading stays intact');
 const noShop=run('equipment_sale','none');
 assert.equal(noShop.called.chooser,1);assert(!noShop.cls.has('pbR63OfficeOpen'));
});
test('R1831: cache invalidation, final build order and protected modules',()=>{
 const main=read('dist/web/index.html'),eq=read('dist/api/equipment-rental-book.html'),b=read('scripts/liara-fast-build.mjs');
 for(const s of [main,eq]){assert(s.includes('photobridge-r1126-desktop-navigation.js'));assert(s.includes('photobridge-r1126-desktop-navigation.css'));assert(s.includes('&r1831=1'))}
 assert(eq.includes('photobridge-r63-photographer-store.js?v=r1130&r1831=1'));
 assert(eq.includes('photobridge-r63-photographer-store.css?v=100f13&r1831=1'));
 const p=read('scripts/enable-r1831-photographer-office-header.mjs');
 assert(!/dist\/api\/server\.js|lab-desktop|frame-orders|equipment-rental-portal\.html/.test(p));
 const a=b.lastIndexOf("deployStep('./enable-r1830-camera-office-booking-selection.mjs')"),r=b.lastIndexOf("deployStep('./enable-r1831-photographer-office-header.mjs')"),c=b.lastIndexOf("runR1314(process.execPath,['scripts/prepare-store-desktop-ui.mjs']");
 assert(a>=0&&r>a&&c>r);const revision=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);
 assert(Number.isInteger(revision)&&revision>=1831,'R1831 must remain installed in current or later releases');
});

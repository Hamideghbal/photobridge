'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('R1834: all 4 camera Store tabs route to live iframe, not stale cloned controls',()=>{
 const helper=read('scripts/r1834-camera-store-routing.js.txt');
 const routed=[],old={rentalPhotographerMode:true,frameCustomerStore:false};
 const doc={body:{classList:{contains:c=>!!old[c]}},defaultView:{openStoreSection:id=>routed.push(id)},querySelector:()=>null};
 const panels=new Map([['store',{querySelector:()=>({contentDocument:doc})}]]);
 const route=new Function('panels',helper+';return pb1834OpenCameraPanel')(panels);
 for(const tab of ['equipmentPanel','salesPanel','bookingsPanel','financePanel'])assert.equal(route(tab,doc),true);
 assert.deepEqual(routed,['equipmentPanel','salesPanel','bookingsPanel','financePanel']);
 assert.equal(route('print',doc),false);
 old.frameCustomerStore=true;
 assert.equal(route('financePanel',doc),false);
 assert.equal(routed.length,4,'frame/chassis Store unaffected');
});
test('R1834: detached old controls never block navigation; fallback uses current DOM',()=>{
 const helper=read('scripts/r1834-camera-store-routing.js.txt');
 let clicked=0,called=0;
 const doc={body:{classList:{contains:c=>c==='rentalPhotographerMode'}},
 defaultView:{},querySelector:()=>({isConnected:true,click:()=>clicked++})};
 const panels=new Map([['store',{querySelector:()=>({contentDocument:doc})}]]);
 const route=new Function('panels',helper+';return pb1834OpenCameraPanel')(panels);
 assert.equal(route('bookingsPanel',doc),true);
 assert.equal(clicked,1);
 doc.defaultView.openStoreSection=()=>called++;
 assert.equal(route('financePanel',doc),true);
 assert.equal(called,1);
 assert.equal(clicked,1,'direct routing preferred when loaded');
});
test('R1834: photographer Store main tab preserves selection and Store header has no lab chips',()=>{
 const nav=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(nav.includes('pb1834OpenCameraPanel(panelId,doc)'));
 assert(nav.includes('copy.dataset.storePanel=panelId'));
 assert(nav.includes("if(doc?.body?.classList?.contains('rentalPhotographerMode')&&!doc.body.classList.contains('frameCustomerStore'))return true;"));
 assert(/function\s+navigate\s*\(\s*key\s*\)/.test(nav),'main navigation remains defined');
 const chooserStart=nav.search(/function\s+openStoreChooser\s*\(\s*doc\s*\)\s*\{/);
 assert(chooserStart>=0,'Store chooser function is present');
 const opening=nav.indexOf('{',chooserStart);
 let depth=0,ending=-1;
 for(let pos=opening;pos<nav.length;pos++){
  if(nav[pos]==='{')depth++;
  else if(nav[pos]==='}'&&--depth===0){ending=pos+1;break;}
 }
 assert(ending>opening,'Store chooser function has balanced braces');
 const chooser=new Function('return '+nav.slice(chooserStart,ending))();
 let chooserClicks=0;
 const makeDoc=(frame)=>({body:{classList:{contains:name=>name==='rentalPhotographerMode'||(frame&&name==='frameCustomerStore')}},querySelector:()=>({click:()=>chooserClicks++})});
 assert.equal(chooser(makeDoc(false)),true,'camera store is already selected');
 assert.equal(chooserClicks,0,'camera main Store tab must not reopen chooser');
 assert.equal(chooser(makeDoc(true)),true,'frame store still opens chooser');
 assert.equal(chooserClicks,1);
 assert(nav.includes("for(const original of (active==='store'||storeHeader)?[]:visible)"));
 assert(nav.includes("const cameraStoreControls=cameraStore?visible:[]"));
 for(const label of ["equipmentPanel:'اجاره تجهیزات'","salesPanel:'فروش تجهیزات'","bookingsPanel:'آفیش‌های من'","financePanel:'مالی'"])assert(nav.includes(label));
 new Function(nav);
 const css=read('dist/web/photobridge-r1126-desktop-navigation.css');
 assert(css.includes('/* R1834: camera Store tabs'));
 assert(css.includes('pointer-events:auto!important'));
});
test('R1834: deployment assets are cache-busted and build runs after R1833',()=>{
 for(const page of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  const text=read(page);
  for(const asset of ['photobridge-r1126-desktop-navigation.js','photobridge-r1126-desktop-navigation.css']){
   const begin=text.indexOf(asset+'?');
   assert(begin>=0,page+': missing '+asset);
   const endings=[text.indexOf('"',begin),text.indexOf("'",begin)].filter(n=>n>begin);
   assert(endings.length>0,page+': unclosed '+asset+' URL');
   const url=text.slice(begin,Math.min(...endings));
   assert(url.split(/[?&]/).includes('r1834=1'),page+': missing cache revision in '+url);
  }
 }
 const build=read('scripts/liara-fast-build.mjs');
 const p=build.lastIndexOf("deployStep('./enable-r1833-camera-store-header.mjs')");
 const n=build.lastIndexOf("deployStep('./enable-r1834-camera-store-navigation.mjs')");
 const snap=build.lastIndexOf("runR1314(process.execPath,['scripts/prepare-store-desktop-ui.mjs']");
 assert(p>=0&&n>p&&snap>n);
 const revision=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);assert(revision>=1834);
 const patch=read('scripts/enable-r1834-camera-store-navigation.mjs');
 assert(!/dist\/api\/server\.js|lab-desktop|dist\/api\/equipment-rental-portal\.html/.test(patch));
});

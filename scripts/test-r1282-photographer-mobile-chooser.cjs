const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const script=read('dist/web/photobridge-r1282-photographer-mobile-navigation.js');
const CSS=read('dist/web/photobridge-r1282-photographer-mobile-navigation.css');
const STORE='/equipment-rental/book?pbStoreChooser=1';
const PRINT='/photographer/orders/flow?workspace=print&pbLabChooser=1';
function clickMobileDock(path,label,{chooser=false,labChooser=false,labNav=false,desktop=false}={}){
  let onClick,assigned='',prevented=false,stopped=false;
  const nav={classList:{contains:cls=>labNav&&cls==='labBottomAppNav'}};
  const button={
    textContent:label,
    hasAttribute:attr=>attr==='data-store-home'&&path.startsWith('/equipment-rental')&&label==='فروشگاه',
    getAttribute:attr=>attr==='aria-label'?label:null,
    querySelector:()=>({textContent:label}),
    closest:selector=>selector.startsWith('nav.photographerBottomAppNav')?nav:null
  };
  const document={
    readyState:'loading',
    body:{classList:{contains:cls=>chooser&&cls==='pbR96ChoosingStore'}},
    addEventListener:(type,fn)=>{if(type==='click')onClick=fn},
    getElementById:id=>id==='pbR99LabChooser'&&labChooser?{}:null
  };
  const window={matchMedia:()=>({matches:!desktop}),addEventListener:()=>{}};
  const location={pathname:path,assign:url=>{assigned=url}};
  vm.runInNewContext(script,{window,document,location,MutationObserver:function(){}},{timeout:1000});
  assert.equal(typeof onClick,'function','capture listener was not registered');
  const event={
    target:{closest:()=>button},
    defaultPrevented:false,
    preventDefault:()=>{prevented=true},
    stopImmediatePropagation:()=>{stopped=true}
  };
  onClick(event);
  return {assigned,prevented,stopped};
}
test('Store dock always reopens chooser from selected store and from photographer routes',()=>{
  for(const path of ['/equipment-rental/book','/photographer/gallery','/photographer/orders/flow']){
    assert.deepEqual(clickMobileDock(path,'فروشگاه'),{assigned:STORE,prevented:true,stopped:true});
  }
});
test('Print dock always reopens lab chooser even while viewing another lab or store',()=>{
  for(const path of ['/equipment-rental/book','/photographer/orders/flow','/photographer/gallery']){
    assert.deepEqual(clickMobileDock(path,'چاپ'),{assigned:PRINT,prevented:true,stopped:true});
  }
});
test('already-open chooser stays intact; unrelated navigation and desktop are untouched',()=>{
  assert.equal(clickMobileDock('/equipment-rental/book','فروشگاه',{chooser:true}).assigned,'');
  assert.equal(clickMobileDock('/photographer/orders/flow','چاپ',{labChooser:true}).assigned,'');
  assert.equal(clickMobileDock('/photographer/gallery','گالری').assigned,'');
  assert.equal(clickMobileDock('/photographer/gallery','فروشگاه',{labNav:true}).assigned,'');
  assert.equal(clickMobileDock('/photographer/gallery','فروشگاه',{desktop:true}).assigned,'');
});
test('selected store title has no synthetic frame prefix and ignores stale async selection',()=>{
  const store=read('dist/api/equipment-rental-book.html');
  const frame=read('dist/web/photobridge-r1207-frame-store.js');
  assert.match(store,/shopTitle=shopName\|\|\(s\?'فروشگاه':'انتخاب فروشگاه'\)/);
  assert.match(frame,/if\(name\.textContent!==raw\)name\.textContent=raw/);
  assert.doesNotMatch(frame,/name\.textContent=raw\.startsWith\('فروشگاه قاب و شاسی'\)/);
  assert.match(store,/if\(selectionEpoch!==shopSelectionEpoch\)return;shopId=String\(id\)/);
});
test('both entry points load new versioned asset; dock uses measured viewport space',()=>{
  for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
    const html=read(p);
    assert.match(html,/photobridge-r1282-photographer-mobile-navigation\.js\?v=r1282/);
    assert.match(html,/photobridge-r1282-photographer-mobile-navigation\.css\?v=r1282/);
  }
  assert.match(script,/getBoundingClientRect\(\)/);
  assert.match(script,/window\.innerHeight-rect\.top/);
  assert.match(script,/shell\.style\.setProperty\('bottom',px,'important'\)/);
  assert.match(CSS,/100dvh/);
  assert.match(read('DEPLOY_REVISION.txt'),/r1282/);
});

'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

async function firstEntry(destination,mobile=true,route='/photographer',search=''){
  const file=read('dist/web/photobridge-r100f5-entry-routing.js');
  const events=new Map();
  let target='',requests=0;
  const ctx={
    window:{matchMedia:()=>({matches:mobile})},
    location:{pathname:route,search,replace:path=>{target=path}},
    document:{readyState:'loading',addEventListener:(k,fn)=>{events.set(k,fn)}},
    addEventListener:()=>{},
    setTimeout:fn=>{fn();return 1},
    URLSearchParams,
    fetch:async path=>{
      requests++;assert.equal(path,'/api/customer/entry-context');
      return {ok:true,json:async()=>({destination})};
    }
  };
  vm.runInNewContext(file,ctx,{timeout:1000});
  events.get('DOMContentLoaded')?.();
  for(let i=0;i<12;i++)await Promise.resolve();
  return {target,requests};
}

test('invitation-origin controls only the first MOBILE entry',async()=>{
  assert.deepEqual(await firstEntry('lab'),{
    target:'/photographer/orders/flow?workspace=print&pbLabChooser=1',requests:1
  });
  assert.deepEqual(await firstEntry('rental'),{
    target:'/equipment-rental/book?pbStoreChooser=1',requests:1
  });
  for(const origin of ['retouch','photographer','free','admin']){
    assert.deepEqual(await firstEntry(origin),{target:'/photographer/gallery',requests:1});
  }
});
test('DESKTOP behavior and user-selected tabs are unchanged',async()=>{
  assert.deepEqual(await firstEntry('lab',false),{target:'/photographer/gallery',requests:1});
  assert.deepEqual(await firstEntry('rental',false),{target:'/photographer/gallery',requests:1});
  assert.deepEqual(await firstEntry('lab',true,'/photographer/gallery'),{target:'',requests:0});
  assert.deepEqual(await firstEntry('lab',true,'/photographer','?pbEntryDone=lab'),{target:'',requests:0});
});
test('mobile chooser masks only background print content, not the bottom dock',()=>{
  const css=read('dist/web/photobridge-r1720-mobile-print-chooser.css');
  assert.match(css,/@media screen and \(max-width:820px\)/);
  assert.match(css,/body\.pbR100F14ChoosingLab/);
  for(const id of ['.photographerRolePageScrollArea','.ordersWorkspace.liveCustomerOrders','#pbR1122PrintOrderStatuses','.pb761PhotoStatuses'])
    assert(css.includes(id),id);
  assert(!css.includes('.photographerBottomAppNav'),'keep user navigation accessible');
});
test('mobile chooser background activity is reduced without changing desktop polling',()=>{
  const chooser=read('dist/web/photobridge-v904r99-lab-chooser.js');
  assert(chooser.includes("matches?30000:8000"));
  const rail=read('dist/web/photobridge-r1122-mobile-print-orders.js');
  assert(rail.includes("classList.contains('pbR100F14ChoosingLab')"));
  assert(rail.includes('old?.remove();return;'));
});
test('mobile fix is linked only in web HTML after desktop manifests are prepared',()=>{
  const html=read('dist/web/index.html');
  assert.equal(html.split('photobridge-r1720-mobile-print-chooser.css').length-1,1);
  assert.equal(html.split('photobridge-r100f5-entry-routing.js').length-1,1);
  assert(html.includes('photobridge-r100f5-entry-routing.js?v=r1720'));
  assert(!html.includes('pbR1720DesktopOverride'));
});

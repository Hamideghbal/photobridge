'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
const start=source.indexOf('  function pbR1879FitChooserToDock(){');
const end=source.indexOf('  function pbR1879SyncChooserViewport()',start);
assert.ok(start>=0&&end>start);
function fixture({embedded=false,search='',width=390,active=true}={}){
 const props=new Map([['height','300px'],['bottom','auto'],['overflow','hidden']]);
 const style={getPropertyValue:k=>props.get(k)||'',getPropertyPriority:k=>props.has(k)?'important':'',
  setProperty:(k,v,p)=>{assert.equal(p,'important');props.set(k,v)},removeProperty:k=>props.delete(k)};
 const chooser={style,getBoundingClientRect:()=>({top:132})};
 const doc={getElementById:()=>chooser,body:{classList:{contains:()=>active}},
  documentElement:{hasAttribute:k=>k==='data-pb1106-embedded'&&embedded},
  querySelectorAll:()=>embedded?[]:[{getBoundingClientRect:()=>({top:700,height:50,width:80})}]};
 vm.runInNewContext(source.slice(start,end)+'\npbR1879FitChooserToDock();',
  {document:doc,window:{innerWidth:width},location:{search},URLSearchParams,ROOT_ID:'pbR99LabChooser',
   getComputedStyle:()=>({display:'block',visibility:'visible',opacity:'1'})});
 return props;
}
test('R2086: embedded Print chooser clears stale height and uses entire available frame',()=>{
 const p=fixture({embedded:true});
 assert.equal(p.get('height'),'auto');assert.equal(p.get('bottom'),'0px');
 assert.equal(p.get('max-height'),'none');assert.equal(p.get('min-height'),'0');
 assert.equal(p.has('overflow'),false);
});
test('R2086: embedded query handles re-entry before the frame marker is installed',()=>{
 const p=fixture({search:'?workspace=print&pbEmbeddedStore=1'});
 assert.equal(p.get('height'),'auto');assert.equal(p.get('bottom'),'0px');
});
test('R2086: direct mobile Print retains real local dock clearance',()=>{
 const p=fixture();assert.equal(p.get('height'),'560px');assert.equal(p.get('bottom'),'auto');
});
test('R2086: desktop and inactive chooser stay untouched',()=>{
 for(const p of [fixture({embedded:true,width:1024}),fixture({embedded:true,active:false})]){
  assert.equal(p.get('height'),'300px');assert.equal(p.get('bottom'),'auto');
 }
});

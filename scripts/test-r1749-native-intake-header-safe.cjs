'use strict';
// R1749 regression test — Windows native launcher in the visible header.
// Does not submit orders or simulate a real deployed Electron application.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root='dist/web/lab-desktop-ui/';
const intake=fs.readFileSync(root+'photobridge-r1137-lab-local-intake.js','utf8');
const header=fs.readFileSync(root+'photobridge-r1147-lab-admin-header.js','utf8');
const css=fs.readFileSync(root+'photobridge-r1147-lab-admin-header.css','utf8');
const site=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');

function makeNode(){
 return {
  children:[], parentElement:null, id:'', className:'', textContent:'',
  classList:{remove(){}},
  append(child){if(child.parentElement){child.parentElement.children=child.parentElement.children.filter(x=>x!==child)}this.children.push(child);child.parentElement=this},
  prepend(child){if(child.parentElement){child.parentElement.children=child.parentElement.children.filter(x=>x!==child)}this.children.unshift(child);child.parentElement=this},
  querySelector(){return null;},
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null}
 };
}
function mount({pathname='/lab/orders',navVisible=true,preexisting=false}={}){
 const host=makeNode(),nav=makeNode(),top=makeNode(),hidden=makeNode(),fallback=makeNode();
 host.querySelector=(selector)=>{
  if(selector==='.mainQueueFilters')return hidden;
  if(selector==='.ordersWorkspace')return fallback;
  return null;
 };
 const old=makeNode();old.id='pb1137LocalIntakeButton';old.onclick=()=>{};
 if(preexisting)hidden.append(old);
 const find=()=>[nav,top,hidden,fallback].flatMap(p=>p.children).find(x=>x.id==='pb1137LocalIntakeButton')||null;
 const document={
  querySelector(selector){
   if(selector==='.labRoleWorkspace main')return host;
   if(selector==='.labRoleWorkspace .stageQueueWorkspace')return host;
   if(selector==='.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav')return navVisible?nav:null;
   if(selector==='.labRoleWorkspace .labSingleHeader')return top;
   return null;
  },
  getElementById(){return find()}
 };
 const from=intake.indexOf('function mount(){'),to=intake.indexOf('let primaryState=',from);
 assert(from>=0&&to>from,'mount snippet must exist');
 const sandbox={
  document,location:{pathname},window:{matchMedia:()=>({matches:true})},
  storage:()=>({deviceId:()=> 'test-primary-device'}),primaryState:true,checkPrimary(){throw Error('no permission request required')},
  node:(_tag,title,cls)=>{const el=makeNode();el.textContent=title;el.className=cls;return el},
  open(){}
 };
 vm.createContext(sandbox);
 vm.runInContext(intake.slice(from,to)+'\nthis.runMount=mount;',sandbox);
 sandbox.runMount();
 const found=find();
 assert(found,'real intake button must be mounted');
 assert.equal(typeof found.onclick,'function');
 return {found,nav,top,hidden,fallback};
}

test('Windows orders: launcher is in visible second header rather than hidden old filters',()=>{
 const r=mount();
 assert.equal(r.found.parentElement,r.nav);
 assert.notEqual(r.found.parentElement,r.hidden);
});
test('Windows first /lab screen also places launcher in visible second header',()=>{
 const r=mount({pathname:'/lab'});
 assert.equal(r.found.parentElement,r.nav);
});
test('Windows startup without second header falls back to visible first header',()=>{
 const r=mount({navVisible:false});
 assert.equal(r.found.parentElement,r.top);
});
test('pre-existing launcher is moved without duplicating its identity',()=>{
 const r=mount({preexisting:true});
 assert.equal(r.found.parentElement,r.nav);
 assert.equal([r.nav,r.top,r.hidden,r.fallback].flatMap(x=>x.children).filter(x=>x.id==='pb1137LocalIntakeButton').length,1);
});
test('header rebuild saves the native button and never removes it as proxy',()=>{
 assert(header.includes("const retainedIntake=row.querySelector('#pb1137LocalIntakeButton')"));
 assert(header.includes('if(retainedIntake)row.prepend(retainedIntake)'));
 assert(header.includes("row.querySelector(':scope>.pb1174QueueLaunch:not(#pb1137LocalIntakeButton)')?.remove();"));
 assert(css.includes('.pb1148SecondaryHeader.pb1174QueueNav>#pb1137LocalIntakeButton{display:inline-flex!important'));
 assert(css.includes('.labSingleHeader>#pb1137LocalIntakeButton{display:inline-flex!important'));
});
test('retired queue toolbar is never used as a native launcher target',()=>{
 const begin=intake.indexOf('function mount(){');
 const end=intake.indexOf('let primaryState=',begin);
 const mounted=intake.slice(begin,end);
 assert(mounted.includes("const target=desktopQueue?(header||visibleFallback):host.querySelector('.ordersWorkspace');"));
 assert(!/const target=[^;]*mainQueueFilters/.test(mounted),
  'launcher must never fall back to the hidden old toolbar');
 assert(!mounted.includes('header||visibleFallback||('));
 assert(css.includes('.labRoleWorkspace .mainQueueFilters{display:none!important;visibility:hidden!important}'),
  'legacy queue toolbar must not show as a second desktop header');
 const sourceLine=(header.match(/const\s+source\s*=[^\n]+/)||[])[0]||'';
 assert(sourceLine.includes('mainQueueFilters'),
  'unified header must still locate the React queue tab source');
 assert(header.includes("source.querySelectorAll(':scope>button')"),
  'unified header must still read the React tab buttons');
 assert(header.includes('live.click()'),
  'unified header must forward tab clicks to the original React controls');
});
test('authorization, real click handler, original site UI and orders remain unchanged',()=>{
 assert(intake.includes('/api/lab/download-device'));
 assert(intake.includes('primaryState'));
 assert(intake.includes("button.id='pb1137LocalIntakeButton'"));
 assert(!site.includes('/* PB1749 native visible intake */'));
 assert(!site.includes('/* PB1740 consolidated pending-invite SMS */'));
 const installer=fs.readFileSync('scripts/enable-r1749-native-intake-header-safe.mjs','utf8');
 assert(!installer.includes('/api/lab/delegated-orders/'),'must not change order submission');
 assert(!installer.includes('resendPendingInvitation'),'must not change invitation behavior');
});
test('Windows auto-update manifest checksums match the exact changed payload',()=>{
 const m=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
 for(const name of ['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js','photobridge-r1147-lab-admin-header.css']){
  const e=m.files.find(f=>f.name===name);
  assert(e,name+' must be in manifest');
  assert.equal(e.sha256,sha(fs.readFileSync(root+name)),'stale '+name);
 }
 assert.equal(m.build,sha(JSON.stringify(m.files)));
});

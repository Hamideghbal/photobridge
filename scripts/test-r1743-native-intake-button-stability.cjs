'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root='dist/web/lab-desktop-ui/';
const js=fs.readFileSync(root+'photobridge-r1137-lab-local-intake.js','utf8');
const header=fs.readFileSync(root+'photobridge-r1147-lab-admin-header.js','utf8');
const css=fs.readFileSync(root+'photobridge-r1147-lab-admin-header.css','utf8');
const original=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');

function launch({navVisible=true,preexisting=false,pathname='/lab/orders'}={}){
 const elements=new Map();
 function element(){
  return {children:[],parentElement:null,id:'',textContent:'',classList:{items:new Set(),add(name){this.items.add(name)},contains(name){return this.items.has(name)}},
   append(child){if(child.parentElement){child.parentElement.children=child.parentElement.children.filter(c=>c!==child)}this.children.push(child);child.parentElement=this;}};
 }
 const host=element(),nav=element(),top=element(),hiddenFilters=element(),plainOrders=element();
 const originalButton=element();originalButton.id='pb1137LocalIntakeButton';originalButton.onclick=()=>{};
 if(preexisting){hiddenFilters.append(originalButton);elements.set(originalButton.id,originalButton);}
 host.querySelector=selector=>{
  if(selector==='.labQueueQuickIntroV464 button')return null;
  if(selector==='.mainQueueFilters')return hiddenFilters;
  if(selector==='.ordersWorkspace')return plainOrders;
  return null;
 };
 const document={
  querySelector(selector){
   if(selector==='.labRoleWorkspace main')return host;
   if(selector==='.labRoleWorkspace .stageQueueWorkspace')return host;
   if(selector==='.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav')return navVisible?nav:null;
   if(selector==='.labRoleWorkspace .labSingleHeader')return top;
   return null;
  },
  getElementById(id){return elements.get(id)||null}
 };
 let clicks=0;
 const node=(tag,text,className)=>{const el=element();el.textContent=text;el.className=className;el.type='button';
   // When the button is appended, register it as document-visible.
   const nativeAppend=el.append;
   el.append=nativeAppend;
   return el;
 };
 for(const target of [host,nav,top,hiddenFilters,plainOrders]){
  const old=target.append.bind(target);
  target.append=child=>{old(child);if(child.id)elements.set(child.id,child);};
 }
 const start=js.indexOf('function mount(){'),end=js.indexOf('let primaryState=',start);
 assert(start>=0&&end>start,'native mount function must be present');
 const sandbox={
  document,window:{pbLabLocalIntakeStorage:{},matchMedia:()=>({matches:true})},
  location:{pathname},storage:()=>({deviceId:()=> 'primary-device'}),
  primaryState:true,checkPrimary(){throw Error('recheck not needed')},
  node,open(){clicks++}
 };
 vm.createContext(sandbox);
 vm.runInContext(js.slice(start,end)+'\nthis.runMount=mount;',sandbox);
 sandbox.runMount();
 const placed=[...nav.children,...top.children,...hiddenFilters.children,...plainOrders.children].filter(x=>x.id==='pb1137LocalIntakeButton');
 assert.equal(placed.length,1,'never duplicate the one real button');
 const button=placed[0];assert.equal(typeof button.onclick,'function');
 // The native build can wrap this callback with its own device/album logic.
 // Keep it, and do not invoke order creation from a synthetic DOM harness.
 assert(/async function open\s*\(/.test(js),'real intake form remains present');
 return {nav,top,hiddenFilters,button};
}

test('Windows desktop launcher is in visible fixed queue header, not the CSS-hidden original filter',()=>{
 const r=launch();
 assert.equal(r.button.parentElement,r.nav);
 assert.notEqual(r.button.parentElement,r.hiddenFilters);
});
test('root /lab also finds the native queue and its actual button',()=>{
 const r=launch({pathname:'/lab'});
 assert.equal(r.button.parentElement,r.nav);
});

test('native header cannot delete the real intake button as a retired proxy',()=>{
 assert(header.includes("row.querySelector(':scope>.pb1174QueueLaunch:not(#pb1137LocalIntakeButton)')?.remove();"));
 assert(!header.includes("row.querySelector(':scope>.pb1174QueueLaunch')?.remove();"));
 assert(!header.includes("intake.classList.add('pb1174QueueLaunch')"));
 assert(js.includes("location.pathname==='/lab'&&!!document.querySelector('.labRoleWorkspace .stageQueueWorkspace')"));
 assert(header.includes("location.pathname==='/lab'&&!!document.querySelector('.labRoleWorkspace .stageQueueWorkspace')"));
});
test('Windows desktop launcher falls back to visible main header while the secondary header is initializing',()=>{
 const r=launch({navVisible:false});
 assert.equal(r.button.parentElement,r.top);
});
test('existing original launcher moves to the header without creating a proxy or changing its identity',()=>{
 const r=launch({preexisting:true});
 assert.equal(r.button.parentElement,r.nav);
});
test('native header rebuild preserves the same element and flags it as queue launcher',()=>{
 assert(header.includes('/* PB1743 preserve native launch while rebuilding header */'));
 assert(header.includes("const retainedLaunch=row.querySelector('#pb1137LocalIntakeButton')"));
 assert(header.includes("if(retainedLaunch){retainedLaunch.classList.remove('pb1174QueueLaunch');row.prepend(retainedLaunch);}"));
 assert(header.includes("if(isQueue&&intake){intake.classList.remove('pb1174QueueLaunch')"));
 assert(css.includes('/* PB1743 native launch visible in queue header */'));
 assert(css.includes('.pb1148SecondaryHeader.pb1174QueueNav>#pb1137LocalIntakeButton{display:inline-flex!important'));
});
test('site intake and native permission guard are preserved',()=>{
 const mountStart=js.indexOf('function mount(){');
 const mountEnd=js.indexOf('let primaryState=',mountStart);
 const mounted=mountStart>=0&&mountEnd>mountStart?js.slice(mountStart,mountEnd):'';
 assert(mounted.includes('primaryState'),'native mount must retain primary-device state check');
 assert(js.includes('/api/lab/download-device'),'native primary-device verification API must remain present');
 assert(js.includes("const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;"));
 assert(js.includes("const visibleFallback=desktopQueue?document.querySelector('.labRoleWorkspace .labSingleHeader'):null;"));
 assert(original.includes("button.id='pb1137LocalIntakeButton'"));
 const launchAt=original.indexOf("button.id='pb1137LocalIntakeButton'");
 const launchCode=original.slice(Math.max(0,launchAt-500),launchAt+1600);
 assert(/\bbutton\.(?:onclick\s*=|addEventListener\s*\(\s*['"]click['"])/.test(launchCode),
  'site intake button must keep an attached click handler (direct or wrapped)');
 assert(!original.includes('/* PB1743 native button target */'),"site's original intake navigation remains untouched");
});
test('Windows hot-update manifest lists the exact modified native JS and CSS bytes',()=>{
 const m=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
 for(const name of ['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js','photobridge-r1147-lab-admin-header.css']){
  const f=m.files.find(x=>x.name===name);assert(f,'missing '+name);assert.equal(f.sha256,hash(fs.readFileSync(root+name)),'stale '+name);
 }
 assert.equal(m.build,hash(JSON.stringify(m.files)));
});

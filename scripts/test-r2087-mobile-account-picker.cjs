'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dist/web/index.html','utf8');
const source=html.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source?.includes('PB2087'));
function fixture({path='/photographer',search='',roles=['photographer','lab','rental'],standalone=true,mobile=true,embedded=false,referrer='',errors=[],ticket=null,userAgent='',minimal=false}={}){
 const requests=[],redirects=[],classes=new Set(),events={},windowEvents={},storage=new Map(),selectionTimers=[],session=new Map(ticket?[['pb2092-account-handoff',JSON.stringify(ticket)]]:[]);
 const roleData={
  photographer:{user:{labRole:'customer',name:'آتلیه آبی'}},
  lab:{user:{labRole:'lab_admin'},lab:{id:'l1',name:'لابراتوار آبی'}},
  rental:{user:{rentalRole:'shop_admin'},rentalShop:{id:'s1',name:'فروشگاه آبی'}}
 };
 function element(tag){
  const node={tag,children:[],dataset:{},attrs:{},textContent:'',handlers:{},
   append(...items){for(const item of items){item.parent=this;this.children.push(item)}},
   setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.handlers[k]=fn},
   remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)},
   showModal(){this.attrs.open=''},focus(){},querySelector(q){return this.children.find(c=>c.tag===q)}};
  return node;
 }
 const body=element('body');
 const doc={body,hidden:false,referrer,documentElement:{classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)}},
  createElement:element,addEventListener:(k,fn)=>events[k]=fn,querySelector:()=>null};
 const ctx={window:null,document:doc,navigator:{standalone,userAgent},matchMedia:q=>({matches:q.includes('820px')?mobile:q.includes('minimal-ui')?minimal:standalone}),
  location:{pathname:path,search,hash:'',origin:'https://photobridge.ir',href:'https://photobridge.ir'+path+search,replace:u=>redirects.push(u)},
  history:{state:null,replaceState(){}},sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  fetch:async(url,init)=>{const portal=init?.headers?.['x-photobridge-portal'];requests.push(portal);if(errors.includes(portal))throw Error('network');return{ok:roles.includes(portal),status:roles.includes(portal)?200:401,json:async()=>roleData[portal]}},
  URL,URLSearchParams,Headers,Request,AbortController,setTimeout:(fn,ms)=>ms<=1200?(selectionTimers.push(fn),0):setTimeout(fn,ms),clearTimeout,Date,Event:class{constructor(type){this.type=type}},
  addEventListener:(k,fn)=>windowEvents[k]=fn,dispatchEvent:()=>{}};
 ctx.window=ctx;ctx.top=embedded?{}:ctx;
 vm.runInNewContext(source,ctx);
 const allButtons=()=>body.children[0]?.children[0]?.children.filter(n=>n.tag==='button')||[];
 const buttons=()=>allButtons().filter(n=>!n.className?.includes('pb2093LoginAction'));
 const loginAction=()=>allButtons().find(n=>n.className?.includes('pb2093LoginAction'));
 return {requests,redirects,classes,buttons,loginAction,events,doc,windowEvents,roles,storage,session,ctx,finishSelection:()=>selectionTimers.splice(0).forEach(fn=>fn())};
}
async function settle(){for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r))}
test('R2087: three live sessions show three named options, never auto-select',async()=>{
 const f=fixture();await settle();
 assert.equal(f.buttons().length,3);assert.deepEqual(f.redirects,[]);
 assert.deepEqual(f.buttons().map(b=>b.dataset.portal),['photographer','lab','rental']);
 assert.equal(f.buttons()[1].children[1].children[1].textContent,'لابراتوار آبی');
 f.buttons()[1].handlers.click();assert.equal(f.buttons()[1].attrs['aria-pressed'],'true');await settle();
 assert.deepEqual(f.redirects,['/lab?pb2087AccountEntry=1']);
 assert.equal(f.requests.filter(p=>p==='lab').length,2);
});
test('R2090: even one valid role waits for explicit selection',async()=>{
 const f=fixture({roles:['rental']});await settle();
 assert.equal(f.buttons().length,1);assert.deepEqual(f.redirects,[]);
 f.buttons()[0].handlers.click();await settle();assert.deepEqual(f.redirects,['/rental?pb2087AccountEntry=1']);
});
test('R2092: expired sessions, verified one-use handoff, sensitive links and desktop/iframe do not prompt',async()=>{
 for(const options of [{search:'?pb2087AccountEntry=1',ticket:{path:'/photographer',until:Date.now()+10000}},{search:'?token=x'},{standalone:false},{mobile:false},{embedded:true}]){
  const f=fixture(options);await settle();assert.equal(f.buttons().length,0);assert.deepEqual(f.redirects,[]);
 }
});
test('R2087: choosing current role preserves the open workspace',async()=>{
 const f=fixture();await settle();f.buttons()[0].handlers.click();f.finishSelection();await settle();
 assert.deepEqual(f.redirects,[]);assert.equal(f.buttons().length,0);assert.equal(f.classes.has('pb2087AccountPending'),false);
});
test('R2087: restored document can select an account without cold entry',async()=>{
 const f=fixture({path:'/lab/finance',referrer:'https://photobridge.ir/lab'});await settle();assert.equal(f.buttons().length,3);f.buttons()[1].handlers.click();await settle();assert.equal(f.buttons().length,0);
 f.windowEvents.pageshow({persisted:true});await settle();assert.equal(f.buttons().length,3);
 f.buttons()[1].handlers.click();f.finishSelection();await settle();assert.deepEqual(f.redirects,[]);
});
test('R2087: final web documents and entry routing contain the new picker',()=>{
 for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
  const s=fs.readFileSync(path,'utf8');assert.ok(s.includes('pb2087AccountPickerStyle'));assert.ok(s.includes('PB2087'));
 }
 assert.ok(fs.readFileSync('dist/web/photobridge-r100f5-entry-routing.js','utf8').includes('PB2087 wait for account selection'));
});

test('R2088: physical left arrow, larger RTL cards and distinct account icons',()=>{
 assert.ok(html.includes('grid-template-columns:52px minmax(0,1fr) 24px;direction:rtl'));
 assert.ok(html.includes('min-height:98px'));
 assert.ok(html.includes('border-left:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg)'));
 for(const role of ['photographer','lab','rental'])assert.ok(html.includes('.pb2087AccountIcon[data-icon="'+role+'"]'));
 assert.ok(!source.includes('1200-(Date.now()-shownAt)'));
});

test('R2090: partial network errors cannot auto-enter the only responding account',async()=>{
 const f=fixture({roles:['lab'],errors:['photographer','rental']});await settle();
 assert.equal(f.buttons().filter(b=>b.dataset.portal).length,1);assert.deepEqual(f.redirects,[]);
 assert.equal(f.buttons().filter(b=>b.className==='pb2090AccountRetry').length,1);
});
test('R2090: a short foreground cycle opens the chooser without a 15-second threshold',async()=>{
 const f=fixture({path:'/lab/finance',referrer:'https://photobridge.ir/lab'});await settle();f.buttons()[1].handlers.click();await settle();
 f.doc.hidden=true;f.events.visibilitychange();f.doc.hidden=false;f.events.visibilitychange();await settle();
 assert.equal(f.buttons().length,3);assert.deepEqual(f.redirects,[]);
});
test('R2090: a restored deep workspace from the app launcher also prompts',async()=>{
 const f=fixture({path:'/lab/finance'});await settle();assert.equal(f.buttons().length,3);assert.deepEqual(f.redirects,[]);
});

test('R2092: referrer and stale/copied handoff query never grant entry',async()=>{
 for(const options of [{path:'/lab/finance',referrer:'https://photobridge.ir/lab'},{search:'?pb2087AccountEntry=1'},{search:'?pb2087AccountEntry=1',ticket:{path:'/lab',until:Date.now()+10000}},{search:'?pb2087AccountEntry=1',ticket:{path:'/photographer',until:Date.now()-1}},{search:'?pb2092Launch=1&pb2087AccountEntry=1',ticket:{path:'/photographer',until:Date.now()+10000}}]){
  const f=fixture(options);await settle();assert.equal(f.buttons().length,3);assert.deepEqual(f.redirects,[]);
 }
});
test('R2092: minimal-ui and mobile shortcut browser open explicit picker',async()=>{
 for(const options of [{standalone:false,minimal:true},{standalone:false,userAgent:'Mozilla Android Mobile',mobile:false}]){
  const f=fixture(options);await settle();assert.equal(f.buttons().length,3);assert.deepEqual(f.redirects,[]);
 }
});
test('R2092: underlying auth requests stay pending until user selects current account',async()=>{
 const f=fixture();await settle();let released=false;
 const p=f.ctx.pb2092WaitAccount().then(()=>released=true);await settle();assert.equal(released,false);
 f.buttons()[0].handlers.click();await p;assert.equal(released,true);
});
test('R2092: focus return without visibility event and one-use landing ticket',async()=>{
 const f=fixture();await settle();f.buttons()[0].handlers.click();await settle();
 assert.equal(f.ctx.pb2092AccountNavigate('/photographer/gallery'),true);
 assert.deepEqual(f.redirects,['/photographer/gallery?pb2087AccountEntry=1']);
 const ticket=JSON.parse(f.session.get('pb2092-account-handoff'));
 const g=fixture({path:'/photographer/gallery',search:'?pb2087AccountEntry=1',ticket});await settle();assert.equal(g.buttons().length,0);
 assert.equal(g.session.has('pb2092-account-handoff'),false);
 g.windowEvents.blur();g.windowEvents.focus();await settle();assert.equal(g.buttons().length,3);
});
test('R2092: first-head picker and explicit manifest launch survive final assets',()=>{
 for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
  const s=fs.readFileSync(path,'utf8');const head=s.match(/<head(?:\s[^>]*)?>/i);const script=s.indexOf('<script id="pb1493MobileSessionResume">');
  assert.ok(head&&script>head.index);assert.ok(!s.slice(head.index,script).includes('<script'));
 }
 assert.equal(JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest','utf8')).start_url,'/photographer?pb2092Launch=1');
 assert.ok(fs.readFileSync('dist/web/photobridge-r100f5-entry-routing.js','utf8').includes('PB2092 authorized landing'));
});

test('R2093: new login lets missing role enter normal login without logging out other sessions',async()=>{
 const f=fixture({roles:['photographer','lab']});await settle();
 assert.ok(f.loginAction());assert.equal(f.buttons().length,2);
 f.loginAction().handlers.click();await settle();
 assert.deepEqual(f.buttons().map(b=>b.dataset.portal),['photographer','lab','rental']);
 f.buttons()[2].handlers.click();await settle();
 assert.deepEqual(f.redirects,['/rental?pb2087AccountEntry=1']);
 assert.ok(f.requests.every(p=>['photographer','lab','rental'].includes(p)));
 const ticket=JSON.parse(f.session.get('pb2092-account-handoff'));
 const g=fixture({path:'/rental',search:'?pb2087AccountEntry=1',roles:['photographer','lab'],ticket});await settle();
 assert.equal(g.buttons().length,0);assert.equal(g.loginAction(),undefined);
 assert.equal(ticket.login,true);g.doc.querySelector=()=>({});g.windowEvents.pageshow({persisted:false});g.windowEvents.blur();g.windowEvents.focus();await settle();assert.equal(g.loginAction(),undefined,'do not interrupt sign-in form');
});
test('R2093: no active sessions still offer all login roles; back preserves current list',async()=>{
 const f=fixture({roles:[]});await settle();
 assert.equal(f.buttons().length,0);assert.ok(f.loginAction());assert.deepEqual(f.redirects,[]);
 f.loginAction().handlers.click();await settle();assert.equal(f.buttons().length,3);
 f.loginAction().handlers.click();await settle();assert.equal(f.buttons().length,0);assert.ok(f.loginAction());
});

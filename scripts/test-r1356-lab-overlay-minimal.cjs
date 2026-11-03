'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('apps/lab-desktop/desktop-overlay.js','utf8');
function fakeEnvironment(conflicts=[]){
 const elements=[],listeners={};
 class Node{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.hidden=false;this.isConnected=true;this.textContent='';elements.push(this)}
  append(...nodes){this.children.push(...nodes)}
  setAttribute(k,v){this.attributes[k]=v}
  addEventListener(k,cb){(this.events||(this.events={}))[k]=cb}
  remove(){this.isConnected=false}
  focus(){}
 }
 const document={head:new Node('head'),body:new Node('body'),createElement:t=>new Node(t),querySelectorAll:sel=>elements.filter(e=>e.isConnected&&sel==='.'+e.className),addEventListener:(event,cb)=>{listeners[event]=cb}};
 const window={addEventListener:()=>{}};
 const status={signedIn:true,pending:0,conflicts,online:true,nativeVersion:'1.0.17'};
 const requests=[];let pollMs=0;
 vm.runInNewContext(source,{window,document,confirm:()=>false,fetch:async(url,opt)=>{requests.push({url,opt});return{ok:true,json:async()=>status}},setInterval:(f,ms)=>{pollMs=ms}});
 return {elements,listeners,requests,get pollMs(){return pollMs}};
}
const wait=()=>new Promise(resolve=>setImmediate(resolve));
test('no permanent bottom sync/update bar or idle diagnostics polling',async()=>{
 const f=fakeEnvironment();await wait();
 assert.equal(f.elements.some(el=>el.id==='pbLabDesktopState'),false);
 assert.equal(f.elements.filter(el=>el.tagName==='button'&&!el.hidden).length,0);
 assert.equal(f.pollMs,0);
 assert.equal(f.requests.length,0);
 assert(f.requests.every(r=>r.url==='/desktop/status'));
});
test('Ctrl+Shift+S opens status without posting, replaying or discarding any operation',async()=>{
 const f=fakeEnvironment();await wait();
 f.listeners.keydown({ctrlKey:true,shiftKey:true,altKey:false,metaKey:false,key:'s',preventDefault(){}});await wait();
 assert(f.elements.some(el=>el.attributes.role==='dialog'&&el.attributes['aria-label']==='وضعیت همگام‌سازی لابراتوار'));
 assert(f.requests.every(r=>r.url==='/desktop/status'));
});
test('real conflicts stay available in on-demand diagnostics, without a permanent corner badge',async()=>{
 const f=fakeEnvironment([{id:'x',method:'PUT',url:'/api/lab/orders/example',error:{error:'invoice_pricing_required'}}]);await wait();
 // R1357 deliberately removed the always-visible conflict flag, even for real
 // conflicts. Keep the safety signal in the user-opened status dialog instead.
 assert(!f.elements.some(el=>el.id==='pbLabDesktopConflictFlag'));
 assert(!f.elements.some(el=>el.id==='pbLabDesktopState'));
 assert(f.requests.every(r=>r.url==='/desktop/status'),'polling must stay read-only');
 f.listeners.keydown({ctrlKey:true,shiftKey:true,altKey:false,metaKey:false,key:'s',preventDefault(){}});await wait();
 const panel=f.elements.find(el=>el.isConnected&&el.attributes.role==='dialog'&&el.attributes['aria-label']==='وضعیت همگام‌سازی لابراتوار');
 assert(panel,'Ctrl+Shift+S must still reveal real conflicts on demand');
 assert(f.elements.some(el=>el.textContent==='موارد نیازمند بررسی: ۱'),'real conflict count must remain accessible');
 assert(f.elements.some(el=>el.textContent.includes('PUT /api/lab/orders/example')&&el.textContent.includes('invoice_pricing_required')),'conflict details must remain accessible');
 const retry=f.elements.find(el=>el.tagName==='button'&&el.textContent==='ارسال مجدد با تأیید');
 const discard=f.elements.find(el=>el.tagName==='button'&&el.textContent==='کنار گذاشتن عملیات محلی');
 assert(retry&&discard,'explicit recovery options must be available for actual conflicts');
 // The test environment declines both confirmation prompts. Neither action is
 // allowed to mutate, resend, or discard a queued order without consent.
 await retry.onclick();
 await discard.onclick();
 assert(f.requests.every(r=>r.url==='/desktop/status'),'diagnostics may not replay or discard operations without explicit confirmation');
});

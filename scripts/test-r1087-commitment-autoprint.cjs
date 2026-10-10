const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-r1087-commitment-autoprint.js','utf8');
const html=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');

test('R1087 ships exactly one receiver after production build',()=>{
 const tag='<script defer src="/photobridge-r1087-commitment-autoprint.js?v=r1087"></script>';
 assert.equal(html.split(tag).length-1,1);
 assert(source.includes('/api/rental/overview'));
 assert(source.includes('/api/rental/bookings/'));
 assert(source.includes("handover_serials_recorded_at"));
});

async function simulate({mobile=false,native=true,nativePrinter=false,initialStatus='reserved',initialHandoverTime=null,syncFails=false}={}){
 const state={status:initialStatus,handoverTime:initialHandoverTime,printed:0,requests:[],frames:[],timer:[],nativeJobs:[],store:new Map()};
 const setTimeoutFake=(fn,ms)=>{if(ms<=2000)queueMicrotask(fn);return ms};
 const storage={getItem:k=>state.store.has(k)?state.store.get(k):null,setItem:(k,v)=>state.store.set(k,String(v))};
 const header={children:[],contains:el=>header.children.includes(el),appendChild:el=>{header.children.push(el);return el}};
 const settings={children:[],contains:el=>settings.children.includes(el),appendChild:el=>{settings.children.push(el);return el}};
 function elem(kind){
  const el={tagName:kind,style:{cssText:''},dataset:{},addEventListener(){},remove(){},setAttribute(){},hidden:false,children:[],textContent:'',append(...xs){this.children.push(...xs)}};
  if(kind==='iframe'){
   el.contentWindow={addEventListener(){},focus(){},print(){state.printed++}};
   state.frames.push(el);
  }
  return el;
 }
 const body={classList:{contains:()=>true},appendChild:el=>{
  queueMicrotask(()=>el.onload?.());return el;
 }};
 const document={readyState:'complete',body,createElement:elem,querySelector:()=>header,getElementById:id=>id==='settings'?settings:null};
 const fetch=async url=>{
  state.requests.push(String(url));
  if(String(url).endsWith('/desktop/sync'))return syncFails?{ok:false,status:503,json:async()=>({error:'offline'})}:{ok:true,json:async()=>({ok:true,pulled:true})};
  if(String(url).endsWith('/print-handovers'))return{ok:true,json:async()=>({shopId:'shop-1',bookings:state.status==='picked_up'?[{id:'booking-1',status:state.status,handover_serials_recorded_at:state.handoverTime||'2026-10-10T20:00:00Z',customer_name:'Customer'}]:[]})};
  if(String(url).endsWith('/overview'))return{ok:true,json:async()=>({
   shop:{id:'shop-1'},bookings:[{id:'booking-1',status:state.status,handover_serials_recorded_at:state.status==='picked_up'?'2026-10-10T20:00:00Z':null,photographer_name:'Customer'}]
  })};
  if(String(url).endsWith('/commitment'))return{ok:true,text:async()=>'<html><body><p>Customer</p><p>Serial: SER123</p></body></html>'};
  return{ok:false,status:404};
 };
 const ctx=vm.createContext({
  window:{console,__PB_DESKTOP_FETCH__:native?()=>{}:undefined,__PB_DESKTOP_PRINT__:nativePrinter?async job=>{state.nativeJobs.push(job);return {ok:true}}:undefined,addEventListener(){}},
  matchMedia:()=>({matches:mobile}),navigator:{userAgent:mobile?'Android':'Desktop'},
  localStorage:storage,document,fetch,Date,JSON,Math,Promise,
  setInterval:fn=>state.timer.push(fn),setTimeout:setTimeoutFake,clearTimeout(){},
  queueMicrotask,console
 });
 vm.runInContext(source,ctx);
 async function check(){await ctx.window.pbR1087AutoPrint?.checkNow();await new Promise(r=>setImmediate(r))}
 return{state,ctx,check,settings};
}
test('phone is never a printer and never polls',async()=>{
 const s=await simulate({mobile:true});
 assert.equal(s.ctx.window.pbR1087AutoPrint,undefined);
 assert.equal(s.state.requests.length,0);
});
test('desktop prints only a new confirmed handover, once, with the real serial document',async()=>{
 const s=await simulate();
 await s.check();
 assert.equal(s.state.printed,0);
 s.state.status='picked_up';
 await s.check();
 assert.equal(s.state.printed,1);
 assert.match(s.state.frames[0].srcdoc,/SER123/);
 await s.check();
 assert.equal(s.state.printed,1);
 assert.equal(s.ctx.window.pbR1087AutoPrint.enabled(),true);
});
test('plain website does not silently opt into printing',async()=>{
 const s=await simulate({native:false});
 await s.check();
 assert.equal(s.state.requests.length,0);
 assert.equal(s.ctx.window.pbR1087AutoPrint.enabled(),false);
});

test('print setting appears inside store settings rather than the global header',async()=>{
 const s=await simulate();
 assert.equal(s.settings.children.length,1);
 assert.equal(s.settings.children[0].id,'pbR1088AutoPrintSettings');
 assert.equal(s.settings.children[0].children.find(x=>x.id==='pbR1087AutoPrint')?.tagName,'button');
});
test('native desktop print bridge receives rendered commitment HTML and avoids browser preview',async()=>{
 const s=await simulate({nativePrinter:true});
 await s.check();
 s.state.status='picked_up';
 await s.check();
 assert.equal(s.state.nativeJobs.length,1);
 assert.equal(s.state.nativeJobs[0].kind,'rental-commitment');
 assert.equal(s.state.nativeJobs[0].bookingId,'booking-1');
 assert(!s.state.requests.some(url=>url.endsWith('/commitment')),'native bridge must never fetch printable HTML through localhost JSON proxy');
 assert(s.state.requests.some(url=>url.endsWith('/desktop/sync')),'mobile handover must first reach Windows SQLite');
 assert(s.state.requests.some(url=>url.endsWith('/print-handovers')),'native app must use fresh server print feed');
 assert.equal(s.state.frames.length,0);
 await s.check();assert.equal(s.state.nativeJobs.length,1);
});

test('a handover confirmed just before desktop startup is not swallowed by initial baseline',async()=>{
 const s=await simulate({nativePrinter:true,initialStatus:'picked_up',initialHandoverTime:new Date().toISOString()});
 await s.check();
 assert.equal(s.state.nativeJobs.length,1);
 await s.check();assert.equal(s.state.nativeJobs.length,1,'never duplicate a printed handover');
});

test('native errors do not acknowledge print jobs, so a later retry can print them',async()=>{
 const s=await simulate({nativePrinter:true,syncFails:true});
 await s.check();s.state.status='picked_up';await s.check();
 assert.equal(s.state.nativeJobs.length,0);
 assert.equal(s.ctx.window.pbR1087AutoPrint.pending(),0);
 // Local ledger must not acknowledge a job that was never sent to native.
 const ledger=[...s.state.store.entries()].find(([key])=>key.includes('printed:'))?.[1]||'{}';
 assert(!Object.keys(JSON.parse(ledger)).some(k=>k.startsWith('booking-1|')));
});

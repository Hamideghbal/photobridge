'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const login=fs.readFileSync('scripts/r1493-mobile-session-resume.js','utf8');
const dock=fs.readFileSync('scripts/r1598-photographer-mobile-invoice-dock.js','utf8');
const css=fs.readFileSync('scripts/r1598-photographer-mobile-invoice-dock.css','utf8');
function landing(path, authenticated, storedRole=''){
 const events=[],storage=new Map(storedRole?[['photobridge:pwa:last-portal',storedRole]]:[]);
 const classes=new Set();
 const doc={documentElement:{classList:{
  add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)
 }}};
 const location={pathname:path,search:'',href:'https://photobridge.ir'+path,origin:'https://photobridge.ir',replace:p=>events.push(p)};
 const roles={lab:{user:{labRole:'lab_admin'},lab:{id:'l'}},
   rental:{user:{rentalRole:'shop_admin'},rentalShop:{id:'s'}},
   photographer:{user:{labRole:'customer'}}};
 const window={fetch:async(url,init)=>{const portal=init?.headers?.['x-photobridge-portal'];events.push('check:'+portal);const found=authenticated.includes(portal);return{ok:found,json:async()=>found?roles[portal]:{}}},top:null};
 window.top=window;
 const locals={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const context={
  window,navigator:{standalone:true},document,location,localStorage:locals,
  matchMedia:()=>({matches:true}),URL,URLSearchParams,Headers,Request,AbortController,
  setTimeout,clearTimeout,console
 };
 vm.runInNewContext(login,context,{timeout:1000});
 return {events,storage,classes};
}
async function settle(){for(let i=0;i<16;i++)await Promise.resolve();}
test('R1598: only Lab authenticated, opening old photographer login goes straight to Lab',async()=>{
 const result=landing('/photographer/login',['lab']);await settle();
 assert.ok(result.events.includes('/lab'));
 assert.ok(!result.events.includes('/photographer'));
 assert.equal(result.storage.get('photobridge:pwa:last-portal'),'lab');
 assert.ok(!result.classes.has('pb1493SessionResumePending'));
});
test('R1598: only Store authenticated, installed photographer start goes to Store',async()=>{
 const result=landing('/photographer',['rental']);await settle();
 assert.ok(result.events.includes('/rental'));
 assert.equal(result.storage.get('photobridge:pwa:last-portal'),'rental');
});
test('R1598: only Photographer authenticated, app enters Photographer',async()=>{
 const result=landing('/', ['photographer']);await settle();
 assert.ok(result.events.includes('/photographer'));
});
test('R1598: with multiple active roles, remember last selected Lab rather than forcing Photographer',async()=>{
 const result=landing('/photographer',['lab','photographer'],'lab');await settle();
 assert.ok(result.events.includes('/lab'));
 assert.ok(!result.events.includes('/photographer'));
});
test('R1598: with no active roles, never redirect and clear expired role',async()=>{
 const result=landing('/photographer/login',[],'lab');await settle();
 assert.ok(!result.events.includes('/lab')&&!result.events.includes('/rental'));
 assert.equal(result.storage.get('photobridge:pwa:last-portal'),undefined);
 assert.ok(!result.classes.has('pb1493SessionResumePending'));
});
test('R1598: invoice preview hides underlying photographer mobile dock and deduplicates extra dock',()=>{
 const flags=new Set(),attrs1=new Map(),attrs2=new Map(),scheduled=[];
 let modal=true;
 const mk=attrs=>({closest:()=>null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)});
 const nav1=mk(attrs1),nav2=mk(attrs2);
 const main={querySelector:()=>{}};
 nav1.closest=selector=>selector==='.photographerMain'?main:null;
 const doc={readyState:'complete',body:{},
  documentElement:{classList:{add:k=>flags.add(k),remove:k=>flags.delete(k),toggle:(k,v)=>v?flags.add(k):flags.delete(k)}},
  querySelector:selector=>selector.includes('globalInvoicePreviewLayer')?(modal?{}:null):null,
  querySelectorAll:()=>[nav1,nav2]
 };
 const win={pbNativeStorage:false,PB1598PhotographerDock:false,addEventListener:()=>{},top:null};
 const context={window:win,document:doc,location:{pathname:'/photographer/orders/ready'},
   matchMedia:()=>({matches:true,addEventListener:()=>{}}),
   MutationObserver:class{observe(){}},requestAnimationFrame:fn=>{scheduled.push(fn);return scheduled.length},
   console};
 vm.runInNewContext(dock,context,{timeout:1000});
 scheduled.shift()();
 assert.ok(flags.has('pb1598CustomerInvoiceOpen'));
 assert.equal(attrs1.get('data-pb1598-duplicate'),undefined);
 assert.equal(attrs2.get('data-pb1598-duplicate'),'1');
 assert.match(css,/repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(css,/\.pb1598CustomerInvoiceOpen/);
});
test('R1598: safe patch is website-only and does not restore Lab flight',()=>{
 const installer=fs.readFileSync('scripts/enable-r1598-mobile-role-invoice-nav.mjs','utf8');
 const pipeline=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert.match(installer,/m\.start_url='\/'/);
 assert.match(installer,/photobridge-r1598-photographer-mobile-invoice-dock/);
 assert.doesNotMatch(installer,/lab-desktop-ui/);
 assert.doesNotMatch(pipeline,/await deployStep\('\.\/enable-r1593-lab-card-flight\.mjs'\)/);
});

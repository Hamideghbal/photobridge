const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const overlay=fs.readFileSync('apps/store-desktop/desktop-overlay.js','utf8');
test('Windows desktop account A never renders in signed-in account B, and offline queue is left untouched',async()=>{
 const classes=new Set(['rentalAppReady']),timers=[],requests=[],rendered=[],status={signedIn:true,shopId:'A',userId:'userA',revision:1,online:true},auth={rentalShop:{id:'A'}},overview={shop:{id:'A'},items:[{id:'A-equipment'}]};
 const elt=(tag)=>({tagName:tag,hidden:false,dataset:{},style:{},children:[],setAttribute(){},append(child){this.children.push(child)},replaceChildren(){},addEventListener(){},getClientRects(){return []}});
 const header=elt('HEADER'),bar=elt('DIV'),panel=elt('SECTION');
 Object.defineProperty(bar,'innerHTML',{set(){bar.children=Array.from({length:5},()=>elt('SPAN'))}});
 let count=0;
 const document={
  head:{append(){}},body:{classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},append(){}},
  createElement:tag=>{count++;return count===2?bar:count===3?panel:elt(tag)},
  querySelector:s=>s==='header.top'?header:null,querySelectorAll:()=>[],
  addEventListener(){},activeElement:null
 };
 let data=null;
 const ctx=vm.createContext({
  window:{__PB_DESKTOP_FETCH__:undefined,fetch:async path=>{
   requests.push(String(path));
   if(path==='/desktop/status')return {ok:true,json:async()=>({...status})};
   if(path==='/api/auth/me')return {ok:true,json:async()=>({...auth})};
   if(path==='/api/rental/overview')return {ok:true,json:async()=>({...overview,items:overview.items.map(x=>({...x}))})};
   throw Error('Unexpected request '+path);
  },addEventListener(){},console},
  document,navigator:{onLine:true},localStorage:{getItem(){return null},setItem(){}},
  data,accountingData:null,smsData:null,
  render(){rendered.push({shop:ctx.data?.shop?.id,items:ctx.data?.items?.map(x=>x.id)})},
  rentalTabFromPath:()=>'',location:{replace(){}},
  setInterval:fn=>timers.push(fn),setTimeout(){},getComputedStyle:()=>({visibility:'hidden'}),history:{replaceState(){}},
  Intl,Date,Number,String,JSON,Promise,Array,Map,Set,console
 });
 vm.runInContext(overlay,ctx);
 const drain=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve))};
 await drain();
 assert.equal(rendered.at(-1)?.shop,'A');
 status.signedIn=false;
 await timers[0]();await drain();
 assert.equal(ctx.data,null,'old equipment must be erased on sign-out');
 assert(classes.has('pbDesktopAccountUnverified'));
 status.signedIn=true;status.shopId='B';status.userId='userB';status.revision=2;
 auth.rentalShop.id='B';
 // The local offline cache still incorrectly points at store A.
 await timers[0]();await drain();
 assert.equal(ctx.data,null,'wrong-store records must never appear');
 assert.deepEqual(rendered.map(x=>x.shop),['A']);
 assert(classes.has('pbDesktopAccountUnverified'));
 // When the runtime has rebuilt its account-scoped local snapshot, rendering can resume.
 overview.shop.id='B';overview.items=[{id:'B-equipment'}];
 await timers[0]();await drain();
 assert.equal(ctx.data.shop.id,'B');
 assert.deepEqual(rendered.map(x=>x.shop),['A','B']);
 assert(!classes.has('pbDesktopAccountUnverified'));
 assert(!requests.some(x=>/discard|delete|reset/i.test(x)),'never delete old offline queue while switching account');
});

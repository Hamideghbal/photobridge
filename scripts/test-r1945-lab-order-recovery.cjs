'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {listLabOrdersPage}=require('../dist/api/lab-order-pages-r1944.cjs');

test('R1945: real deployed SQL does not reference nonexistent orders.folder_latin_name',async()=>{
 const source=fs.readFileSync('dist/api/lab-order-pages-r1944.cjs','utf8');
 assert.doesNotMatch(source,/o\.folder_latin_name/);
 assert.match(source,/ff\.original_name/);
 const executed=[];
 const pool={query:async(sql,params)=>{
  executed.push({sql,params});
  if(/o\.folder_latin_name/.test(sql)){
   const err=Error('column o.folder_latin_name does not exist');err.code='42703';throw err;
  }
  if(sql.includes('count(*) FILTER'))return{rows:[{flow:32,ready:12,completed:97}]};
  return{rows:Array.from({length:10},(_,i)=>({id:'ord-'+i,number:955-i}))};
 }};
 const result=await listLabOrdersPage(pool,'lab-1',new URL('https://local/api/lab/orders?paged=1&mode=print&stage=flow&page=1&q='));
 assert.equal(result.orders.length,10);
 assert.equal(result.total,32);
 assert.deepEqual(executed[1].params.slice(-2),[10,0]);
 assert(executed.every(({sql})=>sql.includes('o.lab_id=$1')));
});

function compiledQueue(){
 const patch=fs.readFileSync('scripts/enable-r1944-lab-order-pages.mjs','utf8');
 const match=patch.match(/const newYe=("(?:\\.|[^"\\])*");\n/);
 assert(match,'generated Lab queue source missing');
 return JSON.parse(match[1]);
}
function harness({status=500,page=1}={}){
 const requested=[],events={rows:[],errors:[],counts:[],pageTotal:0,pages:1};
 const cachedOrders=Array.from({length:12},(_,i)=>({
  id:'order-'+i,number:955-i,mode:'print',
  status:'downloaded',created_at:new Date(Date.UTC(2026,10,21,0,i)).toISOString(),
  customer_name:'studio '+i
 }));
 const ctx={
  x:{useRef:initial=>({current:initial})},
  window:{pbNativeStorage:false},
  navigator:{onLine:true},
  Date,Promise,Math,Number,String,encodeURIComponent,
  r1944Request:{current:0},r1944DebouncedQuery:'',
  r1944Page:page,r1944SetPage:fn=>{events.pageChange=fn(page)},
  T:'flow',o:'print',
  r1944SetPending:()=>{},
  r1944SetError:msg=>events.errors.push(msg),
  r1944SetCounts:value=>events.counts.push(value),
  r1944SetPages:value=>events.pages=value,
  r1944SetTotal:value=>events.pageTotal=value,
  pb1753VisibleLabOrders:rows=>rows,
  f:callback=>events.rows=callback([]),
  Me:async uri=>{
   requested.push(uri);
   if(uri.includes('paged=1')){
    const err=Error(status===401?'Unauthorized':'new paged API failed');
    err.status=status;throw err;
   }
   return {orders:cachedOrders};
  }
 };
 vm.createContext(ctx);
 vm.runInContext(compiledQueue()+'\nthis.runPage=ye;',ctx);
 return{ctx,events,requested};
}

test('R1945: broken paged GET falls back to readable legacy list with ten cards',async()=>{
 const {ctx,events,requested}=harness();
 await ctx.runPage();
 assert.equal(requested.length,2);
 assert.match(requested[0],/paged=1&mode=/);
 assert.equal(requested[1],'/api/lab/orders');
 assert.equal(events.rows.length,10);
 assert.equal(events.pageTotal,12);
 assert.equal(events.pages,2);
 assert.match(events.errors.at(-1),/پشتیبان/);
});
test('R1945: fallback page two displays only last two cached records',async()=>{
 const {ctx,events}=harness({page:2});
 await ctx.runPage();
 assert.equal(events.rows.length,2);
 assert.equal(events.pageTotal,12);
 assert.equal(events.pages,2);
});
test('R1945: authentication errors do not masquerade as a healthy fallback',async()=>{
 const {ctx,requested,events}=harness({status:401});
 await assert.rejects(ctx.runPage(),/Unauthorized/);
 assert.equal(requested.length,1);
 assert.equal(events.rows.length,0);
});

test('R1945: production delivery preserves old Lab API and R1943 folder-recovery code',()=>{
 const patch=fs.readFileSync('scripts/enable-r1944-lab-order-pages.mjs','utf8');
 assert.match(patch,/__pb1945Legacy/);
 const source=fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8');
 assert.match(source,/PB1943 legacy-folder retry/);
 const api=fs.readFileSync('dist/api/server.js','utf8');
 assert.match(api,/\/api\/lab\/orders/);
});

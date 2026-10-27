const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const root='dist/web/',ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8'),css=fs.readFileSync(root+'photobridge-r1488-phone-finance.css','utf8');
function setup({phone=true,fail=false}={}){
 let resolve,reject;const pending=new Promise((a,b)=>{resolve=a;reject=b}),calls={fetch:0,loading:[],busy:[],summary:[],customers:[],version:0,notices:[]};const node={isConnected:true,scrollTop:175};
 const ctx={t:'lab',pb1487PhonePicker:()=>phone,pb1488InFlight:{current:false},pb1488Alive:{current:true},pb1488Scroll:{current:null},pb1488SetBusy:v=>calls.busy.push(v),pb1488SetVersion:fn=>calls.version=fn(calls.version),g:v=>calls.loading.push(v),Le:'2026-01-01',Ke:'2026-01-31',$s:v=>v,URLSearchParams,document:{querySelector:()=>node},Me:url=>{calls.fetch++;assert(url.includes('from=2026-01-01'));assert(url.includes('to=2026-01-31'));return pending},f:v=>calls.summary.push(v),C:v=>calls.customers.push(v),pb1452ArchiveNotice:async(m,o)=>calls.notices.push([m,o])};
 const start=ui.indexOf('bt=async()=>{if(t==="lab"&&pb1487PhonePicker())'),end=ui.indexOf(',Nt=Je=>',start);assert(start>0&&end>start);vm.createContext(ctx);vm.runInContext('var '+ui.slice(start,end),ctx);
 return {ctx,calls,node,resolve,reject,run:()=>ctx.bt()};
}
test('phone keeps prior content mounted, blocks duplicate clicks, and preserves the current scroll on refresh',async()=>{
 const a=setup(),first=a.run(),second=a.run();assert.equal(a.calls.fetch,1);assert.deepEqual(a.calls.loading,[]);assert.deepEqual(a.calls.busy,[true]);assert.deepEqual(a.calls.summary,[]);
 a.node.scrollTop=231;a.resolve({summary:{total:42},customers:[{id:1}]});await Promise.all([first,second]);assert.equal(a.calls.summary[0].total,42);assert.equal(a.calls.customers[0][0].id,1);assert.equal(a.ctx.pb1488Scroll.current.top,231);assert.equal(a.calls.version,1);assert.deepEqual(a.calls.busy,[true,false]);
});
test('phone request failure retains previous data and reports a styled notice; unmount never applies a late response',async()=>{
 const a=setup(),first=a.run();a.reject(Error('offline'));await first;assert.deepEqual(a.calls.summary,[]);assert.equal(a.calls.notices.length,1);assert.equal(a.calls.notices[0][1].title,'دریافت اطلاعات مالی');assert.deepEqual(a.calls.busy,[true,false]);
 const b=setup(),pending=b.run();b.ctx.pb1488Alive.current=false;b.resolve({summary:{total:10},customers:[]});await pending;assert.deepEqual(b.calls.summary,[]);assert.equal(b.ctx.pb1488Scroll.current,null);
});
test('desktop retains its existing loading behavior and does not use the mobile scroll restoration',async()=>{
 const a=setup({phone:false}),pending=a.run();assert.deepEqual(a.calls.loading,[true]);a.resolve({summary:{total:4},customers:[]});await pending;assert.deepEqual(a.calls.loading,[true,false]);assert.equal(a.ctx.pb1488Scroll.current,null);assert.deepEqual(a.calls.busy,[]);
});
test('layout-effect restores the captured scroll only on the current mounted container',()=>{
 const from=ui.indexOf('x.useLayoutEffect(()=>{const saved=pb1488Scroll.current;'),to=ui.indexOf(';const[_pb1437PickAction',from);assert(from>0&&to>from);const saved={node:{isConnected:true,scrollTop:2},top:241};const ctx={x:{useLayoutEffect:fn=>fn()},pb1488Scroll:{current:saved},pb1488Version:1};vm.runInNewContext(ui.slice(from,to),ctx);assert.equal(saved.node.scrollTop,241);assert.equal(ctx.pb1488Scroll.current,null);
});
test('all three phone picker rows use the same right-aligned width and the apply button is shorter and wider',()=>{
 assert.equal((css.match(/grid-template-columns:var\(--pb1488-picker-width\)/g)||[]).length,3);assert(css.includes('--pb1488-picker-width:min(42vw,150px)'));assert(css.includes('direction:rtl!important'));assert(css.includes('min-width:68px!important'));assert(css.includes('min-height:36px!important;height:36px'));
 assert(ui.includes('disabled:pb1487PhonePicker()&&pb1488Busy'));new vm.Script(ui);
});
test('the frozen Windows package stays byte-for-byte verified',()=>{
 const dir=root+'lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));for(const file of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir+file.name)).digest('hex'),file.sha256,file.name);
 assert(fs.readFileSync(dir+'assets/index-UIRefine-v655-r84.js','utf8').length>0);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1488-phone-finance.mjs')>build.indexOf('enable-r1487-mobile-pickers.mjs'));
});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
async function enter({mobile=true,active='lab-1',selected='lab-1',mounted=true,confirmed=true,path='/photographer/upload',fail=false}={}){
 const events=[],store=new Map(),sel={dataset:{select:selected},disabled:false};
 const window={matchMedia:()=>({matches:mobile})};window.top=window;
 const context={window,pb1776ConfirmedActiveLab:confirmed?active:'',currentData:{activeLabId:active},ROOT_ID:'chooser',SESSION_KEY:'selected',
  document:{getElementById:()=>({}),querySelector:()=>mounted?{}:null,documentElement:{classList:{add:x=>events.push(['cover',x]),remove:()=>{}}}},
  sessionStorage:{setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  history:{state:{route:1},replaceState:(state,unused,url)=>events.push(['spa',url])},
  location:{href:'https://example.test'+path+'?workspace=print&pbLabChooser=1',origin:'https://example.test',replace:url=>events.push(['reload',url])},
  api:async url=>{events.push(['api',url]);if(fail)throw {status:403}},cleanup:()=>events.push(['cleanup']),toast:x=>events.push(['toast',x]),
  dispatchEvent:event=>events.push(['event',event.type]),PopStateEvent:class{constructor(type){this.type=type}},URL,Date};
 vm.createContext(context);const begin=source.indexOf('async function handleClick('),end=source.indexOf('  async function run(',begin);assert(begin>0&&end>begin);
 vm.runInContext(source.slice(begin,end),context);
 await context.handleClick({target:{closest:selector=>selector==='[data-select]'?sel:null}});
 return {events,store,sel};
}
test('active mobile Lab opens orders in the mounted document without a redundant POST or reload',async()=>{
 const r=await enter();assert.deepEqual(r.events,[['cleanup'],['spa','/photographer/orders/flow?workspace=print'],['event','popstate']]);assert.equal(r.store.get('selected'),'lab-1');
});
test('switching Lab awaits server selection and opens the overview, never the stale upload page',async()=>{
 const r=await enter({selected:'lab-2'});assert(r.events.some(e=>e[0]==='api'&&e[1].endsWith('/lab-2/select')));assert.deepEqual(r.events.at(-1),['reload','/photographer/orders/flow?workspace=print&pbEntryDone=lab']);
});
test('cached directory data cannot skip authoritative server selection',async()=>{const r=await enter({confirmed:false});assert(r.events.some(e=>e[0]==='api'));assert.equal(r.events.at(-1)[0],'reload');});
test('selection failures retain the chooser and allow retry',async()=>{
 const r=await enter({selected:'lab-2',fail:true});assert.equal(r.sel.disabled,false);assert(!r.events.some(e=>['reload','spa','cleanup'].includes(e[0])));assert(r.events.some(e=>e[0]==='toast'));
});
test('desktop selection and absent-workspace mobile entry retain the full reload',async()=>{
 const desktop=await enter({mobile:false});assert.deepEqual(desktop.events.at(-1),['reload','/photographer/upload?workspace=print&pbEntryDone=lab']);
 const mobile=await enter({mounted:false});assert.equal(mobile.events.at(-1)[0],'reload');
});
test('disabled Lab-only observer stays idle on an iPhone photographer page',()=>{
 const src=fs.readFileSync('dist/web/photobridge-r1483-lab-mobile.js','utf8');
 const context={navigator:{userAgent:'iPhone'},window:{},document:{readyState:'loading',addEventListener:()=>{},documentElement:{classList:{contains:()=>false}},querySelector:selector=>{assert.equal(selector,'body>.pb1482LabPhoneDock');return null}}};
 vm.createContext(context);const begin=src.indexOf(' function sync(){'),end=src.indexOf(' function schedule()',begin);vm.runInContext(src.slice(begin,end)+';sync();',context);
});
test('web-only layout is linked after the old forced action row, with fresh script URLs',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');assert(html.indexOf('photobridge-r1776-mobile-print-flow.css')>html.indexOf('photobridge-r1763-mobile-print-rows.css'));
 assert.equal(html.split('mobileFlow=r1776').length-1,2);
});
test('final installer is idempotent and preserves installed Windows snapshots',()=>{
 const {execFileSync}=require('node:child_process');
 const files=['dist/web/index.html','dist/web/photobridge-v904r99-lab-chooser.js','dist/web/photobridge-r1483-lab-mobile.js','dist/web/photobridge-r1776-mobile-print-flow.css','dist/web/lab-desktop-ui/manifest.json','dist/web/desktop-ui/manifest.json'];
 const before=files.map(f=>fs.readFileSync(f));execFileSync(process.execPath,['scripts/enable-r1776-mobile-print-flow.mjs']);
 files.forEach((f,i)=>assert.deepEqual(fs.readFileSync(f),before[i],f));
});

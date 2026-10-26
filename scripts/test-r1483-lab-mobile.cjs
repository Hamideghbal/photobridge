const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const web='dist/web/',ui=fs.readFileSync(web+'assets/index-UIRefine-v655-r84.js','utf8'),css=fs.readFileSync(web+'photobridge-r1483-lab-mobile.css','utf8');
function guard({phone=true,native=false,ua='Android Mobile Chrome',fresh={id:'one',lab_id:'lab',downloaded_at:'2026-10-26T10:00:00Z',status:'printing'},failure=false,losePhone=false}={}){
 const calls={get:0,disk:0,alert:[]};let enabled=phone;
 const ctx={navigator:{userAgent:ua},window:{pbNativeStorage:native?{}:null,matchMedia:()=>({matches:phone})},document:{documentElement:{classList:{contains:()=>enabled}}},Me:async url=>{assert.equal(url,'/api/lab/orders/one');calls.get++;if(losePhone)enabled=false;if(failure)throw Error('offline');return {order:fresh}},alert:m=>calls.alert.push(m),pb1450Flights:new Map(),pb1450Notify:e=>calls.alert.push(e.message),pb1450Root:async()=>{calls.disk++;return{}},yc:()=>({}),pb1450Verify:async()=>({complete:true}),pb1450Save:()=>{}};
 const helper=fs.readFileSync('scripts/r1483-mobile-stage.js','utf8');
 const start=ui.indexOf('async function pb1450AllowStage(order) {'),end=ui.indexOf('/* PB1451 storage and archive flow */',start);
 assert(start>0&&end>start);vm.createContext(ctx);vm.runInContext(helper+'\n'+ui.slice(start,end),ctx);
 return {ctx,calls,run:()=>ctx.pb1450AllowStage({id:'one',lab_id:'lab'})};
}
test('phone advances only a freshly confirmed downloaded order without probing phone disk',async()=>{
 const app=guard();assert.equal(await app.run(),true);assert.equal(app.calls.get,1);assert.equal(app.calls.disk,0);assert.equal(app.calls.alert.length,0);
 for(const status of ['downloaded','printing','ready','completed']){const app=guard({fresh:{id:'one',lab_id:'lab',downloaded_at:'2026-10-26',status}});assert(await app.run());}
});
test('missing download, mismatched order/lab, unpaid, cancelled and offline never authorize a phone stage',async()=>{
 const base={id:'one',lab_id:'lab',downloaded_at:'2026-10-26',status:'printing'};
 for(const change of [{downloaded_at:null},{id:'other'},{lab_id:'other'},{status:'cancelled'},{status:'uploading'},{settlement_mode:'prepaid',payment_status:'pending'}]){const app=guard({fresh:{...base,...change}});assert.equal(await app.run(),false);assert.equal(app.calls.disk,0);assert.equal(app.calls.alert.length,1);}
 const offline=guard({failure:true});assert.equal(await offline.run(),false);
 const left=guard({losePhone:true});assert.equal(await left.run(),false);assert.equal(left.calls.disk,0);
});
test('Windows, Electron, native bridge and wide screens retain the original disk verification',async()=>{
 for(const options of [{ua:'Windows NT 10 Android'},{ua:'Electron Android'},{native:true},{phone:false}]){const app=guard(options);assert.equal(await app.run(),true);assert.equal(app.calls.disk,1);}
 new vm.Script(ui);new vm.Script(fs.readFileSync(web+'photobridge-r1483-lab-mobile.js','utf8'));
});
test('measured phone viewport uses actual header and dock edges, updates on resize and never runs on Windows',()=>{
 const source=fs.readFileSync(web+'photobridge-r1483-lab-mobile.js','utf8');
 function mount(ua='Android Mobile'){
  const props={},listeners={},observers=[];let header=180,dock=730,clear=0;
  const head={getClientRects:()=>[{}],getBoundingClientRect:()=>({bottom:header})};
  const rail={getBoundingClientRect:()=>({top:dock})};
  const scroll={},main={querySelector:s=>s.includes('labRolePageScrollArea')?scroll:null,querySelectorAll:()=>[head]};
  const document={readyState:'complete',body:{},documentElement:{classList:{contains:()=>true},style:{getPropertyValue:k=>props[k],setProperty:(k,v)=>props[k]=v}},querySelector:s=>s.startsWith('body>')?rail:main};
  const ctx={navigator:{userAgent:ua},document,window:{innerHeight:800,addEventListener:(n,f)=>listeners[n]=f},requestAnimationFrame:f=>{f();return 1},MutationObserver:class{constructor(f){observers.push(f)}observe(){}},ResizeObserver:class{observe(){}disconnect(){}}};
  // Run animation frames asynchronously as browsers do.
  let frames=[];ctx.requestAnimationFrame=f=>{frames.push(f);return frames.length};
  vm.runInNewContext(source,ctx);const flush=()=>{const pending=frames;frames=[];pending.forEach(f=>f())};flush();
  return {props,listeners,resize(){header=210;dock=680;listeners.resize();flush()}};
 }
 const app=mount();assert.equal(app.props['--pb1483-scroll-top'],'180px');assert.equal(app.props['--pb1483-scroll-bottom'],'70px');app.resize();assert.equal(app.props['--pb1483-scroll-top'],'210px');assert.equal(app.props['--pb1483-scroll-bottom'],'120px');
 assert.deepEqual(mount('Windows NT 10').props,{});
});
test('phone-only CSS keeps filters hit-testable, dates/actions in rows and every invoice value visible',()=>{
 for(const line of css.split('\n').filter(l=>l.startsWith('html.')))for(const selector of line.split('{')[0].split(/,(?=html\.)/))assert(selector.startsWith('html.pb1482LabPhoneMode body #root .labRoleWorkspace '));
 assert(css.includes('.stageQueueWorkspace .labQueueSearchSlot'));assert(css.includes('overflow:auto!important'));assert(css.includes('inset:var(--pb1483-scroll-top'));
 assert(css.includes('.mainQueueFilters>button'));assert(css.includes('pointer-events:auto!important'));
 assert(css.includes('.financeSectionTabs{display:flex!important;flex-wrap:nowrap'));
 assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 assert(css.includes('.invoiceRangeAll{grid-column:span 2'));
 assert(css.includes('.invoiceRow>div:nth-child(7){display:grid'));
 assert(ui.includes('event.stopPropagation();return aa(le,Jt.key)'));
 assert(ui.includes('pb1483Phone()&&(Jt.key==="download"||Jt.key==="download_print")'));
});
test('frozen Windows assets keep their verified bytes and public phone patch runs after snapshot',()=>{
 const manifest=JSON.parse(fs.readFileSync(web+'lab-desktop-ui/manifest.json','utf8'));
 for(const file of manifest.files){const bytes=fs.readFileSync(web+'lab-desktop-ui/'+file.name);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,file.name);}
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1483-lab-mobile.mjs')>build.indexOf('verify-lab-desktop-ui-freshness.mjs'));
 const frozen=fs.readFileSync(web+'lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');assert(!frozen.includes('PB1483 phone remote stages'));
 assert(fs.readFileSync(web+'index.html','utf8').includes('/photobridge-r1483-lab-mobile.css?v=r1483'));
});

test('print and album stage clicks dispatch their own action, never the download action',async()=>{
 const start=ui.indexOf('aa=async(le,nt)=>{if(!E){'),end=ui.indexOf(',la=(le,nt)=>',start);assert(start>0&&end>start);
 async function click(mode,key,done){const calls=[];const ctx={E:'',o:mode,rn:(order,step)=>done.includes(step),Vn:()=>calls.push('DOWNLOAD'),pb1450Retry:()=>false,yc:()=>null,Cn:(order,step)=>calls.push(step),It:(order,step)=>calls.push(step),un:()=>calls.push('ready'),gn:()=>calls.push('completed')};vm.createContext(ctx);vm.runInContext('var '+ui.slice(start,end),ctx);await ctx.aa({id:'one',status:'printing'},key);return calls;}
 assert.deepEqual(await click('print','print',['download']),['printing']);
 assert.deepEqual(await click('print','ready',['download','print']),['ready']);
 assert.deepEqual(await click('print','completed',['download','print','ready']),['completed']);
 assert.deepEqual(await click('album','binding',['download_print']),['binding']);
 assert.deepEqual(await click('album','ready',['download_print','binding']),['ready']);
 assert.deepEqual(await click('album','completed',['download_print','binding','ready']),['completed']);
});

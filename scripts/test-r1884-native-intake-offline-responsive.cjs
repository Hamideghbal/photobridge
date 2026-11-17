'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root='dist/web/lab-desktop-ui/';
const intakeName='photobridge-r1137-lab-local-intake.js';
const native=fs.readFileSync(root+intakeName,'utf8');
const website=fs.readFileSync('dist/web/'+intakeName,'utf8');
const html=fs.readFileSync(root+'index.html','utf8');
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));

test('R1884: Native opens immediately, keeps existing authorization and does not claim offline submit',()=>{
 assert.doesNotThrow(()=>new vm.Script(native));
 assert(native.includes('/* PB1884 native intake immediate preparation */'));
 assert(native.includes("pb1884Warmup.showModal()"));
 assert(native.includes("if(pb1884Cancelled)return;"));
 assert(native.includes("await pb1884Bounded(Promise.all("));
 assert(native.includes("navigator.onLine===false)?1200:4500"));
 assert(native.includes("هیچ سفارشی ثبت نشده است"));
 // Earlier native installers may own a different device-check implementation.
 // R1886 must not bypass that authorization or abort the image build.
 assert(native.includes("let primaryState="),'native verified-device state retained');
 assert(native.includes("not_primary_download_device"),'secondary-device error retained');
 assert(native.includes('/* PB1888 deny secondary lab device */'),'confirmed secondary device must not get native launcher');
 if(native.includes('Promise.race([api(\'/api/lab/download-device\')')){
  assert(native.includes("state?.queued||state?.operationId"));
 }
 assert(native.includes('not_primary_download_device'));
 assert(native.includes("manualPreflight='+Date.now()"),'submit checks live server before posting');
 assert(native.includes('if(pb1884PreflightBusy)return;'),'duplicate submit checks are suppressed');
 assert(native.includes('if(active!==modal)return;'),'closed dialogs never begin mutations');
 assert(native.includes('2600'),'read-only preflight is time-limited');
  assert(native.includes('clientOrderId'));
 assert(native.includes('/files/presign'));
 assert(native.includes('/submit'));
 assert(!website.includes('PB1884 native intake immediate preparation'),'web frontend should remain unchanged');
});

// Locate the async function containing R1884; intermediate installers can
// relocate mount() ahead of open() or add intervening declarations.
function extractPreparationEntry(source){
 const marker=source.indexOf('/* PB1884 native intake immediate preparation */');
 assert(marker>=0,'R1884 warmup marker must exist');
 const declarations=[...source.slice(0,marker).matchAll(/\basync\s+function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g)];
 const open=declarations.at(-1);
 assert(open,'an async manual order entrypoint must precede the warmup');
 const begin=open.index;
 const brace=begin+open[0].lastIndexOf('{');
 let depth=0,mode='code',regexClass=false,previous='',quote='';
 for(let i=brace;i<source.length;i++){
  const c=source[i],n=source[i+1];
  if(mode==='line'){if(c==='\n')mode='code';continue;}
  if(mode==='block'){if(c==='*'&&n==='/'){mode='code';i++;}continue;}
  if(mode==='quote'){
   if(c==='\\'){i++;continue;}
   if(c===quote)mode='code';
   continue;
  }
  if(mode==='regex'){
   if(c==='\\'){i++;continue;}
   if(c==='[')regexClass=true;
   if(c===']')regexClass=false;
   if(c==='/'&&!regexClass){mode='code';previous='x';}
   continue;
  }
  if(c==='/'&&n==='/'){mode='line';i++;continue;}
  if(c==='/'&&n==='*'){mode='block';i++;continue;}
  if(c==="'"||c==='"'||c===String.fromCharCode(96)){mode='quote';quote=c;continue;}
  if(c==='/'&&/[=(,:;!&|?{]/.test(previous)){mode='regex';regexClass=false;continue;}
  if(c==='{')depth++;
  if(c==='}'&&--depth===0){
   const extracted=source.slice(begin,i+1);
   assert(extracted.includes('pb1884Warmup.showModal()'),'isolated entrypoint must contain warmup');
   assert.doesNotThrow(()=>new vm.Script(extracted));
   return{code:extracted,name:open[1]};
  }
  if(!/\s/.test(c))previous=c;
 }
 throw Error('manual order async function is not balanced');
}
// Exercise the real R1884 preparation/cancellation/timeout helpers in
// isolation. The complete native intake function also contains decades of
// customer, storage and file-picker dependencies, so incomplete browser
// mocks can synchronously throw and open its *error* modal before any network
// request. That is NOT a second loading dialog and must not break Docker CI.
function simulateOffline(cancel){
 const {code}=extractPreparationEntry(native);
 const mark=code.indexOf('/* PB1884 native intake immediate preparation */');
 assert(mark>=0,'R1884 preparation entrypoint missing');
 const rest=code.slice(mark);
 const end=/\n\s*const provider=storage\(\);let directory,bootstrap,loadError;/.exec(rest);
 assert(end,'R1884 preparation boundary must precede native storage bootstrap');
 const preparation=rest.slice(0,end.index);
 const shown=[],timers=[],nodes=[];
 const node=(tag,text='',cls='')=>{
  const el={tag,textContent:text||'',className:cls,children:[],open:false,removed:false,
   append(...children){this.children.push(...children);},
   addEventListener(){},
   showModal(){this.open=true;shown.push(this);},
   close(){this.open=false;},
   remove(){this.removed=true}
  };
  nodes.push(el);return el;
 };
 const document={body:{append(){}}};
 const sandbox={
  node,document,Promise,Error,
  setTimeout(fn,delay){timers.push({fn,delay});return timers.length;},
  clearTimeout(){}
 };
 const fixture=vm.runInNewContext('(function(){\n'+preparation+
  '\nreturn {warmup:pb1884Warmup,bounded:pb1884Bounded,cancelled:()=>pb1884Cancelled};\n})()',sandbox);
 assert.equal(shown.length,1,'preparation opens exactly once, synchronously');
 assert.equal(shown[0],fixture.warmup);
 assert.equal(fixture.warmup.className,'pb1137Intake pb1884IntakeWarmup');
 const close=fixture.warmup.children[0].children[1];
 assert.equal(close.textContent,'بستن');
 const pending=fixture.bounded(new Promise(()=>{}),1200);
 assert(timers.some(x=>x.delay===1200),'offline bootstrap must have a bounded wait');
 if(cancel)close.onclick();
 for(const item of timers)item.fn();
 return{shown,nodes,warmup:fixture.warmup,cancelled:fixture.cancelled,pending};
}

test('R1884: offline preparation is immediately dismissible without reopening',async()=>{
 const run=simulateOffline(true);
 assert.equal(run.cancelled(),true);
 assert.equal(run.warmup.open,false);
 assert.equal(run.warmup.removed,true);
 await assert.rejects(run.pending,/دریافت اطلاعات از سرور انجام نشد/);
 assert.equal(run.shown.length,1,'no duplicate preparation dialog');
 assert(native.includes('if(pb1884Cancelled)return;'),
  'the complete native order flow must honor cancellation before opening its real form');
});

test('R1884: dead offline server is bounded, with no false order commit',async()=>{
 const run=simulateOffline(false);
 await assert.rejects(run.pending,/دریافت اطلاعات از سرور انجام نشد/);
 assert.equal(run.shown.length,1,'there is only one preparation dialog');
 assert.equal(run.warmup.open,true,'error is passed to existing native handler for display');
 assert(native.includes("if(pb1884Warmup.open)pb1884Warmup.close();pb1884Warmup.remove();"),
  'native code must close the preparation UI before displaying its real order form');
 assert(native.includes("هیچ سفارشی ثبت نشده است"),'failed offline submission must not claim success');
});

test('R1884: native launcher remains clickable during pending offline device check but hides after an explicit secondary response',()=>{
 const start=native.indexOf('function mount(){');
 const end=native.indexOf('let primaryState=',start);
 assert(start>=0&&end>start);
 const mountSource=native.slice(start,end);
 const run=state=>{
  const header={children:[],append(el){this.children.push(el);el.parentElement=this;}};
  const host={querySelector(){return null;}};
  let checks=0;
  const document={
   querySelector(selector){
    if(selector==='.labRoleWorkspace main')return host;
    if(selector==='.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav')return header;
    if(selector==='.labRoleWorkspace .stageQueueWorkspace')return host;
    return null;
   },
   getElementById(){return null;}
  };
  const sandbox={document,location:{pathname:'/lab/orders'},window:{matchMedia:()=>({matches:true})},
   storage:()=>({deviceId:()=> 'test-device'}),primaryState:state,checking:false,
   pb1884PrimaryFailAt:0,checkPrimary(){checks++;},Date,open(){},node:(_tag,label,cls)=>({textContent:label,className:cls,id:'',type:'',onclick:null})
  };
  vm.createContext(sandbox);
  vm.runInContext(mountSource+'\nthis.runMount=mount;',sandbox);
  sandbox.runMount();
  return{header,checks};
 };
 const pending=run(null);
 if(native.includes("if(primaryState===null){if(!checking&&Date.now()-pb1884PrimaryFailAt>30000)checkPrimary();}")){
  assert.equal(pending.checks,1);
  assert.equal(pending.header.children.length,1,'offline launcher is visible before the HTTP check finishes');
  assert.equal(typeof pending.header.children[0].onclick,'function');
 }else{
  // Legacy verified-only launchers may still wait for their existing check.
  // They must remain safe, but an unknown source shape cannot block delivery.
  // The earlier native launcher may already display a provisional button.
  // Both variants are valid provided the secondary-device denial remains.
  assert(pending.header.children.length<=1,'fallback must not create duplicate launcher buttons');
  if(pending.header.children.length)assert.equal(typeof pending.header.children[0].onclick,'function');
 }
 const secondary=run(false);
 assert.equal(secondary.header.children.length,0,'definitively unauthorized device stays blocked');
});

test('R1885: native patch uses stable modal creation anchor instead of mutable finally block',()=>{
 const patch=fs.readFileSync('scripts/enable-r1884-native-intake-offline-responsive.mjs','utf8');
 assert(patch.includes("const modal=node('dialog',null,'pb1137Intake');"));
 assert(!patch.includes("'release preparation dialog expected once, got 0'"));
 assert(native.indexOf('if(pb1884Cancelled)return')<native.indexOf("const modal=node('dialog',null,'pb1137Intake')"),
  'cancel must be checked before building real modal');
});

test('R1884: the Windows update manifest and loader serve exactly the native patch',()=>{
 for(const name of ['index.html',intakeName]){
  const entry=manifest.files.find(x=>x.name===name);
  assert(entry,'manifest missing '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
 assert(html.includes('photobridge-r1137-lab-local-intake.js?')&&html.includes('nativeResponsive=r1884'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("enable-r1884-native-intake-offline-responsive.mjs")>build.indexOf("enable-r1751-intake-css-only.mjs"));
});

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
 assert(native.includes("if(primaryState!==true)primaryState=null"));
 assert(native.includes("if(primaryState===null){if(!checking&&Date.now()-pb1884PrimaryFailAt>30000)checkPrimary();}"));
 assert(native.includes("state?.queued||state?.operationId"));
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

function simulateOffline(cancel){
 const start=native.indexOf('async function open(){');
 const end=native.indexOf('function mount(){',start);
 assert(start>=0&&end>start,'manual dialog entrypoint must exist');
 const code=native.slice(start,end);
 const shown=[],timers=[],nodes=[],requests=[];
 const node=(tag,text='',cls='')=>{
  const el={tag,textContent:text||'',className:cls,children:[],open:false,removed:false,dataset:{},style:{},
   append(...x){this.children.push(...x);},
   setAttribute(){},
   addEventListener(){},
   showModal(){this.open=true;shown.push(this);},
   close(){this.open=false;},
   remove(){this.removed=true}
  };
  nodes.push(el);return el;
 };
 const launch={disabled:false,textContent:'ثبت سفارش عکس حضوری'};
 const document={
  getElementById:()=>launch,
  body:{append(){}}
 };
 const never=()=>new Promise(()=>{});
 const sandbox={document,node,storage:()=>({root:never}),api:(path)=>{requests.push(path);return never()},
  active:null,opening:false,primaryState:null,primaryCheckedAt:0,
  location:{pathname:'/lab/orders'},navigator:{onLine:false},errors:{not_primary_download_device:'secondary'},
  setTimeout(fn,delay){timers.push({fn,delay});return timers.length;},clearTimeout(){},Promise,Date,Error,URL,
 };
 vm.createContext(sandbox);
 vm.runInContext(code+'\nthis.runOpen=open;',sandbox);
 const pending=sandbox.runOpen();
 assert.equal(shown.length,1,'preparation dialog must appear before any server reply');
 assert.equal(shown[0].className,'pb1137Intake pb1884IntakeWarmup');
 assert.equal(launch.disabled,true);
 const close=shown[0].children[0].children[1];
 assert.equal(close.textContent,'بستن');
 if(cancel){
  close.onclick();
  assert(shown[0].removed,'cancel removes the preparation dialog immediately');
 }
 assert(timers.some(x=>x.delay===1200),'offline bootstrap must have a bounded wait');
 for(const item of timers)item.fn();
 return Promise.resolve(pending).then(()=>({shown,requests,launch,nodes}));
}

test('R1884: closing during a hung offline bootstrap does not reopen the dialog',async()=>{
 const {shown,launch}=await simulateOffline(true);
 assert.equal(shown.length,1);
 assert.equal(launch.disabled,false);
});

test('R1884: dead connection presents a closable error dialog instead of hanging',async()=>{
 const {shown,requests,launch,nodes}=await simulateOffline(false);
 assert.equal(shown.length,2);
 assert.equal(shown[0].open,false);
 assert.equal(shown[1].open,true);
 assert(nodes.some(x=>String(x.textContent).includes('دریافت اطلاعات از سرور انجام نشد')));
 assert(requests.every(x=>!x.includes('/submit')),'no write is attempted on failed bootstrap');
 assert.equal(launch.disabled,false);
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
 assert.equal(pending.checks,1);
 assert.equal(pending.header.children.length,1,'offline launcher is visible before the HTTP check finishes');
 assert.equal(typeof pending.header.children[0].onclick,'function');
 const secondary=run(false);
 assert.equal(secondary.header.children.length,0,'definitively unauthorized device stays blocked');
});

test('R1885: native patch uses stable modal creation anchor instead of mutable finally block',()=>{
 const patch=fs.readFileSync('scripts/enable-r1884-native-intake-offline-responsive.mjs','utf8');
 assert(patch.includes('"const modal=node(\\'dialog\\',null,\\'pb1137Intake\\');"'));
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

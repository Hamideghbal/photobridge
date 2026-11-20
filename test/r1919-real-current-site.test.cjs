'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {patchOfflineIntake}=require('../offline-ui.cjs');
const {patchModernIntake}=require('../r1919-modern-intake.cjs');
const site='https://photobridge.ir/lab-desktop-ui/photobridge-r1137-lab-local-intake.js';
const approvedSha='1949690323fad43eb7e626fea0343752bf9324a67ca8975f0ebb23cfdc170c9a';
let cached;
async function original(){
 if(!cached)cached=(async()=>{
  const response=await fetch(site,{signal:AbortSignal.timeout(15000),headers:{'Cache-Control':'no-cache'}});
  assert.equal(response.ok,true,'Current website UI must be reachable for safe integration testing');
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),approvedSha,'Site generation changed: do not guess a patch or restore old UI');
  return bytes.toString('utf8');
 })();
 return cached;
}
test('R1919: exactly current November site asset is patched and never rolled back to October buttons',async()=>{
 const source=await original();const transformed=patchOfflineIntake(source);
 new Function(transformed);
 assert.equal(transformed,patchModernIntake(source));
 assert.equal(patchOfflineIntake(transformed),transformed);
 assert(transformed.includes('pb1504ActionToggle'));
 assert(transformed.includes('actionBadge.onclick'));
 assert(!transformed.includes("movePhotos=node('button','انتقال عکس')"));
 assert(transformed.includes('R1919_MODERN_NATIVE_INTAKE'));
});
test('R1919: native modal has one warm-up layer, no duplicate 1.2s fetch, and uses pre-authorized local bootstrap',async()=>{
 const s=patchOfflineIntake(await original());
 assert(s.includes('if(!window.pbNativeStorage){document.body.append(prep);prep.showModal();}'));
 assert(!s.includes("api('/api/lab/intake-live/download/bootstrap'+"));
 assert(s.includes("window.pbNativeStorage?api('/api/lab/delegated-orders/bootstrap'"));
 assert(s.includes("api('/api/lab/manual-intake/preflight')"));
 assert(s.includes('if(!window.pbNativeStorage){primaryState='));
});
test('R1919: when offline or local-only, native save never invokes browser IndexedDB copy or deletes source while syncing',async()=>{
 const s=patchOfflineIntake(await original());
 assert(s.includes("device={registered:true,isThisDevice:true,localOnly:local.localOnly}"));
 assert(s.includes('if(window.pbNativeStorage){const local=await api('));
 assert(s.includes('result.localCommitted&&result.syncPending'));
 assert(s.includes('const moveResult=pendingNative?{moved:0,pending:true}:await window.pb1466IntakeMove.finish(targets)'));
 assert(s.includes('desktopLocalFiles:targets.map'));
 assert(s.includes("if(!pendingNative)window.pb1466IntakeMove.report"));
});
test('R1919: unknown source and obsolete two-button source are never rewritten',()=>{
 assert.throws(()=>patchModernIntake('window.hello=true'),/modern_ui_incompatible/);
 assert.throws(()=>patchModernIntake("const x='pb1504ActionToggle'; const labOutboxBootstrap=true;"),/anchor_mismatch/);
});

test('R1919: actual current-site button survives delayed native bridge and header without enabling remote primary',async()=>{
 const transformed=patchOfflineIntake(await original());
 const start=transformed.indexOf('function mount(){'),end=transformed.indexOf('let primaryState=',start);
 assert(start>0&&end>start);
 function mount(path){
  const added=[];
  const host={isConnected:true,getClientRects:()=>[{}],querySelector:()=>null,append(button){added.push(button);button.parentElement=this;}};
  const document={
   querySelector:selector=>selector==='.labRoleWorkspace main'?host:null,
   getElementById:()=>null
  };
  const window={pbNativeStorage:{},matchMedia:()=>({matches:true})};
  vm.runInNewContext(transformed.slice(start,end)+'\nmount();',
   {document,window,location:{pathname:path},storage:()=>null,node:(tag,text,cls)=>({tag,textContent:text,cls}),primaryState:false,open:()=>{throw Error('do not open during mount')}},
   {timeout:600});
  return added;
 }
 assert.equal(mount('/lab/orders').length,1);
 assert.equal(mount('/lab/orders')[0].textContent,'ثبت سفارش عکس حضوری');
 assert.equal(mount('/store/orders').length,0);
});

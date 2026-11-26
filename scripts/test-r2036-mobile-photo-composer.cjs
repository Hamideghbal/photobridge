'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root='dist/web/';
const guard=read('scripts/r2036-mobile-photo-guard.js.txt');
const actions=read('scripts/r2036-mobile-photo-actions.js.txt');
function classes(...initial){
 const items=new Set(initial);
 return {contains:n=>items.has(n),add:n=>items.add(n),remove:n=>items.delete(n)};
}
function context({ua='Android',width=true,coarse=true,path='/photographer/upload',search='',embedded=false,frame=false,composer=true,platform='',touch=0,live=false,chooser=false}={}){
 const window={};window.top=frame?{}:window;
 const document={documentElement:{classList:classes(...(embedded?['pb1126Embedded']:[]))}};
 const w={classList:classes(...(composer?['simplePrintPilotWorkspaceMode']:[])),querySelector:q=>q==='.simplePrintPilot'&&live?{}:null};
 document.querySelector=q=>q==='#pbR99LabChooser'?(chooser?{hidden:false,getBoundingClientRect:()=>({height:100})}:null):w;
 const args={window,document,navigator:{userAgent:ua,platform,maxTouchPoints:touch},matchMedia:q=>({matches:q.includes('pointer')?coarse:width}),location:{pathname:path,search},URLSearchParams,getComputedStyle:()=>({display:'block'})};
 return {args,w,document};
}
test('R2036 photo composer ownership excludes Windows, desktop, album, finance, list, embedded and lab',()=>{
 const run=opts=>{const {args,w}=context(opts);return vm.runInNewContext(guard+'\npb2036MobilePhoto',args)(w)};
 assert.equal(run({}),true);assert.equal(run({ua:'iPhone'}),true);
 assert.equal(run({ua:'Macintosh',platform:'MacIntel',touch:5,coarse:false}),true);
 assert.equal(run({live:true,search:'?pbLabChooser=1',embedded:true}),true,'live mobile composer wins over stale chooser and desktop flags');
 assert.equal(run({live:true,chooser:true}),false,'real visible chooser wins');
 assert.equal(run({live:true,frame:true}),false,'embedded desktop iframe cannot own mobile layout');
 assert.equal(run({live:true,path:'/photographer/gallery'}),false,'old photo DOM cannot own Gallery');
 assert.equal(run({search:'?pbDesktopContent=1'}),true,'stale query on a real top-level handset is not a desktop frame');
 for(const opts of [{ua:'Windows NT 10.0'},{width:false},{ua:'Macintosh',coarse:false},{frame:true},{embedded:true},{search:'?pbLabChooser=1'},{path:'/photographer/album/new'},{path:'/photographer/finance/invoices'},{path:'/lab/orders'},{composer:false}])assert.equal(run(opts),false,JSON.stringify(opts));
});
test('R2036 mobile row preserves native disabled state, keeps one product button and delegates to the live native handler',()=>{
 const {args,w,document}=context();
 function button(){const attrs=new Map();return {disabled:false,textContent:'',setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k)||null,removeAttribute:k=>attrs.delete(k),addEventListener:(k,fn)=>{if(k==='click')this.click=fn}}}
 const choose=button(),send=button(),nativeChoose=button(),nativeSend=button();
 let product=null,added=0,calls=0,nextCalls=0;
 let nativeProduct={disabled:false,click:()=>calls++};
 w.querySelector=q=>q==='.pb1793StandaloneLaunch'?nativeProduct:q.includes('simplePrintPilotPrimaryAdd')?nativeChoose:q.includes('simplePrintPilotQuoteSubmit')?nativeSend:null;
 const row={hidden:true,isConnected:true,classList:classes(),querySelector:q=>q==='.pbF37Choose'?choose:q==='.pbF37Send'?send:product,append:b=>{product=b;added++;b.remove=()=>{product=null}}};
 document.createElement=()=>{const b=button();b.addEventListener=(k,fn)=>{b.click=fn};return b};
 const api=vm.runInNewContext(guard+'\n'+actions+'\n({sync:pb2036SyncPhoto,stop:pb2036StopPhoto,watch:pb2036WatchPhoto,repair:pb2040NeedsPhotoRepair})',{
  ...args,$:q=>q==='#pbF37PrintComposerActions'?row:w,MutationObserver:class{observe(){}disconnect(){}},
  printAction:i=>i===0?nativeChoose:nativeSend
 });
 api.sync(row,w);assert.equal(row.hidden,false);assert.equal(send.textContent,'ارسال');assert.equal(choose.textContent,'انتخاب سایز و عکس');assert.equal(product.textContent,'سفارش شاسی و قاب بدون چاپ');assert.equal(added,1);
 const first=product;for(let i=0;i<10;i++)api.sync(row,w);assert.equal(added,1);assert.equal(product,first);
 product.click();assert.equal(calls,1);
 nativeProduct={disabled:false,click:()=>nextCalls++};product.click();assert.equal(nextCalls,1);
 nativeSend.disabled=true;nativeProduct.disabled=true;api.sync(row,w);assert.equal(send.disabled,true);assert.equal(product.disabled,true);product.click();assert.equal(nextCalls,1);
 nativeSend.disabled=false;api.sync(row,w);assert.equal(send.disabled,false);
 document.body={classList:classes('pbF37PrintComposer')};
 api.watch(row,w);assert.equal(api.repair(w,row),false);
 const replacement={...w};assert(api.repair(replacement,row),'new workspace must be rebound');
 row.hidden=true;assert(api.repair(w,row),'old header reset must be reconciled');
 api.sync(row,w);document.documentElement.classList.remove('pb2036PhotoComposer');assert(api.repair(w,row),'root class removed after navigation');
 api.sync(row,w);send.textContent='ارسال فایل برای چاپ';assert(api.repair(w,row),'legacy send label reset');
 api.sync(row,w);assert.equal(api.repair(w,row),false);
 api.sync(row,replacement);api.watch(row,replacement);assert.equal(api.repair(replacement,row),false);

 api.stop();assert.equal(product,null);assert.equal(document.documentElement.classList.contains('pb2036PhotoComposer'),false);
});
test('R2036 delivered web runtime keeps one mobile geometry owner and existing send action',()=>{
 const names=['photobridge-ui-fixes-v765.js','photobridge-ui-fixes-v768.js','photobridge-v786-route-stability.js','photobridge-v807-mobile-scroll-store-fix.js','photobridge-v818-print-finance-composer-fix.js','photobridge-v904r100f41-header-date-name-fit.js'];
 const html=read(root+'index.html');
 for(const name of names){
  const js=read(root+name);
  assert.doesNotThrow(()=>new vm.Script(js));
  assert(js.includes('/* PB2036 photo-only ownership */'),name);
  assert(new RegExp(name.replaceAll('.','\\.')+'\\?[^"\\s]*mobilePhoto=r2036').test(html),name+' cache');
 }
 const legacy=read(root+names[0]),header=read(root+names[5]);
 assert(legacy.includes('function syncGeometry(w){\n    if(pb2036MobilePhoto(w))return;'));
 assert(legacy.includes('if(pb2036MobilePhoto(w)){if(!w.classList.contains("pb765Composing"))'));
 assert(legacy.includes("add.textContent='+'"),'keep overview plus');
 assert(header.includes("r.querySelector('.pbF37Send').addEventListener('click',()=>{const s=printAction(1);if(s&&!s.disabled)s.click()})"));
 assert(header.includes("pb2036SyncPhoto(r,photoWorkspace);pb2036WatchPhoto(r,photoWorkspace);return;"));
 assert(header.includes('pb2040WatchLifecycle();'));
 assert(header.includes('if(pb2042PhotoWorkspace())return "print";'));
 assert(header.includes('pb2042LifecycleObserver.observe(document.documentElement'));
 assert(legacy.includes('if(pb2036MobilePhoto(w)){ensureModeActions(w);return;}'));
 assert(html.includes('mobileReentry=r2042'));
 assert(header.includes('if(pb2036MobilePhoto(current))return pb2040PhotoAction(current,index)'));
 for(const name of ['photobridge-v815-print-finance-tabs.js','photobridge-v816-print-finance-unify.js','photobridge-v817-print-header-stability.js','photobridge-v818-print-finance-composer-fix.js','photobridge-ui-fixes-v749.js']){
  const script=read(root+name);assert.doesNotThrow(()=>new vm.Script(script));assert(script.includes('if(pb2036MobilePhoto(document.querySelector(".photographerMain.photographerPrintWorkspace")))return;'));assert(html.includes(name+'?')&&html.split(name+'?')[1].split('"')[0].includes('mobileLifecycle=r2040'),name+' lifecycle cache');
 }
 assert(read(root+names[2]).includes('&&!pb2036MobilePhoto(main))cleanupPrintLeak()'));
 const css=read(root+'photobridge-r2036-mobile-photo-composer.css');
 assert(css.includes('@media(max-width:820px)'));
 assert(css.includes('grid-template-areas:"choose product"'));
 assert.match(css,/\.pbF37Send\{\s*position:fixed!important;[\s\S]*?left:14px!important;[\s\S]*?width:56px!important;[\s\S]*?border-radius:50%!important/);
 assert.match(css,/\.photographerRolePageScrollArea\{\s*position:fixed!important;top:241px!important;bottom:78px!important/);
 assert(!read('scripts/enable-r2036-mobile-photo-composer.mjs').includes('lab-desktop-ui'));
 assert(!read('scripts/enable-r2036-mobile-photo-composer.mjs').includes('dist/api'));
});

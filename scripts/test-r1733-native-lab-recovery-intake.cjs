'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),http=require('node:http');
const read=p=>fs.readFileSync(p,'utf8');
const base='dist/web/lab-desktop-ui/';
test('R1733 Windows lab header retains one walk-in action for print and album; server device validation remains',()=>{
 const js=read(base+'photobridge-r1137-lab-local-intake.js');
 const header=read(base+'photobridge-r1147-lab-admin-header.js');
 assert.doesNotThrow(()=>new Function(js));
 assert.doesNotThrow(()=>new Function(header));
 assert(js.includes('/* PB1733 native Lab walk-in header fix */'));
 assert(js.includes("'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری'"));
 assert(js.includes('if(button.textContent!==label)button.textContent=label'));
 assert(js.includes('if(!opening&&button.disabled)button.disabled=false'));
 assert(js.includes('const target=visible(secondary)?secondary:visible(top)?top:workspace;'));
 assert(!js.includes("host.querySelector('.mainQueueFilters')"));
 assert(!js.includes('if(!primaryState){old?.remove();return;}'));
 assert(js.includes("if(!primary.registered||!primary.isThisDevice)throw Error("));
 assert(header.includes('/* PB1733 keep intake across header rebuild */'));
 assert(header.includes("if(pb1733Intake)row.prepend(pb1733Intake);"));
});
test('R1733 release is isolated to native UI, has valid hashes and safe browser recovery',()=>{
 const manifest=JSON.parse(read(base+'manifest.json'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const files=['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js','r1733-native-intake.css','r1733-native-auth-help.js','index.html'];
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const name of files){
  const entry=manifest.files.find(x=>x.name===name);
  assert(entry,name);assert.equal(entry.sha256,hash(fs.readFileSync(base+name)),name);
 }
 const nativeIndex=read(base+'index.html'),help=read(base+'r1733-native-auth-help.js');
 assert(nativeIndex.includes('/r1733-native-intake.css?v=r1733'));
 assert(nativeIndex.includes('nativeQueue=r1736'));
 assert(nativeIndex.includes('/r1733-native-auth-help.js?v=r1733'));
 assert(help.includes("https://photobridge.ir/account-recovery.html"));
 assert(help.includes('event.stopImmediatePropagation()'));
 assert(!help.includes("input[name='password']"));
});
test('R1733 Windows localhost proxy forwards public OTP endpoints but rejects unauthenticated origin',async()=>{
 const {createHost}=require('./r1388-native/host.cjs');
 let requests=[];
 const responseData=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
 const srv=createHost({store:{get:()=>null,set:()=>{}},sync:{},request:async(path,options)=>{
  requests.push({path,options});return path==='/api/auth/lab-login'
   ?responseData(401,{error:'invalid_credentials'})
   :responseData(200,{challengeId:'challenge'});
 },roots:()=>[],token:'secret',onLogin:async()=>{throw Error('unexpected success')},onLogout:async()=>({})});
 await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
 const send=(path,data,cookie='desktop=secret')=>new Promise((resolve,reject)=>{
  const payload=JSON.stringify(data);
  const req=http.request({host:'127.0.0.1',port:srv.address().port,path,method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}},r=>{
   let str='';r.setEncoding('utf8');r.on('data',x=>str+=x);r.on('end',()=>resolve({status:r.statusCode,body:JSON.parse(str)}));
  });req.on('error',reject);req.end(payload);
 });
 try{
  const blocked=await send('/api/auth/password-reset/request',{portal:'account',mobile:'09123456789'},'');
  assert.equal(blocked.status,403);assert.equal(requests.length,0);
  for(const name of ['request','verify','complete']){
   const forwarded=await send('/api/auth/password-reset/'+name,{portal:'account',mobile:'09123456789'});
   assert.equal(forwarded.status,200);
   const last=requests.at(-1);assert.equal(last.path,'/api/auth/password-reset/'+name);
   assert.equal(last.options.anonymous,true);
  }
  const login=await send('/api/auth/lab-login',{mobile:'۰۹۱۲ ۳۴۵۶۷۸۹',password:'  sEcRet+78  '});
  assert.equal(login.status,401);
  const sent=JSON.parse(requests.at(-1).options.body);
  assert.equal(sent.mobile,'09123456789');
  assert.equal(sent.password,'  sEcRet+78  ');
 }finally{await new Promise(resolve=>srv.close(resolve))}
});


test('R1734 Liara native patch tolerates modified upstream walk-in labels',()=>{
 const vm=require('node:vm');
 const patch=read('scripts/enable-r1733-native-lab-recovery-intake.mjs')
  .replace(/^import [^\n]+\n/gm,'');
 const intake=read('dist/web/photobridge-r1137-lab-local-intake.js');
 const header=read('dist/web/photobridge-r1147-lab-admin-header.js');
 // R1188 runs before the final native snapshot in production. It replaces
 // the legacy source selector with route-aware queue prioritization.
 const baseSource="const source=document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs')||document.querySelector('.mainQueueFilters');";
 const upstreamSource="const queueRoute=location.pathname.startsWith('/lab/orders');const source=queueRoute?document.querySelector('.labRoleWorkspace .mainQueueFilters'):(document.querySelector('.labSettingsSectionTabs')||document.querySelector('.financeSectionTabs'));";
 assert(header.includes(baseSource));
 for(const changed of [false,true,'R1188','other-header']){
  const prefix='dist/web/lab-desktop-ui/';
  const modified=changed?intake
   .replaceAll("launch.textContent='ثبت سفارش عکس حضوری';","launch.textContent='متن اصلاح‌شده توسط مرحلهٔ قبلی';")
   .replaceAll("modal.setAttribute('aria-label','ثبت سفارش عکس حضوری');","modal.setAttribute('aria-label','پنجرهٔ سفارش';")
   .replaceAll("head.append(node('h2','ثبت سفارش عکس حضوری'));","head.append(node('h2','پنجرهٔ سفارش'));"):intake;
  const files=new Map([
   [prefix+'photobridge-r1137-lab-local-intake.js',modified],
   [prefix+'photobridge-r1147-lab-admin-header.js',changed==='R1188'?header.replace(baseSource,upstreamSource):changed==='other-header'?header.replace(baseSource,"const source=document.querySelector('.mainQueueFilters')||document.querySelector('.financeSectionTabs');"):header],
   ['scripts/r1733-native-intake.css',read('scripts/r1733-native-intake.css')],
   ['scripts/r1733-native-auth-help.js',read('scripts/r1733-native-auth-help.js')],
   [prefix+'index.html','<html><head></head><body></body></html>'],
   [prefix+'manifest.json',JSON.stringify({protocol:1,channel:'lab',files:[]})]
  ]);
  const fsMock={
   readFileSync:p=>{assert(files.has(p),'missing fixture '+p);return files.get(p)},
   writeFileSync:(p,v)=>files.set(p,v),
   copyFileSync:(a,b)=>{assert(files.has(a),'missing fixture '+a);files.set(b,files.get(a))}
  };
  const run=new Function('fs','crypto','execFileSync','process','console',patch);
  const verify=(_node,args)=>{const content=files.get(args.at(-1));assert(content);assert.doesNotThrow(()=>new vm.Script(content))};
  const invoke=()=>run(fsMock,crypto,verify,{execPath:process.execPath},{log(){}});
  assert.doesNotThrow(invoke,'build should tolerate legacy label changes');
  // A second execution must be safe for repeated local builds.
  assert.doesNotThrow(invoke,'native patch should be idempotent');
  const built=files.get(prefix+'photobridge-r1137-lab-local-intake.js');
  assert(built.includes("pb1733DialogHeading.textContent=pb1733IntakeLabel()"));
  assert(built.includes("const button=old||node('button',pb1733IntakeLabel()"));
  assert(built.includes("if(!primary.registered||!primary.isThisDevice)throw Error("));
  const nativeHeader=files.get(prefix+'photobridge-r1147-lab-admin-header.js');
  assert(nativeHeader.includes('PB1736 native current queue source'),'R1188 queue header must be accepted');
  assert(nativeHeader.includes('PB1733 keep intake across header rebuild'));
  const manifest=JSON.parse(files.get(prefix+'manifest.json'));
  assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
  assert.equal(manifest.files.length,5);
 }
});

test('R1735 visible native walk-in action survives hidden filters and lost marker',()=>{
 const js=read(base+'photobridge-r1137-lab-local-intake.js');
 const start=js.indexOf('function mount(){');
 const end=js.indexOf('\nlet primaryState=null,checking=false,primaryCheckedAt=0;',start);
 assert(start>=0&&end>start);
 const mountCode=js.slice(start,end);
 let path='/lab/orders',current=null,secondaryVisible=true,paired=false,checkingCalls=0;
 const createTarget=name=>({name,prepends:0,prepend(button){this.prepends++;button.parentElement=this;}});
 const top=createTarget('top'),secondary=createTarget('secondary');
 const workspace={querySelector:selector=>selector==='.pb1148SecondaryHeader.pb1174QueueNav'?(secondaryVisible?secondary:null):selector==='.labSingleHeader'?top:null,prepend(button){button.parentElement=this;}};
 const doc={querySelector:selector=>selector==='.labRoleWorkspace'?workspace:null,getElementById:id=>id==='pb1137LocalIntakeButton'?current:null};
 const makeButton=(tag,text,cls)=>{assert.equal(tag,'button');return current={textContent:text,className:cls,disabled:false,parentElement:null,attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},remove(){this.parentElement=null;}};};
 const label=()=>path.startsWith('/lab/album')?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری';
 const location={get pathname(){return path}};
 const fakeOpen=()=>{};
 const makeMount=(opening=false)=>new Function('document','storage','location','pb1733IntakeLabel','node','open','primaryState','checking','checkPrimary','opening',mountCode+'\nreturn mount;')(
  doc,()=>({deviceId:()=>paired?'device':null}),location,label,makeButton,fakeOpen,null,false,()=>{checkingCalls++},opening);
 const mount=makeMount();
 mount();
 assert.equal(current.parentElement,secondary,'button must be in visible sibling header');
 assert.equal(current.disabled,false,'missing marker must not hide or disable launch');
 assert.equal(current.textContent,'ثبت سفارش عکس حضوری');
 assert.equal(current.onclick,fakeOpen);
 mount();assert.equal(secondary.prepends,1,'repeated repaint must not duplicate action');
 path='/lab/album';mount();assert.equal(current.textContent,'ثبت سفارش آلبوم حضوری');
 secondaryVisible=false;mount();assert.equal(current.parentElement,top,'before secondary nav is ready show it in first header');
 paired=true;mount();assert.equal(checkingCalls,1,'real pairing can trigger background device check');
 current.disabled=true;makeMount(true)();assert.equal(current.disabled,true,'preparing action must remain disabled');
 current.parentElement=top;secondaryVisible=false;top.getClientRects=()=>[];mount();assert.equal(current.parentElement,workspace,'both headers hidden: workspace fallback keeps action');
 path='/lab/settings';mount();assert.equal(current.parentElement,null,'leave intake out of settings');
});

test('R1736 native release prioritizes the live queue and stamps the hot-update payload',()=>{
 const header=read(base+'photobridge-r1147-lab-admin-header.js');
 const js=read(base+'photobridge-r1137-lab-local-intake.js');
 const html=read(base+'index.html');
 assert(header.includes('PB1736 native current queue source'));
 assert(js.includes("button.dataset.pbNativeIntakeVersion='r1736'"));
 assert(js.includes('const target=visible(secondary)?secondary:visible(top)?top:workspace'));
 assert(!js.includes("host.querySelector('.mainQueueFilters')"));
 assert(html.includes('nativeQueue=r1736'));
 const css=read(base+'r1733-native-intake.css');
 assert(css.includes('pb1736NativeWalkin'));
});

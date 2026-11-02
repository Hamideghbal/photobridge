'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const safeOrigin=value=>{try{return new URL(value).origin;}catch{return null;}};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const assets=['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js'];
function generalSections(source){const group=source.match(/key:["']general["'],label:[\s\S]*?items:\[([\s\S]*?)\]\s*\}\s*,\s*\{key:["']customers["']/)?.[1]||'';return[...group.matchAll(/\["([a-z-]+)",/g)].map(m=>m[1]);}
function sourceMarker(source,version){return{version,pid:process.pid,sha256:hash(source),generalSections:generalSections(source)};}
async function diskProof({roots,version,store}){
 const result={version,pid:process.pid,uiBuild:store.get('uiBuild')||null,uiKnownGoodBuild:store.get('uiKnownGoodBuild')||null,uiAppliedAt:store.get('uiAppliedAt')||null,roots:[],nativeFiles:{}};
 for(const [index,root]of roots.entries()){
  if(!root)continue;const item={slot:index===0?'selected':'fallback',files:{}};
  for(const name of assets)try{const bytes=await fs.readFile(path.join(root,name));const raw=bytes.toString('utf8');let served=null;
   if(name.endsWith('r84.js'))served='window.__PB_NATIVE_SOURCE_PROOF__='+JSON.stringify(sourceMarker(raw,version))+';\n'+require('./storage-bundle.cjs').patchStorageBundle(raw);
   if(name==='photobridge-r1147-lab-admin-header.js')served=require('./navigation-header-patch.cjs').patchNavigationHeader(raw);
   if(name==='photobridge-r1372-third-header.js')served=require('./navigation-header-patch.cjs').patchThirdNavigation(raw);
   item.files[name]={sha256:hash(bytes),bytes:bytes.length,...(served?{servedSha256:hash(served)}:{}),...(name.endsWith('r84.js')?{generalSections:generalSections(raw)}:{})};}catch{item.files[name]={missing:true};}
  try{item.manifestBuild=JSON.parse(await fs.readFile(path.join(root,'.pb-lab-bundle-manifest.json'),'utf8')).build;}catch{item.manifestBuild=null;}
  result.roots.push(item);
 }
 for(const name of ['main.cjs','host.cjs','desktop-overlay.js','navigation-header-patch.cjs','native-session.cjs'])try{result.nativeFiles[name]=hash(await fs.readFile(path.join(__dirname,name)));}catch{result.nativeFiles[name]=null;}
 return result;
}
function rendererSnapshot(){
 const cleanUrl=value=>{try{const u=new URL(value,location.href);return{origin:u.origin,path:u.origin===location.origin?u.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,':id').replace(/\/\d+(?=\/|$)/g,'/:id'):null};}catch{return null;}};
 const list=selector=>[...document.querySelectorAll(selector)].slice(0,20).map(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return{label:(node.textContent||'').trim().slice(0,100),visible:!!(r.width&&r.height)&&s.visibility!=='hidden',active:node.classList.contains('active'),width:Math.round(r.width),height:Math.round(r.height)};});
 return{page:cleanUrl(location.href),hash:/^#(?:customers(?:-invites|-collaboration)?|wallet)$/.test(location.hash)?location.hash:'',readyState:document.readyState,viewport:{width:innerWidth,height:innerHeight,desktop:matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches},proof:window.__PB_NATIVE_SOURCE_PROOF__||null,flags:{header:!!window.pb1147LabHeader,promoted:!!window.pb1372ThirdHeader,overlay:!!window.__PB_LAB_DESKTOP_OVERLAY__,nativeBridge:!!window.pbNativeStorage},rootClasses:document.querySelector('.labRoleWorkspace')?.className||null,primary:list('.pb1147LabNav>button'),secondary:list('.pb1148SecondaryHeader>button[data-pb1173-index]'),promoted:list('.pb1372ThirdHeader>button'),originalSettings:list('.labSettingsSectionTabs>button'),customerSource:list('.labCustomerSubnav>button'),backup:!!document.getElementById('pbLabBackupSettingsButton'),sourceMenus:[...document.querySelectorAll('.labSettingsSectionTabs,.labCustomerSubnav,.financeSectionTabs,.pb1425CustomerTabs')].map(menu=>{const owner=menu.closest('.labSettingsWorkspace,.financePage,.financeWorkspace');return{classes:menu.className,ownerClasses:owner?.className||null,ownerVisible:owner?!!owner.getClientRects().length:null,labels:[...menu.querySelectorAll(':scope>button')].map(button=>(button.textContent||'').trim().slice(0,100))};}),headerState:[...document.querySelectorAll('.pb1148SecondaryHeader,.pb1372ThirdHeader')].map(header=>({classes:header.className,display:getComputedStyle(header).display,kind:header._kind||null,sourceClass:header._source?.className||null})),scripts:[...document.scripts].map(s=>cleanUrl(s.src)).filter(Boolean).filter(s=>/index-UIRefine|r1147|r1372|desktop-overlay|native-storage/.test(s.path||'')),frames:[...document.querySelectorAll('iframe')].map(frame=>cleanUrl(frame.src)),serviceWorker:navigator.serviceWorker?.controller?cleanUrl(navigator.serviceWorker.controller.scriptURL):null};
}
async function browserProof(){
 const output={};
 for(const name of ['/desktop/ui-proof','/assets/index-UIRefine-v655-r84.js','/photobridge-r1147-lab-admin-header.js','/photobridge-r1372-third-header.js','/desktop-overlay.js'])try{const response=await fetch(name,{cache:'no-store'});if(name==='/desktop/ui-proof'){output.host={status:response.status,data:response.ok?await response.json():null};continue;}const body=await response.arrayBuffer();output[name]={status:response.status,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',body))].map(b=>b.toString(16).padStart(2,'0')).join(''),hostVersion:response.headers.get('x-photobridge-native-version'),hostPid:response.headers.get('x-photobridge-native-pid')};}catch{output[name]={failed:true};}
 return output;
}
function createUiDiagnostics({getWindow,getRoots,store,version,origin}){
 const timeline=[];let previous='',running=false;
 async function capture(){const win=getWindow();if(running||!win||win.isDestroyed()||!win.webContents.getURL().startsWith(origin+'/'))return null;running=true;try{const snapshot=await win.webContents.executeJavaScript('('+rendererSnapshot.toString()+')()',false),signature=JSON.stringify(snapshot);if(signature!==previous){previous=signature;timeline.push({at:new Date().toISOString(),...snapshot});if(timeline.length>30)timeline.shift();}return snapshot;}catch{return null;}finally{running=false;}}
 return{capture,async collect(){await capture();const win=getWindow();return{schema:1,createdAt:new Date().toISOString(),privacy:'UI metadata only; no cookies, tokens, customer records, photos or localStorage contents',native:await diskProof({roots:getRoots(),version,store}),timeline:[...timeline],windowOrigin:win&&!win.isDestroyed()?safeOrigin(win.webContents.getURL()):null,expectedOrigin:origin,browser:win&&!win.isDestroyed()&&win.webContents.getURL().startsWith(origin+'/')?await win.webContents.executeJavaScript('('+browserProof.toString()+')()',false).catch(()=>({failed:true})):null};}};
}
module.exports={sourceMarker,generalSections,diskProof,rendererSnapshot,browserProof,createUiDiagnostics};

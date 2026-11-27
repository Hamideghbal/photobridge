import fs from 'node:fs';
import zlib from 'node:zlib';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R2099 anchor '+a.slice(0,100));return s.replace(a,()=>b)};
export function patchPanel(s){
 if(s.includes('/* PB2099 mobile panel ownership */'))return s;
 s=once(s,"if(location.pathname==='/equipment-rental/book'&&window===window.top&&new URLSearchParams(location.search).get('pbOfficeLogin')!=='1'){\n const q=new URLSearchParams({pbStorePanel:'store',pbStoreQuery:location.search});location.replace('/photographer/gallery?'+q);return;\n}","if(location.pathname==='/equipment-rental/book'&&window===window.top&&new URLSearchParams(location.search).get('pbOfficeLogin')!=='1'){\n const enter=()=>{const source=new URLSearchParams(location.search);source.delete('pb2087AccountEntry');source.delete('pb2092Launch');const q=new URLSearchParams({pbStorePanel:'store',pbStoreQuery:source.toString()});const target='/photographer/gallery?'+q;if(!window.pb2092AccountNavigate?.(target))location.replace(target)};\n if(document.documentElement.classList.contains('pb2087AccountPending'))window.addEventListener('pb2087-account-ready',enter,{once:true});else enter();return;\n}");
 s=once(s,"let dock,dockObserver,selected=null,authenticated=false;const panels=new Map(),dockState=new Map();","/* PB2099 mobile panel ownership */\nlet dock,dockObserver,selected=null,authenticated=false;const panels=new Map(),dockState=new Map();let authEpoch=0;\nconst genuinePhotographer=async()=>{try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'},signal:AbortSignal.timeout(8000)});if(r.status===401||r.status===403)return false;if(!r.ok)return null;const d=await r.json();return d?.user?.labRole==='customer'}catch{return null}};\nfunction setOwner(kind){const root=document.documentElement;if(kind)root.dataset.pb2099Panel=kind;else delete root.dataset.pb2099Panel;}\nfunction validFrame(kind,url){return url.origin===location.origin&&(kind==='store'?url.pathname==='/equipment-rental/book':/^\\/photographer\\/(?:orders|upload|album|archive|finance)(?:\\/|$)/.test(url.pathname))}");
 s=once(s," const kind=restoreKind();if(kind&&!selected)open(kind,false);if(selected)mark();"," const kind=restoreKind();if(kind&&!selected&&!document.documentElement.classList.contains('pb2087AccountPending'))open(kind,false);if(selected)mark();");
 s=once(s,"if(selected===kind){if(choose)showChooser(panels.get(kind),kind);return;}","if(selected===kind){if(choose)showChooser(panels.get(kind),kind);return;}"); // preserve explicit chooser action
 const old="  frame.addEventListener('load',()=>{try{const url=new URL(frame.contentWindow.location.href);if(url.href==='about:blank')return;if(url.origin!==location.origin||/^\\/photographer\\/(login|signup|register)/.test(url.pathname)||!/^\\/(equipment-rental|photographer)(\\/|$)/.test(url.pathname)){location.assign(url.href);return}}catch{return}loading.hidden=true});";
 const replacement="  let frameEpoch=0;frame.addEventListener('load',async()=>{const epoch=++frameEpoch;let url;try{url=new URL(frame.contentWindow.location.href);if(url.href==='about:blank')return;if(validFrame(kind,url)){loading.hidden=true;return}}catch{}if(panel.hidden||selected!==kind)return;loading.hidden=false;loading.textContent='در حال بررسی اتصال حساب عکاس…';const valid=await genuinePhotographer();if(epoch!==frameEpoch||panel.hidden||selected!==kind||!panel.isConnected)return;loading.textContent=valid===false?'نشست عکاس معتبر نیست.':'ارتباط این بخش برقرار نشد.';const retry=document.createElement('button');retry.type='button';retry.textContent='تلاش دوباره';retry.onclick=()=>{loading.textContent='در حال دریافت…';frame.src=frame.dataset.pb2099Entry};loading.append(retry);if(valid===false){const login=document.createElement('button');login.type='button';login.textContent='ورود دوباره به حساب عکاس';login.onclick=()=>{location.assign('/photographer/login?logged_out=1')};loading.append(login)}});";
 s=once(s,old,replacement);
 s=once(s,"q.set('pbEmbeddedStore','1');frame.src=(kind==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;","q.set('pbEmbeddedStore','1');frame.dataset.pb2099Entry=(kind==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;frame.src=frame.dataset.pb2099Entry;");
 s=once(s,"if(choose)showChooser(panel,kind);panel.hidden=false;selected=kind;document.body.classList.add('pb1106PanelOpen');mark();","panel.hidden=false;selected=kind;setOwner(kind);if(choose)showChooser(panel,kind);document.body.classList.add('pb1106PanelOpen');mark();");
 s=once(s,"for(const panel of panels.values())panel.hidden=true;selected=null;document.body.classList.remove('pb1106PanelOpen');mark();","for(const panel of panels.values())panel.hidden=true;selected=null;setOwner(null);document.body.classList.remove('pb1106PanelOpen');mark();");
 s=once(s,"window.addEventListener('photobridge-auth-session-changed',e=>{if(e.detail?.labRole==='customer'){authenticated=true;sync();return;}if(authenticated)close();else{selected=null;document.body.classList.remove('pb1106PanelOpen');mark();}authenticated=false;for(const p of panels.values())p.remove();panels.clear();dockState.clear();dockObserver?.disconnect();dock=null;});","window.addEventListener('photobridge-auth-session-changed',async e=>{const epoch=++authEpoch;if(e.detail?.labRole==='customer'){authenticated=true;sync();return;}if(!authenticated&&!selected)return;const valid=await genuinePhotographer();if(epoch!==authEpoch||valid!==false)return;close();authenticated=false;for(const p of panels.values())p.remove();panels.clear();dockState.clear();dockObserver?.disconnect();dock=null;});\nwindow.addEventListener('pb2087-account-ready',sync);");
 // Hidden frames cannot force parent navigation. Keep a visible invalid frame retryable on re-entry.
 s=once(s,"if(choose)showChooser(panel,kind);document.body.classList.add('pb1106PanelOpen');mark();","if(choose)showChooser(panel,kind);const frame=panel.querySelector('iframe');if(frame&&panel.querySelector('.pb1106ContentLoading')?.hidden){try{if(!validFrame(kind,new URL(frame.contentWindow.location.href)))frame.src=frame.dataset.pb2099Entry}catch{frame.src=frame.dataset.pb2099Entry}}document.body.classList.add('pb1106PanelOpen');mark();");
 // R2103: batch observer work, and don't repeatedly write the same dock height.
 s=once(s,"if(height>0)document.documentElement.style.setProperty('--pb1106-dock-height',height+'px')","if(height>0&&document.documentElement.style.getPropertyValue('--pb1106-dock-height')!==height+'px')document.documentElement.style.setProperty('--pb1106-dock-height',height+'px')");
 s=once(s,"function init(){sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true})}","let pb2103SyncQueued=false;function pb2103QueueSync(){if(pb2103SyncQueued)return;pb2103SyncQueued=true;requestAnimationFrame(()=>{pb2103SyncQueued=false;sync()})}function init(){sync();new MutationObserver(pb2103QueueSync).observe(document.body,{childList:true,subtree:true})}");
 new Function(s);return s;
}
export function patchChooser(s){
 if(s.includes('/* PB2099 selected mobile panel */'))return s;
 const a="const q=new URLSearchParams(location.search);/* R1995:";
 return once(s,a,"const q=new URLSearchParams(location.search);/* PB2099 selected mobile panel */if(matchMedia('(max-width:820px)').matches&&window===window.top&&(['store'].includes(q.get('pbStorePanel'))||q.get('pbStorePanel')==='1'||document.documentElement.dataset.pb2099Panel==='store'))return false;/* R1995:");
}
export function patchPicker(s){
 if(s.includes('/* PB2099 internal photographer route */'))return s;
 s=once(s,"const target=String(path).split('?')[0];const role=currentPortal();if(!role||!target.startsWith(routes[role]+'/'))return false;return move(path)","const target=String(path).split('?')[0];const role=currentPortal();/* PB2099 internal photographer route */if(!role||!(target===routes[role]||target.startsWith(routes[role]+'/')||(role==='photographer'&&target==='/equipment-rental/book')))return false;return move(path)");
 s=once(s,"!url.pathname.startsWith(routes[role]+'/')||url.pathname===location.pathname","!(url.pathname===routes[role]||url.pathname.startsWith(routes[role]+'/')||(role==='photographer'&&url.pathname==='/equipment-rental/book'))||url.pathname===location.pathname");
 s=once(s,"window.addEventListener('blur',()=>{blurred=true});","window.addEventListener('blur',()=>{if(currentPortal()!=='photographer'||document.hidden)blurred=true});");
 // R2103: a slow, explicitly authorized document transition must not reopen the chooser.
 // A handoff is still one-use and path-bound; it never authorizes an API request.
 s=once(s,"saved.until<=Date.now()+15000","saved.until<=Date.now()+60000");
 s=once(s,"until:Date.now()+15000,login","until:Date.now()+60000,login");
 s=once(s,"authorized=handoff,blurred=false,watchTimer=0;","authorized=handoff,blurred=false,watchTimer=0;let pb2103SelectedAt=handoff?Date.now():0,pb2103HiddenAt=0;");
 s=once(s,"authorized=true;needsResume=false;wasHidden=false;blurred=false;","authorized=true;needsResume=false;wasHidden=false;blurred=false;pb2103SelectedAt=Date.now();pb2103HiddenAt=0; if(portal==='photographer'&&query.has('pb2092Launch')){query.delete('pb2092Launch');try{history.replaceState(history.state,'',location.pathname+(query.toString()?'?'+query:'')+(location.hash||''))}catch{}}");
 s=once(s,"if(!wasHidden&&!blurred&&!needsResume)return;","if(!wasHidden&&!blurred&&!needsResume)return; if(currentPortal()==='photographer'&&authorized&&!needsResume&&Date.now()-pb2103SelectedAt<12000&&(!pb2103HiddenAt||Date.now()-pb2103HiddenAt<1500)){wasHidden=false;blurred=false;pb2103HiddenAt=0;return}");
 s=once(s,"if(document.hidden){wasHidden=true;return}","if(document.hidden){wasHidden=true;pb2103HiddenAt=Date.now();return}");
 // Preserve true server rejection and offer a retry only for transport uncertainty.
 s=once(s,"const valid=await validSession(selected);","let valid=await validSession(selected);if(selected==='photographer'&&valid?.uncertain)valid=await validSession(selected);");
 return s;
}
function write(p,s){fs.writeFileSync(p,s);const b=Buffer.from(s);for(const [x,enc] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(p+x))fs.writeFileSync(p+x,enc(b))}
export function run(){
 const panel='dist/web/photobridge-r1106-mobile-store-panel.js',chooser='dist/web/photobridge-v904r99-lab-chooser.js';
 for(const [p,f] of [[panel,patchPanel],[chooser,patchChooser]]){const s=f(fs.readFileSync(p,'utf8'));new Function(s);write(p,s)}
 for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let s=fs.readFileSync(p,'utf8');s=s.replace(/(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/,(_,a,body,b)=>{const next=patchPicker(body);new Function(next);return a+next+b});
  if(p.endsWith('book.html')&&!s.includes('/* PB2099 scoped store identity */')){
   // Shared auth endpoints default to the generic cookie unless the photographer portal is explicit.
   s=once(s,"headers:{...(opt.body?{'content-type':'application/json'}:{}),...(opt.headers||{})}","headers:{/* PB2099 scoped store identity */'x-photobridge-portal':'photographer',...(opt.body?{'content-type':'application/json'}:{}),...(opt.headers||{})}");
  }
  // R2105: early prefetch uses the same photographer session as the regular API.
  s=s.replace(/fetch\('\/api\/customer\/equipment-rental\/shops',\{credentials:'same-origin',signal:controller.signal\}\)/g,"fetch('/api/customer/equipment-rental/shops',{credentials:'same-origin',headers:{'x-photobridge-portal':'photographer'},signal:controller.signal})");
  s=s.replaceAll("fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'})","fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}})");
  s=s.replace(/(photobridge-r1106-mobile-store-panel\.js|photobridge-v904r99-lab-chooser\.js)([^"'<> \r\n]*)/g,(_,a,q)=>a+q+(q.includes('?')?'&':'?')+'mobileRoute=r2099&storePerf=r2103&sessionFix=r2105');
  if(!s.includes('id="pb2099MobilePanelIsolation"'))s=s.replace('</head>','<style id="pb2099MobilePanelIsolation">@media(max-width:820px){html[data-pb2099-panel="store"] body>#pbR99LabChooser,html[data-pb2099-panel="store"] body>#pbR100F18RouteCover{display:none!important;visibility:hidden!important;pointer-events:none!important}html[data-pb2099-panel] body .pb1106ContentPanel[hidden]{display:none!important}html[data-pb2099-panel] body .pb1106ContentPanel:not([hidden]){display:block!important}}</style></head>');
  write(p,s);
 }
 const entry='dist/web/photobridge-r100f5-entry-routing.js';let s=fs.readFileSync(entry,'utf8');
 // R1721's separate Store document must carry the explicitly selected photographer role.
 if(!s.includes('/* PB2099 store landing handoff */'))s=once(s,'moving=true;location.replace(destination);',"moving=true;/* PB2099 store landing handoff */if(!window.pb2092AccountNavigate?.(destination))location.replace(destination);");
 s=s.replaceAll("fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'})","fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store',headers:{'x-photobridge-portal':'photographer'}})");
 new Function(s);write(entry,s);
 const html='dist/web/index.html';write(html,fs.readFileSync(html,'utf8').replace(/(photobridge-r100f5-entry-routing\.js\?[^"'<> \r\n]+)/g,u=>u.includes('mobileRoute=r2099')?u:u+'&mobileRoute=r2099&storePerf=r2103&sessionFix=r2105'));
 console.log('[R2099] mobile photographer panel ownership, bounded frame failures, verified role handoff');
}
if(process.argv[1]?.endsWith('enable-r2099-mobile-photographer-session-navigation.mjs'))run();

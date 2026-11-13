import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/equipment-rental-book.html';
let html=fs.readFileSync(file,'utf8');
function once(from,to,label){if(html.split(from).length!==2)throw Error('R1837 missing '+label);html=html.replace(from,()=>to)}
if(!html.includes('/* R1837: a selection stays observable')){
 const prefetch=fs.readFileSync('scripts/r1837-chooser-prefetch.js','utf8');
 if(!html.includes('<head>'))throw Error('R1837 document head missing');
 html=html.replace('<head>',()=>'<head>\n<script id="pb1837ChooserPrefetch">'+prefetch+'</script><style id="pb1837ChooserStatus">#storeChooserStatusR1837[data-kind="pending"]{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}#storeChooserListR96 [data-enter-store-r96]:disabled{cursor:wait;opacity:.65}</style>');
 const fetchCall="r=await fetch(url,{credentials:'same-origin',...opt,signal:ctrl.signal,headers:{...(opt.body?{'content-type':'application/json'}:{}),...(opt.headers||{})}})";
 once(fetchCall,"const early=method==='GET'&&url==='/api/customer/equipment-rental/shops'?window.__PB1837ShopsRequest:null;if(early)delete window.__PB1837ShopsRequest;r=await(early||fetch(url,{credentials:'same-origin',...opt,signal:ctrl.signal,headers:{...(opt.body?{'content-type':'application/json'}:{}),...(opt.headers||{})}}));if(!r)throw new Error('shops_request_failed')",'reuse early response with existing API handling');
 once("const [_,d]=await Promise.all([loadPhotographerIdentity(),api('/api/customer/equipment-rental/shops')]);", "void loadPhotographerIdentity().catch(()=>null);\n    const d=await api('/api/customer/equipment-rental/shops');",'list must not wait for header identity');
 once("const msg=(text,ok=false)=>$('#msg').innerHTML=text?`<div class=\"msg ${ok?'ok':''}\">${esc(text)}</div>`:'';", "const msg=(text,ok=false)=>{const markup=text?`<div class=\"msg ${ok?'ok':''}\">${esc(text)}</div>`:'';$('#msg').innerHTML=markup;if(document.body.classList.contains('pbR96ChoosingStore'))storeChooserMessageR1837(text,ok?'success':'error');return markup};",'errors visible on chooser');
 once("function enterStoreChooserR96(panel=''){", "function enterStoreChooserR96(panel=''){storeChooserMessageR1837('');",'clear stale chooser status');
 const start=html.indexOf('function renderStoreChooserR96(){'),end=html.indexOf('function syncStoreChooserTopR100F12()',start);
 if(start<0||end<start)throw Error('R1837 chooser renderer missing');
 let renderer=html.slice(start,end);
 const original='  root.innerHTML=shops.length?';
 if(renderer.split(original).length!==2)throw Error('R1837 chooser markup missing');
 renderer=renderer.replace(original,'  const nextMarkup=shops.length?');
 renderer=renderer.replace('<article class="pbR96StoreCard','<article data-pb1837-shop="${esc(s.id)}" class="pbR96StoreCard');
 const tail=';applyStoreChooserKindR1231();';
 if(renderer.split(tail).length!==2)throw Error('R1837 chooser render completion missing');
 renderer=renderer.replace(tail,";if(root.__pb1837Markup!==nextMarkup){renderStoreChooserMarkupR1837(root,nextMarkup);root.__pb1837Markup=nextMarkup}syncStoreChooserBusyR1837();applyStoreChooserKindR1231();");
 html=html.slice(0,start)+renderer+html.slice(end);
 once('boot();',fs.readFileSync('scripts/r1837-chooser-entry.js','utf8')+'\nboot();','entry feedback before boot');
 for(const script of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)])if(script[1].trim())new Function(script[1]);
 fs.writeFileSync(file,html);
}
// The release uses a hash-pinned Store Windows snapshot. Keep it current.
execFileSync(process.execPath,['scripts/prepare-store-desktop-ui.mjs'],{stdio:'inherit'});
console.log('R1837: faster chooser, stable entry buttons, visible selection progress/errors');

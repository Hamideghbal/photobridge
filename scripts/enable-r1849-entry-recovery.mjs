import fs from 'node:fs';
const index='dist/web/index.html',bundle='dist/web/assets/index-UIRefine-v655-r84.js';
let html=fs.readFileSync(index,'utf8'),app=fs.readFileSync(bundle,'utf8');
function once(text,before,after,label){if(text.split(before).length!==2)throw Error('R1849 missing/ambiguous '+label);return text.replace(before,()=>after)}
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
// HTML is no-store, but these scripts are immutable. Every changed deployment
// must reference a fresh URL rather than mixing new HTML with cached old code.
html=html.replace(/(<script\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,(all,start,src,end)=>{
 const parsed=new URL(src,'https://photobridge.invalid');
 if(!/\/(?:index-UIRefine-v655-r84|photobridge-v904r99-lab-chooser|photobridge-v904r100f37-store-header-core|photobridge-v904r100f40-mobile-polish)\.js$/.test(parsed.pathname))return all;
 parsed.searchParams.set('pbLabEntryRev',revision);
 return start+parsed.pathname+parsed.search+end;
});
const match=html.match(/<script id="pb1847LabEntry">([\s\S]*?)<\/script>/);if(!match)throw Error('R1849 entry head missing');
let entry=match[1];
if(!entry.includes('/* R1849 fail-open handoff */')){
 entry=once(entry,'function remove(){if(done)return;done=true;releaseCover();if(!entry.ordersDelivered)controller.abort();if(window.__PB1847EntryEarly===entry)delete window.__PB1847EntryEarly;', '/* R1849 fail-open handoff */function remove(cancel=false){if(cancel){controller.abort();if(window.__PB1847EntryEarly===entry)delete window.__PB1847EntryEarly}if(done)return;done=true;releaseCover();','handoff retains in-flight data');
 entry=once(entry,'if(entry.ordersDelivered&&header&&scroll?.children.length){requestAnimationFrame(remove);return}', 'if(main&&scroll?.children.length){requestAnimationFrame(()=>remove());return}','workspace readiness does not depend on a new module callback');
 entry=entry.replace("{remove();return}","{remove(true);return}");
 entry=once(entry,"if(document.querySelector('#root .authBg,#root .login')){remove();return}","if(document.querySelector('#root .authBg,#root .login')){remove(true);return}",'login clears pending data');
 entry=once(entry,'const cap=setTimeout(()=>{mount();releaseCover()},2500);',"const cap=setTimeout(()=>{mount();releaseCover();const node=document.getElementById('pb1847EntrySkeleton');if(node){node.dataset.fallback='1';Object.assign(node.style,{position:'relative',inset:'auto',zIndex:'auto',pointerEvents:'none'});const retry=document.createElement('button');retry.textContent='بارگذاری دوباره';retry.style.pointerEvents='auto';retry.onclick=()=>location.reload();node.append(retry)}},2500);",'cap applies to the new skeleton too');
 entry=once(entry,'window.__PB1847EntryEarly=entry;','window.__PB1847EntryEarly=entry;setTimeout(()=>{if(window.__PB1847EntryEarly===entry)delete window.__PB1847EntryEarly},10000);','expire unconsumed data');
 new Function(entry);
 html=html.replace(match[0],'<script id="pb1847LabEntry">'+entry+'</script>');
}
if(!app.includes('PB1849OrdersError')){
 const start=app.indexOf('function Zg('),end=app.indexOf('function ',start+15);let orders=app.slice(start,end);
 orders=once(orders,'const [PB1848Page,','const [PB1849OrdersError,PB1849SetError]=x.useState("");const [PB1848Page,','persistent request error');
 orders=once(orders,'more=more===true;','more=more===true;PB1849SetError("");','retry clears error');
 orders=once(orders,'[PB1848Loading,PB1848SetLoading]=x.useState(false)','[PB1848Loading,PB1848SetLoading]=x.useState(true)','first frame is loading rather than falsely empty');
 orders=once(orders,'.finally(()=>PB1848SetLoading(false))','.catch(error=>{if(De===v.current){PB1849SetError("دریافت سفارش‌ها انجام نشد؛ دوباره تلاش کنید.");if(error.status===401||error.status===403){J.current=[];m([])}}return J.current}).finally(()=>PB1848SetLoading(false))','failure is visible and retryable');
 orders=once(orders,'text:c.length?"سفارشی در این وضعیت نیست.":"هنوز سفارشی ثبت نشده است."','text:PB1849OrdersError?PB1849OrdersError:PB1848Loading?"در حال دریافت سفارش‌ها…":c.length?"سفارشی در این وضعیت نیست.":"هنوز سفارشی ثبت نشده است."','loading is not an empty-list result');
 orders=once(orders,',PB1848Page.hasMore&&',',PB1849OrdersError&&e.jsxs("div",{className:"card pb1849OrdersError",role:"alert",children:[e.jsx("p",{children:PB1849OrdersError}),e.jsx("button",{type:"button",onClick:()=>re(),children:"تلاش دوباره"})]}),PB1848Page.hasMore&&','inline retry instead of a blocking skeleton');
 app=app.slice(0,start)+orders+app.slice(end);
}
app=app.replaceAll('window.__PB1847EntryUI?.remove()','window.__PB1847EntryUI?.remove(true)');
if(!html.includes('id="pb1849RecoveryStyle"'))html=html.replace('</head>','<style id="pb1849RecoveryStyle">.pb1849OrdersError{padding:18px!important;margin-bottom:96px!important}.pb1849OrdersError button{display:block;margin:12px auto 0!important;min-width:140px;position:relative}</style></head>');
fs.writeFileSync(index,html);fs.writeFileSync(bundle,app);
console.log('R1849: fresh immutable script URLs, nonblocking entry handoff, bounded skeleton and retryable orders');

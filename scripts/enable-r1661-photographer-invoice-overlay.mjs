import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {withInvoiceServiceWorkerRevision} from './r1661-sw-registration.mjs';
const root='dist/web';
function one(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw Error('R1661 '+label+' count '+n);return s.replace(a,b)}
const hooks="/* PB1661 customer invoice overlay */\nconst[pb1661Invoice,pb1661SetInvoice]=x.useState(null),[pb1661Busy,pb1661SetBusy]=x.useState(false),[pb1661Error,pb1661SetError]=x.useState(\"\"),pb1661Sequence=x.useRef(0);\nx.useEffect(()=>{\n let alive=true;\n const open=async event=>{\n  const id=String(event?.detail?.invoiceId||\"\").trim();\n  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return;\n  const seq=++pb1661Sequence.current;\n  pb1661SetError(\"\");pb1661SetInvoice(null);pb1661SetBusy(true);\n  try{\n   const result=await Me(\"/api/customer/invoices\");\n   const invoice=(result?.invoices||[]).find(v=>String(v.id)===id&&![\"discount\",\"correction\"].includes(String(v.document_type||\"\")));\n   if(!invoice)throw Error(\"not_found\");\n   if(alive&&seq===pb1661Sequence.current)pb1661SetInvoice(invoice);\n  }catch{if(alive&&seq===pb1661Sequence.current)pb1661SetError(\"دریافت فاکتور انجام نشد. اتصال یا دسترسی را بررسی کنید.\");}\n  finally{if(alive&&seq===pb1661Sequence.current)pb1661SetBusy(false);}\n };\n window.addEventListener(\"pb1661-invoice-open\",open);\n const q=new URLSearchParams(location.search);\n const id=q.get(\"pbInvoice\")||(location.pathname===\"/photographer/finance/invoices\"?q.get(\"invoice\"):null);\n if(id){\n  const u=new URL(location.href);u.searchParams.delete(\"pbInvoice\");u.searchParams.delete(\"invoice\");\n  history.replaceState(history.state,\"\",u.pathname+u.search+u.hash);\n  void open({detail:{invoiceId:id}});\n }\n return()=>{alive=false;pb1661Sequence.current++;window.removeEventListener(\"pb1661-invoice-open\",open)};\n},[]);\n";
const footer="e.jsxs(\"footer\",{className:\"productFooter\",children:[\"Powered by \",e.jsx(\"b\",{children:\"PhotoBridge\"})]})]})]})}";
const newFooter="e.jsxs(\"footer\",{className:\"productFooter\",children:[\"Powered by \",e.jsx(\"b\",{children:\"PhotoBridge\"})]}),pb1661Invoice&&e.jsx(Oc,{role:\"customer\",invoice:pb1661Invoice,onClose:()=>{pb1661Sequence.current++;pb1661SetInvoice(null)}}),pb1661Busy&&e.jsx(On,{title:\"فاکتور\",onClose:()=>{pb1661Sequence.current++;pb1661SetBusy(false)},children:e.jsx(\"div\",{className:\"loadingBox\",children:\"در حال دریافت فاکتور…\"})}),pb1661Error&&e.jsx(On,{title:\"فاکتور\",onClose:()=>pb1661SetError(\"\"),children:e.jsx(\"div\",{className:\"alert error\",children:pb1661Error})})]})]})}";
const pcOld="e.jsx(\"small\",{children:Zn(C.created_at)})]})]},C.id))";
const pcNew="e.jsx(\"small\",{children:Zn(C.created_at)}),t===\"customer\"&&[\"invoice_ready\",\"invoice_pricing_ready\"].includes(C.event_key)&&C.metadata?.invoiceId&&e.jsx(\"button\",{type:\"button\",className:\"pb1661NotificationInvoiceButton\",onClick:()=>{o(!1);window.dispatchEvent(new CustomEvent(\"pb1661-invoice-open\",{detail:{invoiceId:String(C.metadata.invoiceId)}}))},children:\"مشاهده فاکتور\"})]})]},C.id))";
const pushHelpers="function pb1661InvoiceId(payload){\n if(![\"invoice_ready\",\"invoice_pricing_ready\"].includes(String(payload?.event||\"\")))return \"\";\n let id=String(payload?.metadata?.invoiceId||payload?.metadata?.invoice_id||\"\");\n if(!id)try{id=new URL(String(payload?.url||\"\"),location.origin).searchParams.get(\"invoice\")||\"\"}catch{}\n return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)?id:\"\";\n}\nfunction pb1661OpenInvoice(payload){\n const id=role()===\"customer\"?pb1661InvoiceId(payload):\"\";\n if(!id)return false;\n window.dispatchEvent(new CustomEvent(\"pb1661-invoice-open\",{detail:{invoiceId:id}}));\n if(payload?.notificationId)void api(\"/api/customer/notifications/read\",{\n  method:\"POST\",body:JSON.stringify({ids:[payload.notificationId]})\n }).then(()=>window.dispatchEvent(new CustomEvent(\"photobridge-notifications-read-customer\"))).catch(()=>{});\n return true;\n}\n";
const pushMessage="navigator.serviceWorker?.addEventListener?.('message',event=>{\n const data=event?.data;\n if(data?.type!=='PB1661_OPEN_INVOICE')return;\n pb1661OpenInvoice({event:'invoice_ready',metadata:{invoiceId:data.invoiceId},notificationId:data.notificationId});\n});\n";
const swClick="/* R1661: invoice push focuses the open Photographer without navigating. */\nself.addEventListener('notificationclick',event=>{\n event.notification.close();\n const data=event.notification?.data||{},meta=data.metadata||{};\n let invoiceId=String(meta.invoiceId||meta.invoice_id||'');\n if(!invoiceId)try{invoiceId=new URL(String(data.url||''),self.location.origin).searchParams.get('invoice')||''}catch{}\n const isInvoice=['invoice_ready','invoice_pricing_ready'].includes(String(data.event||''))&&\n  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId);\n const notificationId=data.notificationId||null;\n const target=pb780Target(data.url||'/',notificationId);\n event.waitUntil((async()=>{\n  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});\n  if(isInvoice){\n   const found=windows.filter(client=>{\n    try{const path=new URL(client.url).pathname;return /^\\/photographer(?:\\/|$)/.test(path)&&\n      !/^\\/photographer\\/(?:login|signup|register|invite)(?:\\/|$)/.test(path)}catch{return false}\n   });\n   const client=found.find(c=>c.visibilityState==='visible')||found[0];\n   if(client)try{\n    await client.focus();\n    client.postMessage({type:'PB1661_OPEN_INVOICE',invoiceId,notificationId});\n    return;\n   }catch{}\n   if(self.clients.openWindow){\n    const query=new URLSearchParams({pbInvoice:invoiceId});\n    if(notificationId)query.set('pbNotification',String(notificationId));\n    await self.clients.openWindow('/photographer/gallery?'+query);\n   }\n   return;\n  }\n  for(const client of windows)try{\n   if('focus' in client){\n    await client.focus();if('navigate' in client)await client.navigate(target);return;\n   }\n  }catch{}\n  if(self.clients.openWindow)await self.clients.openWindow(target);\n })());\n});\n";
const bundlePath=root+'/assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(bundlePath,'utf8');
const hfStart=js.indexOf('function Hf({me:t,onLogout:a,testMode:s}){'),hfEnd=hfStart>=0?js.indexOf('function ',hfStart+12):-1;
if(hfStart<0||hfEnd<=hfStart||hfEnd-hfStart>50000)throw Error('R1661 photographer Hf boundary');
let hf=js.slice(hfStart,hfEnd);
hf=one(hf,'if(x.useEffect(()=>{De(),pt()},[])',hooks+'if(x.useEffect(()=>{De(),pt()},[])','photographer hooks');
hf=one(hf,footer,newFooter,'photographer footer');
js=js.slice(0,hfStart)+hf+js.slice(hfEnd);
const pcStart=js.indexOf('function Pc({scope:t,version:a=0,mobile:s=!1}){'),pcEnd=pcStart>=0?js.indexOf('function ',pcStart+12):-1;
if(pcStart<0||pcEnd<=pcStart||pcEnd-pcStart>12000)throw Error('R1661 notification Pc boundary');
let pc=js.slice(pcStart,pcEnd);pc=one(pc,pcOld,pcNew,'notification button');js=js.slice(0,pcStart)+pc+js.slice(pcEnd);
js+='\n/* PB1661 invoice overlay installed */\n';fs.writeFileSync(bundlePath,js);
execFileSync(process.execPath,['--check',bundlePath],{stdio:'inherit'});
const pushPath=root+'/photobridge-push-v728.js';let push=fs.readFileSync(pushPath,'utf8');
push=one(push,'  function showToast(payload){',pushHelpers+'  function showToast(payload){','foreground helpers');
push=one(push,'const open=()=>location.assign(targetWithId(payload));',
 'const open=()=>{if(pb1661OpenInvoice(payload))el.remove();else location.assign(targetWithId(payload))};','push click');
push=one(push,"  navigator.serviceWorker?.addEventListener?.('message',e=>{if(e?.data?.type!=='PB_PUSH_FOREGROUND')",
 pushMessage+"  navigator.serviceWorker?.addEventListener?.('message',e=>{if(e?.data?.type!=='PB_PUSH_FOREGROUND')",'worker message');
push=withInvoiceServiceWorkerRevision(push);
fs.writeFileSync(pushPath,push);execFileSync(process.execPath,['--check',pushPath],{stdio:'inherit'});
const workerPath=root+'/photobridge-sw-v710.js';let worker=fs.readFileSync(workerPath,'utf8');
const clickAt=worker.indexOf("self.addEventListener('notificationclick',event=>{");
if(clickAt<0||!worker.slice(clickAt).includes('await client.navigate(target)'))throw Error('R1661 SW click anchor');
worker=worker.slice(0,clickAt)+swClick;
const swVersion=/^const VERSION\s*=\s*(['"])[^'"\r\n]+\1\s*;/gm;
const versions=[...worker.matchAll(swVersion)];
// The worker script can have a generated VERSION expression or an inlined
// identifier after earlier build stages. Its cache revision is optional:
// the service-worker registration URL below is independently cache-busted.
// Never block a release just because an existing worker omits this constant.
if(versions.length===1)worker=worker.replace(swVersion,"const VERSION='photobridge-pwa-v1661';");
else console.log('[R1661] SW VERSION declaration count='+versions.length+'; keeping generated worker version (URL cache-busted)');
fs.writeFileSync(workerPath,worker);execFileSync(process.execPath,['--check',workerPath],{stdio:'inherit'});
const cssFile='photobridge-r1661-invoice-notification.css';fs.copyFileSync('scripts/r1661-invoice-notification.css',root+'/'+cssFile);
const htmlPath=root+'/index.html';let html=fs.readFileSync(htmlPath,'utf8');
if(!html.includes('</head>')||html.includes('/'+cssFile+'?'))throw Error('R1661 stylesheet duplicate');
html=html.replace('</head>','<link rel="stylesheet" href="/'+cssFile+'?v=r1661">\n</head>');
let bundles=0,pushes=0;
html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,u=>{bundles++;return u+'&invoiceOverlay=r1661'});
html=html.replace(/photobridge-push-v728\.js\?[^"']*/g,u=>{pushes++;return u+'&invoiceOverlay=r1661'});
if(bundles!==1||pushes!==1)throw Error('R1661 asset URLs '+bundles+' '+pushes);
fs.writeFileSync(htmlPath,html);
console.log('[R1661] Photographer invoice notifications open the existing preview without navigation.');

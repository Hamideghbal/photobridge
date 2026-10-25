import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1445 verified download repair */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1445 anchor '+a.slice(0,100));ui=ui.replace(a,b)};
 const replaceFunction=(start,end,body)=>{const a=ui.indexOf(start),b=ui.indexOf(end,a+start.length);if(a<0||b<0)throw Error('R1445 function anchor '+start);ui=ui.slice(0,a)+body+ui.slice(b)};
 replaceFunction('async function $y(','function Tg(', 'async function $y(t,a,s,r){return pb1445WriteDownload(t,a,s,r)}');
 replaceFunction('async function Qy(','async function Dg(', 'async function Qy(t,a,s){return pb1445DownloadFile(t,a,s)}');
 // A whole-order preflight blocks repairing file B if file A is already safely local
 // but its cloud copy has expired. Ky validates device, payment and each missing file.
 const ds=ui.indexOf('async function Dg('),de=ui.indexOf('async function Zy(',ds);
 if(ds<0||de<0)throw Error('R1445 resume function');
 let download=ui.slice(ds,de);
 const preflight=/await Me\(`\/api\/lab\/orders\/\$\{t\.order\.id\}\/download-check`\)(?:\.then\(preflight=>\{[\s\S]*?\}\))?;/;
 if(!preflight.test(download))throw Error('R1445 preflight anchor');
 download=download.replace(preflight,'void 0;');
 download=download.replace('const g=performance.now();','hr(t.order.id,{localComplete:!1,lastError:null});const g=performance.now();');
 download=download.replace('const C={startedAt:m,done:h,','const C={localComplete:!1,startedAt:m,done:h,');
 ui=ui.slice(0,ds)+download+ui.slice(de);
 // Retry must never regress printing/ready/completed status or create another invoice.
 once('try{o==="album"?(await Me(`/api/lab/orders/${le.id}/album-download-complete`',
 'try{if(!G.order.downloaded_at&&!["downloaded","printing","reviewing","ready_print","printed","ready","completed"].includes(String(G.order.status||"")))o==="album"?(await Me(`/api/lab/orders/${le.id}/album-download-complete`');
 const ws=ui.indexOf(',W=async K=>{if(!ai())return null;'),we=ui.indexOf(',O=async(K,fe,be,Z)=>',ws);
 if(ws<0||we<0)throw Error('R1445 archive reader');
 ui=ui.slice(0,ws)+',W=async K=>pb1445ReadArchive(K,value=>S(value))'+ui.slice(we);
 once('className:"labFilesDetailActions",children:[',
 'className:"labFilesDetailActions",children:[e.jsx("button",{type:"button",className:"pbActionButton compact pb1445RepairDownload",disabled:!!E||y.order.status==="cancelled",onClick:()=>Vn(y.order),children:E===y.order.id?"در حال بررسی و دریافت…":"بررسی و تکمیل دانلود"}),');
 once('qt&&e.jsxs("div",{className:"downloadResumeInline"',
 '(le.downloaded_at||["downloaded","printing","reviewing","ready_print","printed","ready","completed"].includes(String(le.status||"")))&&e.jsx("button",{type:"button",className:"pb1445RepairDownload",disabled:!!E,onClick:()=>Vn(le),children:E===le.id?"در حال بررسی و دریافت…":"بررسی و تکمیل دانلود"}),qt&&e.jsxs("div",{className:"downloadResumeInline"');
 once('برنامه دیگر در این حالت سراغ فضای ابری نمی‌رود.','نسخه کامل این فایل‌ها روی سرور هم در دسترس نبود؛ اصل فایل‌ها باید دوباره از عکاس دریافت شود.');
 once('const Z=await Dg(K,(Ce,Se,Fe)=>S({done:Ce,total:Se,current:Fe}));','const Z=await Dg(K,value=>S(value));');
 ui+='\n/* PB1445 verified download repair */\n'+fs.readFileSync('scripts/r1445-download-safety.js','utf8');
 fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&downloadRepair=')?url:url+'&downloadRepair=r1445');
fs.writeFileSync('dist/web/index.html',html);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

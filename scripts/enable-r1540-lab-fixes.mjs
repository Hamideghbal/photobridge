import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,v)=>fs.writeFileSync(p,v);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const replace=(s,a,b,name)=>{if(s.split(a).length!==2)throw Error('R1540 '+name+' changed');return s.replace(a,b)};
let s=read(bundle);
// The customer-free section is independent of the category navigation. A failed
// walk-in API response or render must not unmount/block the entire settings menu.
s=replace(s,'g==="walkin"&&e.jsx(Qj,{})', 'g==="walkin"&&e.jsx(PB1540WalkinBoundary,{key:g,children:e.jsx(Qj,{})})','settings walk-in error boundary');
const walkStart=s.indexOf('function Qj('),walkEnd=s.indexOf('function ',walkStart+12);
if(walkStart<0||walkEnd<=walkStart)throw Error('R1540 free-customer component absent');
let walk=s.slice(walkStart,walkEnd);
walk=replace(walk,'[c,m]=x.useState(void 0),g=()=>Me("/api/lab/walkin").then(I=>{a(I),r((I.prices||[]).map(T=>({...T})))})',
 '[c,m]=x.useState(void 0),[pb1540Error,pb1540SetError]=x.useState(""),g=()=>Me("/api/lab/walkin").then(I=>{if(!I||!I.lab)throw Error("walkin_data_incomplete");pb1540SetError("");a(I);r((I.prices||[]).map(T=>({...T})))}).catch(err=>{pb1540SetError("دریافت تنظیمات مشتری آزاد انجام نشد؛ اینترنت یا اتصال لابراتوار را بررسی کنید.");console.warn("[PhotoBridge] walk-in settings request failed",err)})', 'walk-in API recovery');
walk=replace(walk,'if(x.useEffect(()=>{g()},[]),!t)return e.jsx("section",{className:"card panel compactPanel",children:e.jsx("div",{className:"loadingBox",children:"در حال آماده‌سازی لینک مشتری آزاد…"})});',
 'if(x.useEffect(()=>{g()},[]),!t)return e.jsxs("section",{className:"card panel compactPanel pb1540WalkinFallback",children:[e.jsx("div",{className:"loadingBox",role:"status",children:pb1540Error||"در حال آماده‌سازی لینک مشتری آزاد…"}),pb1540Error&&e.jsx("button",{type:"button",onClick:g,children:"تلاش دوباره"})]});', 'walk-in retry');
s=s.slice(0,walkStart)+walk+s.slice(walkEnd);
const archiveConfirm='if(!await Vs(t))return alert("اجازه حذف فایل‌های قدیمی داده نشده است.");';
s=replace(s,archiveConfirm,'if(!await pb1540CleanupConfirm())return;'+archiveConfirm,'local archive confirmation');
s+='\n/* PB1540 Windows lab independent walk-in navigation and archive cleanup */\n'+read('scripts/r1540-walkin-cleanup.js.txt')+'\n';
write(bundle,s);
// Show the amount on the exact editable opening-debt button so no one has to
// enter the form to verify the current value. Existing invoice locks stay intact.
const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=read(intakeFile);
intake=replace(intake,"const toggle=node('button','اصلاح بدهی اولیه','pb1294Edit');", "const toggle=node('button','اصلاح بدهی اولیه · '+money(data.initialDebt),'pb1294Edit');",'opening debt button');
write(intakeFile,intake);
// UI cache busts for both browser and the independently frozen Windows snapshot.
const htmlFile='dist/web/index.html';let html=read(htmlFile);
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&labR1540=')?u:u+'&labR1540=r1540');
html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"']*)/g,u=>u.includes('&openingDebt=')?u:u+'&openingDebt=r1540');
if(!html.includes('photobridge-r1540-lab-fixes.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1540-lab-fixes.css?v=r1540"></head>');
write(htmlFile,html);
// Update the immutable Windows UI manifest rather than requiring a new installer.
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
if(!fs.existsSync(manifestPath))throw Error('R1540 Windows Lab UI package missing');
const manifest=JSON.parse(read(manifestPath));
if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))throw Error('R1540 wrong native package');
function addOrReplace(name,source){
 const dest=path.join(native,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
 const sha256=hash(fs.readFileSync(dest));let entry=manifest.files.find(f=>f.name===name);
 if(entry){if(entry.url!=='/lab-desktop-ui/'+name)throw Error('R1540 invalid Windows asset URL: '+name);entry.sha256=sha256}
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
addOrReplace('assets/index-UIRefine-v655-r84.js',bundle);
addOrReplace('photobridge-r1137-lab-local-intake.js',intakeFile);
addOrReplace('photobridge-r1539-print-catalog.css','dist/web/photobridge-r1539-print-catalog.css');
addOrReplace('photobridge-r1540-lab-fixes.css','dist/web/photobridge-r1540-lab-fixes.css');
let nativeHtml=read(native+'/index.html');
nativeHtml=nativeHtml.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&labR1540=')?u:u+'&labR1540=r1540');
nativeHtml=nativeHtml.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"']*)/g,u=>u.includes('&openingDebt=')?u:u+'&openingDebt=r1540');
for(const [file,version] of [['photobridge-r1539-print-catalog.css','r1539'],['photobridge-r1540-lab-fixes.css','r1540']]){
 if(!nativeHtml.includes(file))nativeHtml=nativeHtml.replace('</head>',`<link rel="stylesheet" href="/${file}?v=${version}"></head>`);
}
write(native+'/index.html',nativeHtml);
const entry=manifest.files.find(f=>f.name==='index.html');if(!entry)throw Error('R1540 native index absent');entry.sha256=hash(fs.readFileSync(native+'/index.html'));
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(Buffer.from(JSON.stringify(manifest.files)));
manifest.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(manifest));
console.log('[PhotoBridge R1540] browser and Windows Lab UI updated',manifest.build.slice(0,12));

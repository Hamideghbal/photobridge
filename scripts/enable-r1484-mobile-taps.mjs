import fs from 'node:fs';
const root='dist/web/',asset=root+'assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(asset,'utf8');
if(!ui.includes('/* PB1484 explicit phone taps */')){
 const once=(old,next)=>{if(ui.split(old).length!==2)throw Error('R1484 missing/ambiguous anchor: '+old.slice(0,70));ui=ui.replace(old,next)};
 once("onClick:Jt=>{if(pb1483Phone()&&Jt.target.closest('.labActionTimeline'))return;",'onClick:Jt=>{if(pb1483Phone())return;');
 once('disabled:!Bt||!!E||(pb1483Phone()&&(Jt.key==="download"||Jt.key==="download_print")),onClick:event=>{if(pb1483Phone())event.stopPropagation();return aa(le,Jt.key)}',`disabled:!!E||(!pb1483Phone()&&!Bt),onClick:event=>{if(pb1483Phone()){event.stopPropagation();if(Jt.key==="download"||Jt.key==="download_print"){alert("دانلود فایل‌ها فقط روی سیستم اصلی لابراتوار انجام می‌شود؛ این دکمه در موبایل پوشه‌ای باز نمی‌کند.");return}if(!Bt){alert("این مرحله هنوز قابل ثبت نیست؛ ابتدا مرحله قبلی سفارش را روی سیستم اصلی تکمیل کنید.");return}}return aa(le,Jt.key)}`);
 once('const ai=()=>typeof window.showDirectoryPicker=="function"','const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"');
 once('async function no(){','async function no(){if(pb1483Phone())throw Error("دانلود و انتخاب پوشه فقط روی سیستم اصلی لابراتوار انجام می‌شود.");');
 ui+='\n/* PB1484 explicit phone taps */\n';fs.writeFileSync(asset,ui);
}
fs.copyFileSync('scripts/r1484-mobile-taps.css',root+'photobridge-r1484-mobile-taps.css');
let html=fs.readFileSync(root+'index.html','utf8');const tag='<link rel="stylesheet" href="/photobridge-r1484-mobile-taps.css?v=r1484">';if(!html.includes(tag))html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(root+'index.html',html);

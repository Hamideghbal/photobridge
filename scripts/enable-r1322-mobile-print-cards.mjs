import fs from 'node:fs';
import path from 'node:path';
const asset='photobridge-r1322-mobile-print-cards.css';
const bundle='index-UIRefine-v655-r84.js';
function patchLabels(file){
 let source=fs.readFileSync(file,'utf8');
 if(source.includes('pb1323ShortStageLabel'))return;
 const before='e.jsx("b",{children:ot.label})';
 if(source.split(before).length!==2)throw Error('[R1323] Print stage label anchor changed: '+file);
 const after='e.jsxs("b",{children:[e.jsx("span",{className:"pb1323FullStageLabel",children:ot.label}),e.jsx("span",{className:"pb1323ShortStageLabel",hidden:!0,"aria-hidden":!0,children:({sent:"ارسال",downloaded:"دریافت",printing:"چاپ",ready:"آماده",completed:"تحویل"})[ot.key]||ot.label})]})';
 fs.writeFileSync(file,source.replace(before,after));
}
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){walk(file);continue;}
  if(entry.name===bundle){patchLabels(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('photobridge-r1126-desktop-navigation.js'))continue;
  const prefix=html.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';
  html=html.replace(/(photobridge-r1106-mobile-store-panel\.js)([^"'<>\s]*)/g,(_,name,q)=>name+q.replace(/[?&]cards=[^&]*/g,'')+(q.includes('?')?'&':'?')+'cards=r1322');
  html=html.replace(/(index-UIRefine-v655-r84\.js)([^"'<>\s]*)/g,(_,name,q)=>{const clean=q.replace(/[?&]printCards=[^&]*/g,'');return name+clean+(clean.includes('?')?'&':'?')+'printCards=r1323';});
  html=html.replace(/(photobridge-r1322-mobile-print-cards\.css)\?v=r\d+/g,'$1?v=r1323');
  if(!html.includes(asset))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}${asset}?v=r1323"></head>`);
  fs.writeFileSync(file,html);
  if(prefix==='./'||prefix==='')for(const name of [asset,'photobridge-r1106-mobile-store-panel.js']){
   const dest=path.join(dir,name);if(path.resolve(dest)!==path.resolve('dist/web/'+name))fs.copyFileSync('dist/web/'+name,dest);
  }
 }
}
walk('dist/web');walk('dist/api');
console.log('[R1323] Refined mobile Print cards with short single-line stage labels.');

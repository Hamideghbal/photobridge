import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=fs.readFileSync(file,'utf8');
const mark='/* PB1363 single order alarm owner */';
if(!bundle.includes(mark)){
 const replace=(before,after)=>{if(bundle.split(before).length!==2)throw Error('R1363 missing/ambiguous alarm anchor: '+before);bundle=bundle.replace(before,after)};
 replace('function Af(t){try{','function Af(t){'+mark+'if(window.__PB_NATIVE_ORDER_ALERTS__===true||document.querySelector(".labRoleWorkspace"))return;try{');
 replace('function xc(){if(Ng())','function xc(){if(window.__PB_NATIVE_ORDER_ALERTS__===true)return;if(Ng())');
 replace('function E0({alarm:t,onOpen:a,onAcknowledge:s}){if(!t)return null;', 'function E0({alarm:t,onOpen:a,onAcknowledge:s}){if(!t||window.__PB_NATIVE_ORDER_ALERTS__===true)return null;');
 const event='Ze(pe),v(pe),xc(),Af(pe)';
 if(bundle.split(event).length!==3)throw Error('R1363 expected both print/album order events');
 bundle=bundle.replaceAll(event,'Ze(pe),window.__PB_NATIVE_ORDER_ALERTS__===true||(v(pe),xc(),Af(pe))');
 fs.writeFileSync(file,bundle);
}
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');
if(!html.includes('photobridge-r1363-lab-queue.js'))html=html.replace(/<head(?:\s[^>]*)?>/i,head=>head+'\n<script src="/photobridge-r1363-lab-queue.js?v=r1363"></script>');
if(!html.includes('photobridge-r1363-lab-queue.css'))html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/photobridge-r1363-lab-queue.css?v=r1363">\n</head>');
for(const name of ['js','css'])if(!fs.existsSync('dist/web/photobridge-r1363-lab-queue.'+name))throw Error('R1363 asset missing: '+name);
fs.writeFileSync(page,html);
console.log('R1363: single order alarm owner; print/album viewport below secondary header with visible scrollbar and no retired sidebar reservation.');

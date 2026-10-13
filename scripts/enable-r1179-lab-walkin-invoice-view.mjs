import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let src=fs.readFileSync(path,'utf8');
if(!src.includes('PB1179 show ready invoice')){
 function one(old,next){
  const n=src.split(old).length-1;
  if(n!==1)throw Error('R1179 cannot safely patch '+n+' occurrences: '+old.slice(0,100));
  src=src.replace(old,next);
 }
 // Print order: the existing preview action fetches the fully issued invoice,
 // including its priced rows. Do not open a proforma or issue any invoice here.
 const printDone='await ye().catch(()=>{});P(\`سفارش #\${V(le.number)} آماده تحویل شد · فاکتور #\${V(Zt.invoice.number)} صادر شد\`),Mt&&alert(';
 one(printDone,
  'await ye().catch(()=>{});/* PB1179 show ready invoice */await Qn(Zt.invoice.id,{...Zt.invoice,customer_name:le.customer_name,order_number:le.number,lab_name:t.name});P(\`سفارش #\${V(le.number)} آماده تحویل شد · فاکتور #\${V(Zt.invoice.number)} صادر شد\`),Mt&&alert(');
 // Even if PDF creation/upload failed after the invoice was committed, show the
 // committed invoice for review. No duplicate invoice or second ready request.
 const failedPrint='xt&&qt&&await Gt(le,"ready").catch(()=>{}),alert(xt?';
 one(failedPrint,
  'xt&&qt&&await Gt(le,"ready").catch(()=>{}),xt&&await Qn(xt.id,{...xt,customer_name:le.customer_name,order_number:le.number,lab_name:t.name}),alert(xt?');
 // Album ready transition uses its existing issued invoice as well.
 const albumDone='await ye().catch(()=>{});}nt!=="ready"';
 one(albumDone,
  'await ye().catch(()=>{});/* PB1179 show ready invoice */await Qn(Zt.invoice.id,{...Zt.invoice,customer_name:le.customer_name,order_number:le.number,lab_name:t.name});}nt!=="ready"');
 const failedAlbum='nt==="ready"&&qt&&await Gt(le,"ready").catch(()=>{}),alert(';
 one(failedAlbum,
  'nt==="ready"&&qt&&await Gt(le,"ready").catch(()=>{}),nt==="ready"&&xt&&await Qn(xt.id,{...xt,customer_name:le.customer_name,order_number:le.number,lab_name:t.name}),alert(');
 fs.writeFileSync(path,src);
}
const htmlPath='dist/web/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/(photobridge-r1137-lab-local-intake\.(?:css|js)\?v=)[^"']+/g,'$1r1179');
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,s=>s.includes('ready=r1179')?s:s+'&ready=r1179');
const tag='<link rel="stylesheet" href="/photobridge-r1179-lab-order-actions.css?v=r1179">';
if(!html.includes(tag))html=html.replace('</head>',tag+'\n</head>');
fs.writeFileSync(htmlPath,html);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/web/photobridge-r1137-lab-local-intake.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1179-lab-walkin-compact-and-ready-invoice.cjs'],{stdio:'inherit'});

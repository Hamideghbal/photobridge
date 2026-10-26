import fs from 'node:fs';
const root='dist/web/',asset=root+'assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(asset,'utf8');
if(!ui.includes('/* PB1483 phone remote stages */')){
 const mark='async function pb1450AllowStage(order) {';
 if(ui.split(mark).length!==2)throw Error('R1483 missing stage guard anchor');
 ui=ui.replace(mark,fs.readFileSync('scripts/r1483-mobile-stage.js','utf8')+'\n/* PB1483 phone remote stages */\n'+mark+'\n  if(pb1483Phone())return pb1483AllowRemoteStage(order);');
 const action='disabled:!Bt||!!E,onClick:()=>aa(le,Jt.key)';
 if(ui.split(action).length!==2)throw Error('R1483 timeline action anchor');
 ui=ui.replace(action,'disabled:!Bt||!!E||(pb1483Phone()&&(Jt.key==="download"||Jt.key==="download_print")),onClick:event=>{if(pb1483Phone())event.stopPropagation();return aa(le,Jt.key)}');
 const state='xe=en(le,Jt.key),Qe=Bt,rt=';
 if(ui.split(state).length!==2)throw Error('R1483 timeline current-state anchor');
 ui=ui.replace(state,'xe=en(le,Jt.key),Qe=Bt&&!(pb1483Phone()&&(Jt.key==="download"||Jt.key==="download_print")),rt=');
 const card="onClick:Jt=>{Jt.target.closest('button,a,input,textarea,select,label,[role=\"button\"]')||Tt(le)}";
 if(ui.split(card).length!==2)throw Error('R1483 card click anchor');
 ui=ui.replace(card,"onClick:Jt=>{if(pb1483Phone()&&Jt.target.closest('.labActionTimeline'))return;Jt.target.closest('button,a,input,textarea,select,label,[role=\"button\"]')||Tt(le)}");
 fs.writeFileSync(asset,ui);
}
for(const ext of ['js','css'])fs.copyFileSync('scripts/r1483-lab-mobile.'+ext,root+'photobridge-r1483-lab-mobile.'+ext);
let html=fs.readFileSync(root+'index.html','utf8');
const tags='<link rel="stylesheet" href="/photobridge-r1483-lab-mobile.css?v=r1483">\n<script defer src="/photobridge-r1483-lab-mobile.js?v=r1483"></script>';
if(!html.includes('src="/photobridge-r1483-lab-mobile.js'))html=html.replace('</head>',tags+'\n</head>');
fs.writeFileSync(root+'index.html',html);

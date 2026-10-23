import fs from 'node:fs';
const header='dist/web/photobridge-r1147-lab-admin-header.js';let h=fs.readFileSync(header,'utf8');
if(!h.includes('/* PB1372 finance context */')){
 const before="document.querySelector('.financeSectionTabs')";
 if(h.split(before).length!==2)throw Error('R1372 changed secondary source');
 h=h.replace(before,"(document.querySelector('.financeSectionTabs')?pb1372FinanceContext():null)");
 h=h.replace('function secondary(h){',`/* PB1372 finance context */
function pb1372FinanceContext(){
 let source=document.querySelector('.pb1372FinanceContext');if(source)return source;
 source=document.createElement('div');source.className='pb1372FinanceContext';source.hidden=true;
 for(const [label,active] of [['امور مالی',true],['تعرفه‌ها',false]]){const button=document.createElement('button');button.type='button';button.textContent=label;if(active)button.className='active';button.onclick=()=>active?document.querySelector('.labSingleHeader .labFinanceHeaderBtn')?.click():navigate('/lab/settings/prices');source.append(button)}
 document.querySelector('.labRoleWorkspace main').append(source);return source;
}
function secondary(h){
 if(!document.querySelector('.financeSectionTabs'))document.querySelector('.pb1372FinanceContext')?.remove();`);
 fs.writeFileSync(header,h);
}
const queue='dist/web/photobridge-r1363-lab-queue.js';let q=fs.readFileSync(queue,'utf8');
if(!q.includes('.pb1372ThirdHeader')){const before=".labSingleHeader,.pb1148SecondaryHeader,.pb1151PrintModes";if(!q.includes(before))throw Error('R1372 changed scroll header measurement');q=q.replace(before,before+',.pb1372ThirdHeader');fs.writeFileSync(queue,q)}
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');
for(const name of ['photobridge-r1147-lab-admin-header.js','photobridge-r1363-lab-queue.js'])html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?[^"\']*)','g'),u=>u.replace(/&thirdHeader=[^&"']*/g,'')+'&thirdHeader=r1372');
if(!html.includes('/photobridge-r1372-third-header.js'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1372-third-header.css?v=r1372">\n<script defer src="/photobridge-r1372-third-header.js?v=r1372"></script>\n</head>');
fs.writeFileSync(file,html);

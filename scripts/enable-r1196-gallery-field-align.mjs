import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// The gallery creation form is React-owned. Wrap each caption and its
// required/optional label in a single span BEFORE the input. This avoids
// CSS grid treating the badge as an extra row and shifting the input down.
// Validation stays unchanged: title and customer name required; mobile can
// be blank (the server validates it if supplied).
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let code=fs.readFileSync(file,'utf8');
const start=code.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید",dialogClassName:"pb1112CreateDialog"');
if(start<0)throw Error('[R1196] gallery create modal not found');
const end=code.indexOf('function PBClientGalleryCompare(',start);
if(end<start)throw Error('[R1196] gallery create render end not found');
let modal=code.slice(start,end);
const labels=[
 ['عنوان پروژه','h.title','اجباری'],
 ['نام مشتری','h.customerName','اجباری'],
 ['موبایل مشتری','h.customerMobile','اختیاری']
];
for(const [name,key,badge] of labels){
 const before='e.jsxs("label",{children:["'+name+'",e.jsx("input",{';
 const after='e.jsxs("label",{children:[e.jsxs("span",{className:"pb1196FieldCaption",children:["'+name+'",e.jsx("small",{"aria-hidden":!0,children:"'+badge+'"})]}),e.jsx("input",{';
 // Later gallery revisions attach stable field classes and captions before
 // R1196 runs. The actual caption/badge structure is already present there.
 const modern=modal.includes('className:"pb1196FieldCaption",children:["'+name+'"');
 if(modern){
  if(!modal.includes('value:'+key))throw Error('[R1196] input state missing '+name);
  continue;
 }
 if(modal.includes(after)){
  if(!modal.includes('value:'+key))throw Error('[R1196] input state missing '+name);
  continue;
 }
 if(modal.split(before).length!==2)throw Error('[R1196] expected exactly one label for '+name);
 // Never change the input value/onChange or the submission validation.
 modal=modal.replace(before,after);
 if(!modal.includes('value:'+key))throw Error('[R1196] input state missing '+name);
}
if(!modal.includes('headerExtra:e.jsxs("div",{className:"clientGalleryCreateBilling"'))
 throw Error('[R1196] R1195 moved header billing summary missing');
code=code.slice(0,start)+modal+code.slice(end);
fs.writeFileSync(file,code);
const index='dist/web/index.html';
let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1196-gallery-field-align.css?v=r1196">';
if(!html.includes(tag)){
 if(html.includes('photobridge-r1196-gallery-field-align.css'))throw Error('[R1196] stale gallery CSS');
 html=html.replace('</body>',tag+'\n</body>');
}
const rx=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...html.matchAll(rx)].length!==1)throw Error('[R1196] primary React bundle cache key missing');
html=html.replace(rx,s=>s.includes('&fields=r1196')?s:s+'&fields=r1196');
fs.writeFileSync(index,html);
const style=fs.readFileSync('dist/web/photobridge-r1196-gallery-field-align.css','utf8');
if(!style.includes('flex-direction:column!important')||!style.includes('grid-row:1!important'))
 throw Error('[R1196] aligned gallery fields CSS missing');
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1195-gallery-create-compact.cjs','scripts/test-r1196-gallery-field-align.cjs'],{stdio:'inherit'});

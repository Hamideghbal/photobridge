import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1195: React owns both the modal header and its form. Move the real
// fee/capacity/lifetime React node into an optional header slot instead of
// physically moving DOM nodes (which would break React reconciliation).
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
function once(before,after,label){
 const count=ui.split(before).length-1;
 if(count===1){ui=ui.replace(before,after);return;}
 if(count===0&&ui.includes(after))return;
 throw Error('[R1195] '+label+' expected once, found '+count);
}
once('function On({title:t,onClose:a,children:s,dialogClassName:r="",contentClassName:o=""})',
 'function On({title:t,onClose:a,children:s,dialogClassName:r="",contentClassName:o="",headerExtra:d=null})',
 'shared modal optional header slot');
once('children:[e.jsx("h2",{children:t}),e.jsx("button",{onClick:a,"aria-label":"بستن",children:"×"})]',
 'children:[e.jsx("h2",{children:t}),d,e.jsx("button",{onClick:a,"aria-label":"بستن",children:"×"})]',
 'render header extras between title and close');
const start=ui.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید",dialogClassName:"pb1112CreateDialog"');
if(start<0)throw Error('[R1195] photographer new gallery modal missing');
const billingStart=ui.indexOf('e.jsxs("div",{className:"clientGalleryCreateBilling",children:[',start);
const billingEnd=ui.indexOf(',e.jsxs("label",{children:["عنوان پروژه"',billingStart);
if(billingStart<start||billingEnd<billingStart||billingEnd-billingStart>1150)throw Error('[R1195] unrecognized gallery billing shape');
const billing=ui.slice(billingStart,billingEnd);
for(const label of ['هزینه ساخت','ظرفیت','عمر اولیه']){
 if(!billing.includes(label))throw Error('[R1195] expected billing field: '+label);
}
if(!billing.endsWith('})'))throw Error('[R1195] billing JSX incomplete');
// Remove only the first child of the gallery form; it is now rendered as the
// header sibling to the title and close action, not duplicated.
ui=ui.slice(0,billingStart)+ui.slice(billingEnd+1);
const head='dialogClassName:"pb1112CreateDialog",onClose:';
once(head,'dialogClassName:"pb1112CreateDialog",headerExtra:'+billing+',onClose:','gallery header billing slot');
if(ui.includes('children:[e.jsxs("div",{className:"clientGalleryCreateBilling"'))
 throw Error('[R1195] gallery duplicate billing not removed from form');
if(!ui.includes('children:[e.jsxs("label",{children:["عنوان پروژه"'))
 throw Error('[R1195] first project label missing after move');
fs.writeFileSync(file,ui);

// The generated website must load the new layout LAST; retain the previous
// R1194 overlay fix (new modal above desktop header).
const index='dist/web/index.html';
let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1195-gallery-create-compact.css?v=r1195">';
if(!html.includes(tag)){
 if(html.includes('photobridge-r1195-gallery-create-compact.css'))throw Error('[R1195] stale stylesheet URL');
 if(!html.includes('</body>'))throw Error('[R1195] website closing body missing');
 html=html.replace('</body>',tag+'\n</body>');
}
const rx=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...html.matchAll(rx)].length!==1)throw Error('[R1195] expected one React module URL');
html=html.replace(rx,v=>v.includes('&gallery=r1195')?v:v+'&gallery=r1195');
fs.writeFileSync(index,html);
if(!fs.readFileSync('dist/web/photobridge-r1195-gallery-create-compact.css','utf8').includes('grid-template-columns:repeat(3'))
 throw Error('[R1195] compact layout CSS missing');
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1195-gallery-create-compact.cjs','scripts/test-r1194-gallery-create-dialog.cjs'],{stdio:'inherit'});

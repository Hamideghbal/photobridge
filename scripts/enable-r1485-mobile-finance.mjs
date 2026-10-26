import fs from 'node:fs';
const root='dist/web/',asset=root+'assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(asset,'utf8');
if(!ui.includes('/* PB1485 exclusive phone calendars */')){
 const anchor='function Hs({value:t,onChange:a,placeholder:s="انتخاب تاریخ",compact:r=!1})';
 const helper=`/* PB1485 exclusive phone calendars */
function pb1485DateToggle(event,open,toggle){
 if(pb1483Phone()&&!open){
  const own=event.currentTarget.closest('.persianDateField');
  document.querySelectorAll('.labRoleWorkspace .persianDateField').forEach(field=>{if(field!==own&&field.querySelector('.persianDatePopover'))field.querySelector('.persianDateTrigger')?.click()});
 }
 toggle(value=>!value);
}
`;
 if(ui.split(anchor).length!==2)throw Error('R1485 date component anchor');
 const start=ui.indexOf(anchor),end=ui.indexOf('function Og(',start);if(end<start)throw Error('R1485 date component end');
 let date=ui.slice(start,end);const click='onClick:()=>m(k=>!k)';if(date.split(click).length!==2)throw Error('R1485 date trigger anchor');date=date.replace(click,'onClick:event=>pb1485DateToggle(event,c,m)');ui=ui.slice(0,start)+helper+date+ui.slice(end);fs.writeFileSync(asset,ui);
}
for(const [src,name]of [['scripts/r1485-mobile-finance.css','photobridge-r1485-mobile-finance.css'],['scripts/r1485-calendar.js','photobridge-r1485-calendar.js']])fs.copyFileSync(src,root+name);
let html=fs.readFileSync(root+'index.html','utf8');const tags='<link rel="stylesheet" href="/photobridge-r1485-mobile-finance.css?v=r1485">\n<script defer src="/photobridge-r1485-calendar.js?v=r1485"></script>';if(!html.includes('src="/photobridge-r1485-calendar.js'))html=html.replace('</head>',tags+'\n</head>');fs.writeFileSync(root+'index.html',html);

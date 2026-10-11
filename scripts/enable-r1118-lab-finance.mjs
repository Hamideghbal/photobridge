import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
const start=js.indexOf('className:"financeWorkspace accountingWorkspace financeWorkspaceCompact"'),end=js.indexOf('className:"financeSectionTools"',start);
if(start<0||end<0)throw Error('Finance navigation anchor missing');
let part=js.slice(start,end);
part=part.replace('children:t==="lab"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>L(!0)', 'children:false&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>L(!0)');
part=part.replace('options:ue,onChange:', 'options:t==="lab"?ue.filter(option=>!["expenses","ledger","accounting"].includes(option.value)):ue,onChange:');
part=part.replace('t==="lab"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:w==="expenses"','false&&e.jsxs(e.Fragment,{children:[e.jsx("button",{className:w==="expenses"');
part=part.replace('t==="lab"&&e.jsx("button",{className:w==="accounting"','false&&e.jsx("button",{className:w==="accounting"');
js=js.slice(0,start)+part+js.slice(end);fs.writeFileSync(file,js);
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(path,'utf8');if(!html.includes('/photobridge-r1118-lab-finance.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1118-lab-finance.css?v=r1118">\n</head>');fs.writeFileSync(path,html);}

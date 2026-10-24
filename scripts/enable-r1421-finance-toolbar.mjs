import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1421 anchor '+n+': '+a.slice(0,90));return s.replace(a,b)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1421 compact sticky finance toolbars */')){
 const a=ui.indexOf('w==="statement"&&e.jsxs("div",{className:"customerStatementWorkspace"'),b=ui.indexOf('className:"statementTableWrap"',a);if(a<0||b<a)throw Error('R1421 statement toolbar missing');
 let part=ui.slice(a,b);
 const start=part.indexOf('t==="lab"&&e.jsxs("label",{className:"statementCustomerPicker"'),end=part.indexOf(',e.jsxs("label",{className:"statementDateLabel"',start);if(start<0||end<start)throw Error('R1421 customer selector missing');
 part=part.slice(0,start)+'t==="lab"&&e.jsxs("select",{className:"pb1421CustomerSelect",value:z,"aria-label":"انتخاب عکاسی",onChange:Je=>{q(Je.target.value);A(null);Re(1)},children:[e.jsx("option",{value:"",children:"انتخاب عکاسی"}),...E.map(Je=>e.jsx("option",{value:String(Je.id),children:String(Je.name||"عکاسی")+" · "+String(Je.mobile||"")},Je.id))]})'+part.slice(end);
 part=once(part,'children:["از تاریخ",','"aria-label":"از تاریخ",children:[');
 part=once(part,'children:["تا تاریخ",','"aria-label":"تا تاریخ",children:[');
 const from='value:_e,onChange:Je=>{Pe(Je),Re(1)},placeholder:"انتخاب تاریخ شمسی"';
 const to='value:je,onChange:Je=>{d(Je),Re(1)},placeholder:"انتخاب تاریخ شمسی"';
 part=once(part,from,'value:_e,onChange:Je=>{Pe(Je),Re(1)},placeholder:"از تاریخ"');
 part=once(part,to,'value:je,onChange:Je=>{d(Je),Re(1)},placeholder:"تا تاریخ"');
 part=once(part,'className:"dateClearBtn",onClick:()=>{Pe(""),Re(1)},children:"پاک"','className:"dateClearBtn","aria-label":"پاک کردن از تاریخ",onClick:()=>{Pe(""),Re(1)},children:"×"');
 part=once(part,'className:"dateClearBtn",onClick:()=>{d(""),Re(1)},children:"پاک"','className:"dateClearBtn","aria-label":"پاک کردن تا تاریخ",onClick:()=>{d(""),Re(1)},children:"×"');
 ui=ui.slice(0,a)+part+ui.slice(b)+'\n/* PB1421 compact sticky finance toolbars */\n';fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1421-finance-toolbar.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1421-finance-toolbar.css?v=r1422"></head>');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.includes('&financeToolbar=')?link:link+'&financeToolbar=r1421');
html=html.replace(/(photobridge-r1421-finance-toolbar\\.css\\?v=)r\\d+/g,'$1r1422');
fs.writeFileSync('dist/web/index.html',html);

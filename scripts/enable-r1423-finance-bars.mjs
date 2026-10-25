import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1423 anchor '+n+': '+a.slice(0,85));return s.replace(a,b)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1423 uniform finance control rows */')){
 const a=ui.indexOf('w==="invoices"&&e.jsxs("div",{className:"invoiceTableCard card"'),b=ui.indexOf(',t==="lab"&&w==="payments"',a);if(a<0||b<a)throw Error('R1423 invoice panel missing');
 let part=ui.slice(a,b);
 part=once(part,'children:[e.jsxs("div",{className:"invoiceListToolbar"','children:[e.jsxs("div",{className:t==="lab"?"pb1423InvoiceToolbar":"pb1423OtherInvoiceToolbar",children:[e.jsxs("div",{className:"invoiceListToolbar"');
 part=once(part,'children:[e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})','children:[t!=="lab"&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})');
 part=once(part,']}),Ve.length?',']})]}),Ve.length?');
 part=once(part,'e.jsxs("label",{children:["از تاریخ",','e.jsxs("label",{"aria-label":"از تاریخ",children:[');
 part=once(part,'e.jsxs("label",{children:["تا تاریخ",','e.jsxs("label",{"aria-label":"تا تاریخ",children:[');
 ui=ui.slice(0,a)+part+ui.slice(b)+'\n/* PB1423 uniform finance control rows */\n';fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1423-finance-bars.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1423-finance-bars.css?v=r1424"></head>');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.includes('&invoiceToolbar=')?link:link+'&invoiceToolbar=r1423');
html=html.replace(/(photobridge-r1423-finance-bars\\.css\\?v=)r\\d+/g,'$1r1424');
fs.writeFileSync('dist/web/index.html',html);

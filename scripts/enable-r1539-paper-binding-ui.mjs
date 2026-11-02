import fs from 'node:fs';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(path,'utf8');
const start=js.indexOf('function tw({data:t,onSaved:a,labName:s=""}){'),end=js.indexOf('function Na(t)',start);
if(start<0||end<=start)throw Error('R1539 print pricing component unavailable');
let component=js.slice(start,end);
function one(a,b,label){if(component.split(a).length!==2)throw Error('R1539 '+label+' changed');component=component.replace(a,b)}
const labels='const h=[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["album_binding_price","صحافی آلبوم"],["chassis","قیمت شاسی"],["chassis_stock","موجودی شاسی"],["frame","قیمت قاب"],["frame_stock","موجودی قاب"]]';
one(labels,fs.readFileSync('scripts/r1539-pricing-react.js.txt','utf8').trim(),'catalog columns');
one('frameStock:Na(F.frame_stock)}))})','frameStock:Na(F.frame_stock),customRates:Object.fromEntries(pb1539Custom.map(t=>[t.id,Na(Object.hasOwn(F,"pb1539_"+t.id)?F["pb1539_"+t.id]:pb1539.rates?.[F.id]?.[t.id]??null)]))}))})','save custom rates');
const a=component.indexOf('w=(B,L)=>'),b=component.indexOf(',F=c.current.map',a);
if(a<0||b<a||b-a>230)throw Error('R1539 print formatter changed');
component=component.slice(0,a)+'w=(B,L)=>{const n=L.startsWith("pb1539_")?(Object.hasOwn(B,L)?B[L]:pb1539.rates?.[B.id]?.[L.slice(7)]):B[L];return n==null||String(n)===""||Number(n)===0?"—":V(Number(n))+" تومان"}'+component.slice(b);
one('e.jsx("button",{className:"pbActionButton secondary",onClick:T,children:"چاپ تعرفه"}),',
 'e.jsx("button",{className:"pbActionButton secondary",onClick:T,children:"چاپ تعرفه"}),e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create("paper"),children:"+ کاغذ جدید"}),e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create("binding"),children:"+ صحافی جدید"}),','creation actions');
one('h.map(([k,E])=>e.jsx("b",{children:E},E))',
 'h.map(([k,E])=>e.jsxs("b",{children:[E,(k==="album_binding_price"||k.startsWith("pb1539_"))&&e.jsx("button",{type:"button",className:"pb1539Rename",title:"ویرایش نام",onClick:()=>pb1539Rename(k.startsWith("pb1539_")?k.slice(7):k,E),children:"✎"})]},k))','rename model header');
one('value:C.includes("stock")?$u(k[C]??""):Bn(k[C])',
 'value:C.includes("stock")?$u(k[C]??""):Bn(C.startsWith("pb1539_")?(Object.hasOwn(k,C)?k[C]:pb1539.rates?.[k.id]?.[C.slice(7)]):k[C])','custom values');
js=js.slice(0,start)+component+js.slice(end)+'\n/* PB1539 lab paper and binding pricing */\n';
fs.writeFileSync(path,js);
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&printCatalog=r1539')?u:u+'&printCatalog=r1539');
if(!html.includes('photobridge-r1539-print-catalog.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1539-print-catalog.css?v=r1539"></head>');
fs.writeFileSync(htmlFile,html);

import fs from 'node:fs';
const path='dist/web/assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(path,'utf8');
function one(s,a,b,label){if(s.split(a).length!==2)throw Error('R1539 binding visibility '+label);return s.replace(a,b)}
const kv=js.indexOf('function Kv('),kvEnd=js.indexOf('function ',kv+12);
if(kv<0||kvEnd<=kv)throw Error('R1539 photographer summary boundary');
let customer=js.slice(kv,kvEnd);
customer=one(customer,'children:["صحافی ",(Be==null?void 0:Be.label)||""," · ",V(Qn)," صفحه"]',
 'children:[pb1539Chosen.name," · ",(Be==null?void 0:Be.label)||""," · ",V(Qn)," صفحه"]','quote model label');
customer=one(customer,'children:Q?"قیمت‌گذاری لابراتوار":V(_a)',
 'children:Q||!pb1539Price?"قیمت‌گذاری لابراتوار":V(_a)','quote missing binding price');
customer=one(customer,'children:Q?"چاپ/صحافی سایز آزاد و جلد طبق توضیحات توسط لابراتوار قیمت‌گذاری می‌شود.":v?',
 'children:Q?"چاپ/صحافی سایز آزاد و جلد طبق توضیحات توسط لابراتوار قیمت‌گذاری می‌شود.":!pb1539Price?"این نوع صحافی برای سایز انتخاب‌شده تعرفه ندارد و باید در لابراتوار قیمت‌گذاری شود.":v?','quote warning');
js=js.slice(0,kv)+customer+js.slice(kvEnd);
const start=js.indexOf('function Vl('),end=js.indexOf('function ',start+12);
if(start<0||end<=start)throw Error('R1539 lab summary boundary');
let lab=js.slice(start,end);
lab=one(lab,'className:"albumOrderSummaryFacts albumOrderSummaryFactsPrimary",children:[e.jsxs("span",{className:"albumSizeFact"',
'className:"albumOrderSummaryFacts albumOrderSummaryFactsPrimary",children:[e.jsxs("span",{className:"pb1539BindingFact",children:[e.jsx("small",{children:"نوع صحافی"}),e.jsx("b",{children:String(s?.binding?.name||"صحافی آلبوم")})]}),e.jsxs("span",{className:"albumSizeFact"','lab album detail');
js=js.slice(0,start)+lab+js.slice(end);
fs.writeFileSync(path,js);

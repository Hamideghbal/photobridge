import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1420 anchor '+n+': '+a.slice(0,95));return s.replace(a,b)};
const path='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(path,'utf8');
if(!ui.includes('/* PB1420 receipt list and archive footer */')){
 const start=ui.indexOf('function ub({role:t,'),end=ui.indexOf('function ',start+15);if(start<0||end<start)throw Error('R1420 finance component missing');
 let part=ui.slice(start,end);
 part=once(part,'[r,o]=x.useState([])','[pb1420PaymentCustomer,pb1420SetPaymentCustomer]=x.useState(""),[r,o]=x.useState([])');
 part=once(part,'const Ve=r.filter(', 'x.useEffect(()=>{if(w==="payments")pb1420SetPaymentCustomer("")},[w]);const pb1420Payments=t==="lab"?PB1420PaymentRows(h,pb1420PaymentCustomer):h;const Ve=r.filter(');
 const a=part.indexOf('t==="lab"&&w==="payments"&&e.jsxs("div",{className:"pb1176PaymentActions"'),b=part.indexOf(',w==="payments"&&e.jsx("div",{className:"card financeListCard"',a);
 if(a<0||b<a)throw Error('R1420 payment actions missing');
 let actions=part.slice(a,b);
 actions=once(actions,'value:z,onChange:Je=>q(Je.target.value)','value:pb1420PaymentCustomer,onChange:Je=>{pb1420SetPaymentCustomer(Je.target.value);q(Je.target.value)}');
 actions=once(actions,'children:"انتخاب عکاسی"','children:"همهٔ عکاسی‌ها"');
 actions=once(actions,'z&&_pb1177Customer&&','pb1420PaymentCustomer&&_pb1177Customer&&');
 actions=actions.replaceAll('disabled:!z','disabled:!pb1420PaymentCustomer');
 part=part.slice(0,a)+actions+part.slice(b);
 const listStart=part.indexOf('w==="payments"&&e.jsx("div",{className:"card financeListCard"'),listEnd=part.indexOf(',w==="statement"&&',listStart);
 if(listStart<0||listEnd<listStart)throw Error('R1420 payments list missing');
 let list=part.slice(listStart,listEnd);
 list=once(list,'className:"card financeListCard"','className:"card financeListCard pb1420Payments"');
 list=once(list,'children:h.length?','children:pb1420Payments.length?');
 list=once(list,'children:h.map(Je=>','children:[t==="lab"&&e.jsxs("div",{className:"pb1420PaymentColumns",children:[e.jsx("b",{children:"عکاسی / شرح"}),e.jsx("b",{children:"تاریخ"}),e.jsx("b",{children:"روش دریافت"}),e.jsx("b",{children:"مبلغ"}),e.jsx("span",{children:""})]}),...pb1420Payments.map(Je=>');
 list=once(list,'e.jsx("span",{children:R(Je.method)})','t==="lab"&&e.jsx("time",{className:"pb1420PaymentDate",dateTime:Je.paid_at,children:vn(Je.paid_at)}),e.jsx("span",{children:R(Je.method)})');
 list=once(list,']},Je.id))})',']},Je.id))]})');
 list=once(list,'text:"هنوز دریافتی ثبت نشده است."','text:pb1420PaymentCustomer?"برای این عکاسی دریافتی ثبت نشده است.":"هنوز دریافتی ثبت نشده است."');
 part=part.slice(0,listStart)+list+part.slice(listEnd);
 const helper='function PB1420PaymentRows(rows,customerId){return rows.map((row,index)=>({row,index})).filter(item=>!customerId||String(item.row.customer_id)===String(customerId)).sort((a,b)=>{const av=Date.parse(a.row.paid_at),bv=Date.parse(b.row.paid_at);return (Number.isFinite(bv)?bv:0)-(Number.isFinite(av)?av:0)||a.index-b.index}).map(item=>item.row)}\n';
 ui=ui.slice(0,start)+helper+part+ui.slice(end);
 const footer='e.jsxs("footer",{className:"productFooter",children:["Powered by ",e.jsx("b",{children:"PhotoBridge"})]})';
 const archive='f==="archive"&&e.jsx(hb,{role:"lab"})';
 ui=once(ui,archive,'f==="archive"&&e.jsxs("div",{className:"pb1420ArchivePage",children:[e.jsx(hb,{role:"lab"}),'+footer.replace('className:"productFooter"','className:"productFooter pb1420ArchiveFooter"')+']})');
 ui=once(ui,'f!=="settings"&&f!=="finance"&&'+footer,'f!=="settings"&&f!=="finance"&&f!=="archive"&&'+footer);
 fs.writeFileSync(path,ui+'\n/* PB1420 receipt list and archive footer */\n');
}
const header='dist/web/photobridge-r1147-lab-admin-header.js';let h=fs.readFileSync(header,'utf8');
if(!h.includes('/* PB1420 single finance context */')){
 h=once(h,"[['امور مالی',true],['تعرفه‌ها',false]]","[['امور مالی',true]]");
 fs.writeFileSync(header,h+'\n/* PB1420 single finance context */\n');
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1420-payment-list.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1420-payment-list.css?v=r1420"></head>');
for(const name of ['photobridge-r1147-lab-admin-header.js','assets/index-UIRefine-v655-r84.js']){
 const escaped=name.replaceAll('.','\\.');
 html=html.replace(new RegExp('('+escaped+'\\?[^"\x27]*)','g'),link=>link.includes('&paymentList=')?link:link+'&paymentList=r1420');
}
fs.writeFileSync('dist/web/index.html',html);

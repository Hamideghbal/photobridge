import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1437 statement and tariff details */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1437 UI anchor '+a.slice(0,100));ui=ui.replace(a,b)};
 once('[pb1418DateOrder,pb1418SetDateOrder]=x.useState("desc")','[_pb1437PickAction,_setPb1437PickAction]=x.useState(null),[pb1418DateOrder,pb1418SetDateOrder]=x.useState("desc")');
 once('e.jsx("button",{disabled:!pb1420PaymentCustomer,onClick:Ye,children:"＋ ثبت پرداخت"}),e.jsx("button",{disabled:!pb1420PaymentCustomer,onClick:()=>v(!0),children:"＋ ثبت تخفیف"})','e.jsx("button",{onClick:()=>pb1420PaymentCustomer?Ye():_setPb1437PickAction("payment"),children:"＋ ثبت پرداخت"}),e.jsx("button",{onClick:()=>pb1420PaymentCustomer?v(!0):_setPb1437PickAction("discount"),children:"＋ ثبت تخفیف"}),_pb1437PickAction&&e.jsx(PB1437CustomerPrompt,{action:_pb1437PickAction,customers:E,onClose:()=>_setPb1437PickAction(null),onSelect:id=>{q(id);pb1420SetPaymentCustomer(id);if(_pb1437PickAction==="payment"){ft({customerId:id,invoiceId:"",amount:"",method:"cash",note:""});L(!0)}else v(!0);_setPb1437PickAction(null)}})');
 once('[_e,Pe]=x.useState(""),[je,d]=x.useState("")','[_e,Pe]=x.useState(t==="lab"?Ce.from:""),[je,d]=x.useState(t==="lab"?Ce.to:"")');
 once('w==="statement"&&t==="lab"&&z&&!_&&b().catch(()=>{})','w==="statement"&&t==="lab"&&z&&b().catch(()=>{})');
 once('const item=r.find(Ot=>Ot.document_type==="invoice"&&String(Ot.id)===String(Je.reference_id));const rows=window.pb1176Finance?.items(item)||[];','const item=PB1437StatementInvoice(Je,r);const rows=PB1437InvoiceItems(item);');
 once('function PB1435CorrectionView({doc}){','function PB1435CorrectionView({doc}){const Xe=value=>Number(value||0).toLocaleString("fa-IR");');
 const start=ui.indexOf('function Qj('),end=ui.indexOf('function ',start+12);if(start<0||end<0)throw Error('R1437 walkin tariff source');let part=ui.slice(start,end);
 const sub=(a,b)=>{if(part.split(a).length!==2)throw Error('R1437 tariff anchor '+a.slice(0,70));part=part.replace(a,b)};
 sub('frame:Na(I.frame)}','frame:Na(I.frame),albumBindingPrice:Na(I.album_binding_price),chassisStock:Na(I.chassis_stock),frameStock:Na(I.frame_stock)}');
 const columns='[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["chassis","قیمت شاسی"],["frame","قیمت قاب"]]';if(part.split(columns).length!==3)throw Error('R1437 column definitions');part=part.replaceAll(columns,'PB1437TariffFields()');
 const header='e.jsx("b",{children:"لاستر"}),e.jsx("b",{children:"سیلک"}),e.jsx("b",{children:"متالیک"}),e.jsx("b",{children:"قیمت شاسی"}),e.jsx("b",{children:"قیمت قاب"})';sub(header,'PB1437TariffFields().map(([key,label])=>e.jsx("b",{children:label},key))');
 sub('value:Bn(I[k]),onChange:C=>p(T,k,String(Mn(C.target.value)||"")),placeholder:"—"','value:Bn(I[k]),onChange:C=>p(T,k,String(Mn(C.target.value)||"")),placeholder:k.includes("stock")?"نامحدود":k==="album_binding_price"?"بدون صحافی":"—"');
 part=part.replaceAll('priceGrid walkinUnifiedPriceGrid','priceGrid inventoryPriceGrid pb1437WalkinGrid');ui=ui.slice(0,start)+part+ui.slice(end);
 ui+='\n/* PB1437 statement and tariff details */\n'+fs.readFileSync('scripts/r1437-finance-helpers.js','utf8');fs.writeFileSync(file,ui);
}
const serverFile='dist/api/server.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1437 complete walkin tariff */')){
 const a=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/finance/customer-statement')"),b=server.indexOf("if (req.method",a+30);if(a<0||b<a)throw Error('R1437 statement route');let part=server.slice(a,b);
 const old='i.number invoice_number,p.method payment_method';if(part.split(old).length!==2)throw Error('R1437 statement select');part=part.replace(old,'i.items invoice_items,i.number invoice_number,p.method payment_method').replace('t.reference_id,i.number,p.method','t.reference_id,i.id,i.number,p.method');server=server.slice(0,a)+part+server.slice(b);
 const start=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/walkin')"),end=server.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/prices')",start);if(start<0||end<0)throw Error('R1437 walkin routes');part=server.slice(start,end);
 part=part.replace('w.metallic,w.chassis,w.frame,p.chassis_stock','w.metallic,w.album_binding_price,w.chassis,w.frame,p.chassis_stock');
 const anchor='await c.query(`INSERT INTO walkin_prices(lab_id,size_id,luster,silk,metallic,chassis,frame,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT(lab_id,size_id) DO UPDATE SET luster=EXCLUDED.luster,silk=EXCLUDED.silk,metallic=EXCLUDED.metallic,chassis=EXCLUDED.chassis,frame=EXCLUDED.frame,updated_at=now()`, [labId, r.sizeId, r.luster ?? null, r.silk ?? null, r.metallic ?? null, r.chassis ?? null, r.frame ?? null]);';
 if(part.split(anchor).length!==2)throw Error('R1437 tariff upsert');
 part=part.replace(anchor,anchor+'\n'+fs.readFileSync('scripts/r1437-walkin-extra-save.js','utf8'));server=server.slice(0,start)+part+server.slice(end)+'\n/* PB1437 complete walkin tariff */\n';fs.writeFileSync(serverFile,server);
}
const printFile='dist/web/photobridge-r1176-lab-finance.js';let print=fs.readFileSync(printFile,'utf8');
if(!print.includes('/* PB1437 embedded statement items */')){
 print=print.replace("const invoice=r.reference_type==='invoice'?docs.get(String(r.reference_id)):null;","const invoice=r.reference_type==='invoice'?{...docs.get(String(r.reference_id)),number:r.invoice_number||docs.get(String(r.reference_id))?.number,items:r.invoice_items??docs.get(String(r.reference_id))?.items??[]}:null;");
 print+='\n/* PB1437 embedded statement items */\n';fs.writeFileSync(printFile,print);
}
let html=fs.readFileSync('dist/web/index.html','utf8');if(!html.includes('photobridge-r1437-finance-details.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1437-finance-details.css?v=r1437" /></head>');html=html.replace(/(photobridge-r1176-lab-finance\.js)(?:\?[^"'<>\s]*)?/g,'$1?v=r1437');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&financeDetails=')?url:url+'&financeDetails=r1437');fs.writeFileSync('dist/web/index.html',html);

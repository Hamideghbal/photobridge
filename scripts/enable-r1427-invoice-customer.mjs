import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1427 changed anchor: '+a);ui=ui.replace(a,b)};
if(!ui.includes('/* PB1427 invoice customer picker */')){
 once('[pb1420PaymentCustomer,pb1420SetPaymentCustomer]=x.useState("")','[pb1420PaymentCustomer,pb1420SetPaymentCustomer]=x.useState(""),[pb1427InvoiceCustomer,pb1427SetInvoiceCustomer]=x.useState("")');
 once('const Ve=r.filter(Je=>{const Ot=','x.useEffect(()=>{if(w==="invoices")pb1427SetInvoiceCustomer("")},[w]);const Ve=r.filter(Je=>{if(t==="lab"&&pb1427InvoiceCustomer&&String(Je.customer_id)!==String(pb1427InvoiceCustomer))return!1;const Ot=');
 once('e.jsx("div",{className:"ordersSearch slimSearch financeInvoiceSearch",children:e.jsx("input",{value:l,onChange:Je=>c(Je.target.value),placeholder:"جستجوی فاکتور، عکاسی یا سند…"})})','t==="lab"?e.jsxs("select",{className:"pb1427InvoiceCustomerSelect","aria-label":"انتخاب عکاسی",value:pb1427InvoiceCustomer,onChange:Je=>{pb1427SetInvoiceCustomer(Je.target.value);Ie(1)},children:[e.jsx("option",{value:"",children:"همهٔ عکاسی‌ها"}),E.map(Je=>e.jsx("option",{value:String(Je.id),children:Je.name||Je.mobile||"عکاسی"},Je.id))]}):e.jsx("div",{className:"ordersSearch slimSearch financeInvoiceSearch",children:e.jsx("input",{value:l,onChange:Je=>c(Je.target.value),placeholder:"جستجوی فاکتور، عکاسی یا سند…"})})');
 ui+='\n/* PB1427 invoice customer picker */\n';
 fs.writeFileSync(file,ui);
}
const cssFile='dist/web/photobridge-r1423-finance-bars.css';
if(!fs.readFileSync(cssFile,'utf8').includes('/* PB1427 invoice customer picker */'))fs.appendFileSync(cssFile,`
/* PB1427 invoice customer picker */
.pb1427InvoiceCustomerSelect{width:100%;min-width:0;box-sizing:border-box}
@media(min-width:821px) and (hover:hover) and (pointer:fine){
 html body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace .pb1423InvoiceToolbar .pb1427InvoiceCustomerSelect{
 height:34px!important;min-height:34px!important;flex:0 1 220px!important;width:220px!important;min-width:150px!important;margin:0!important;padding:5px 9px!important;font:inherit;font-size:11px!important;
 }
}
`);
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(photobridge-r1423-finance-bars\.css)(?:\?[^"'<>\s]*)?/g,'$1?v=r1427');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.includes('&invoiceCustomer=')?link:link+'&invoiceCustomer=r1427');
fs.writeFileSync('dist/web/index.html',html);

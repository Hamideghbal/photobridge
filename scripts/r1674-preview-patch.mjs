function one(s,oldValue,next,label){
 const n=s.split(oldValue).length-1;
 if(n!==1)throw Error('R1674 '+label+' count '+n);
 return s.replace(oldValue,next);
}
export function patchDirectCustomerPreview(js,root){
 // Previous build stages may wrap, minify, or rename the preview function.
 // Its JSX anchors remain unique in the compiled bundle; require the invoice
 // preview landmarks, then patch each unique anchor without slicing by name.
 if(!js.includes('className:"invoicePreviewHeadActions"')||
    !js.includes('className:"invoicePaperInfo"')||
    !js.includes('className:"invoiceAccountDebt"'))
  throw Error('R1674 preview landmark missing '+root);
 let p=js;
 p=one(p,'e.jsx("h2",{children:"فاکتور فروش و خدمات چاپ"})',
   'e.jsx("h2",{children:pb1674DirectCustomer(a)?"فاکتور خدمات مشتری آزاد":"فاکتور فروش و خدمات چاپ"})','preview heading '+root);
 p=one(p,'e.jsx("small",{children:t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})',
   'e.jsx("small",{children:pb1674DirectCustomer(a)?"نام مشتری":t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})','preview customer label '+root);
 const oldName='e.jsx("b",{children:t==="lab"?a.customer_name||"—":a.lab_name||"—"})]})';
 const newName='e.jsx("b",{children:pb1674DirectCustomer(a)?pb1674CustomerName(a):t==="lab"?a.customer_name||"—":a.lab_name||"—"})]}),pb1674DirectCustomer(a)&&e.jsxs("div",{children:[e.jsx("small",{children:"شماره موبایل مشتری"}),e.jsx("b",{children:pb1674CustomerMobile(a)})]})';
 p=one(p,oldName,newName,'preview customer name and mobile '+root);
 const oldPrint='e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:"چاپ فاکتور"})';
 const newPrint='e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,t),children:pb1674DirectCustomer(a)&&t==="lab"?"چاپ حرارتی":"چاپ فاکتور"}),pb1674DirectCustomer(a)&&t==="lab"&&e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,"customer-a4"),children:"چاپ A4"})';
 p=one(p,oldPrint,newPrint,'preview thermal and A4 buttons '+root);
 // Direct customers have a single-invoice receipt, not a studio ledger.
 // Keep their recorded payment when present, but omit the account-like balance.
 const oldPayment='(o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini",children:[e.jsxs("span",{children:["پرداخت‌شده: ",e.jsx("b",{children:V(o)})]}),e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})]})';
 const newPayment='(pb1674DirectCustomer(a)?o>0:o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini",children:[e.jsxs("span",{children:["پرداخت‌شده: ",e.jsx("b",{children:V(o)})]}),!pb1674DirectCustomer(a)&&e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})]})';
 p=one(p,oldPayment,newPayment,'preview direct-customer payment display '+root);
 p=one(p,'e.jsxs("div",{className:"invoiceAccountDebt"',
    '!pb1674DirectCustomer(a)&&e.jsxs("div",{className:"invoiceAccountDebt"','preview coworker-only debt '+root);
 return p;
}

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
   'e.jsx("small",{children:pb1674DirectCustomer(a)?"نام و نام خانوادگی مشتری":t==="lab"?"مشتری / عکاسی":"صادرکننده / لابراتوار"})','preview customer label '+root);
 const oldName='e.jsx("b",{children:t==="lab"?a.customer_name||"—":a.lab_name||"—"})]})';
 const newName='e.jsx("b",{children:pb1674DirectCustomer(a)?pb1674CustomerName(a):t==="lab"?a.customer_name||"—":a.lab_name||"—"})]}),pb1674DirectCustomer(a)&&e.jsxs("div",{children:[e.jsx("small",{children:"شماره موبایل مشتری"}),e.jsx("b",{children:pb1674CustomerMobile(a)})]})';
 p=one(p,oldName,newName,'preview customer name and mobile '+root);
 // The previous stages can rename the primary Print button, change its
 // onClick handler, or wrap it for desktop navigation. Don't rewrite it.
 // R1665 already routes the existing lab Print action to thermal output.
 // Just add the direct-customer A4 action to the known preview actions row.
 const actions='className:"invoicePreviewHeadActions",children:[';
 const a4='pb1674DirectCustomer(a)&&t==="lab"&&e.jsx("button",{className:"invoicePrintBtn",onClick:()=>Wy(a,"customer-a4"),children:"چاپ A4"}),';
 p=one(p,actions,actions+a4,'preview direct-customer A4 action '+root);
 // Direct customers have a single-invoice receipt, not a studio ledger.
 // Keep their recorded payment when present, but omit the account-like balance.
 const oldPayment='(o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini",children:[e.jsxs("span",{children:["پرداخت‌شده: ",e.jsx("b",{children:V(o)})]}),e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})]})';
 const newPayment='(pb1674DirectCustomer(a)?o>0:o>0||l>0)&&e.jsxs("div",{className:"invoicePaymentMini",children:[e.jsxs("span",{children:["پرداخت‌شده: ",e.jsx("b",{children:V(o)})]}),!pb1674DirectCustomer(a)&&e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})]})';
 if(p.includes(oldPayment))
  p=one(p,oldPayment,newPayment,'preview direct-customer payment display '+root);
 else {
  // Earlier finance/preview updates can restyle the payment row. Avoid
  // pinning the entire JSX expression; hide the studio balance and suppress
  // the row when a direct customer has not paid anything.
  const span='e.jsxs("span",{children:["مانده این فاکتور: ",e.jsx("b",{children:V(l)})]})';
  const wrap='className:"invoicePaymentMini",children:[';
  p=one(p,span,'!pb1674DirectCustomer(a)&&'+span,'preview balance fallback '+root);
  p=one(p,wrap,'className:"invoicePaymentMini",style:{display:pb1674DirectCustomer(a)&&!o?"none":void 0},children:[','preview payment fallback '+root);
 }
 p=one(p,'e.jsxs("div",{className:"invoiceAccountDebt"',
    '!pb1674DirectCustomer(a)&&e.jsxs("div",{className:"invoiceAccountDebt"','preview coworker-only debt '+root);
 const invoiceNote="e.jsx(\"div\",{className:\"invoicePaperNote\",children:\"پیش‌نمایش، چاپ و PDF از یک ساختار اطلاعاتی استفاده می‌کنند تا شرح، مبالغ و جمع فاکتور یکسان باشد.\"})";
 const labContact="e.jsxs(\"div\",{className:\"invoicePaperLabContact\",style:{display:\"grid\",gridTemplateColumns:\"1fr 1.5fr\",gap:12,borderTop:\"1px dashed #d0d5dd\",paddingTop:12,marginTop:14,fontSize:12},children:[e.jsxs(\"div\",{children:[e.jsx(\"small\",{children:\"شماره تماس لابراتوار\"}),e.jsx(\"b\",{children:a.lab_phone||\"ثبت نشده\"})]}),e.jsxs(\"div\",{children:[e.jsx(\"small\",{children:\"آدرس لابراتوار\"}),e.jsx(\"b\",{children:a.lab_address||\"ثبت نشده\"})]})]})";
 p=one(p,invoiceNote,invoiceNote+","+labContact,'preview laboratory contact '+root);
 return p;
}


/* R1679: the ordinary photographer A4 print and PDF keep their existing
 * photographer/debt layout, but gain the same laboratory contact footer.
 */
export function patchPhotographerInvoiceContact(js,root){
 let p=js;
 const oldHtml='<div class="accountDebt"><span>جمع بدهی عکاسی</span><b>\${_n(V(l))} تومان</b></div><div class="note">این فاکتور توسط PhotoBridge صادر شده است.</div>';
 const newHtml='<div class="accountDebt"><span>جمع بدهی عکاسی</span><b>\${_n(V(l))} تومان</b></div><div class="labContact" style="margin-top:5mm;border-top:1px dashed #d0d5dd;padding-top:3mm;color:#475467;font-size:10px;line-height:1.9"><div>شماره تماس لابراتوار: \${_n(t.lab_phone||"ثبت نشده")}</div><div>آدرس لابراتوار: \${_n(t.lab_address||"ثبت نشده")}</div></div><div class="note">این فاکتور توسط PhotoBridge صادر شده است.</div>';
 p=one(p,oldHtml,newHtml,'photographer A4 laboratory contact '+root);
 const oldPdf='s.fillText("فاکتور صادرشده در PhotoBridge · مبلغ‌ها بر اساس تعرفه ثبت‌شده در زمان صدور فاکتور است.",o,1640);';
 const newPdf='s.fillText("شماره تماس لابراتوار: "+String(t.lab_phone||"ثبت نشده"),o,1630,1060),s.fillText("آدرس لابراتوار: "+String(t.lab_address||"ثبت نشده"),o,1660,1060),s.fillText("فاکتور صادرشده در PhotoBridge · مبلغ‌ها بر اساس تعرفه ثبت‌شده در زمان صدور فاکتور است.",o,1700);';
 p=one(p,oldPdf,newPdf,'photographer A4 PDF laboratory contact '+root);
 return p;
}

'use strict';
function pb2060Within(row,range,date){const from=range.from?date(range.from):"",to=range.to?date(range.to):"";if(!from&&!to)return true;const day=date(row.paid_at||row.issued_at||row.created_at);return !!day&&(!from||day>=from)&&(!to||day<=to)}
function pb2060Common({view,customers,customer,onCustomer,from,to,onFrom,onTo,applied,onApply,onToday,onAll,busy=false}){
 const statement=view==="statement",today=$s(new Date()),appliedFrom=$s(applied.from),appliedTo=$s(applied.to),isToday=appliedFrom===today&&appliedTo===today,isAll=!appliedFrom&&!appliedTo,isCustom=!isAll&&!isToday;
 const options=x.useMemo(()=>[{value:"",label:statement?"انتخاب عکاسی":"همهٔ عکاسی‌ها"},...(customers||[]).map(row=>({value:String(row.id),label:row.name||row.mobile||"عکاسی"}))],[customers,statement]);
 const pick=typeof pb2050CustomerPicker==="function"?e.jsx(pb2050CustomerPicker,{value:customer,customers,onChange:onCustomer,statement}):e.jsx("div",{className:"pb1427InvoiceCustomerSelect pb2051PickerFrame",children:e.jsx(wn,{value:customer,options,searchable:true,searchPlaceholder:"جستجوی عکاسی…",ariaLabel:"انتخاب عکاسی",className:"pb2050CustomerPicker",menuClassName:"pb891FinanceSelectMenu pb2050CustomerMenu",onChange:onCustomer})});
 const button=(kind,label,active,action)=>e.jsx("button",{type:"button",className:"pb2060RangeButton "+(active?"active":""),"data-pb2060-range":kind,"aria-pressed":active,disabled:busy||statement&&!customer,onClick:action,children:label});
 return e.jsxs("div",{className:"pb2060Common",dir:"rtl",children:[pick,e.jsx("div",{className:"pb2060Date",children:e.jsx(Hs,{compact:true,value:from,onChange:onFrom,placeholder:"از تاریخ"})}),e.jsx("div",{className:"pb2060Date",children:e.jsx(Hs,{compact:true,value:to,onChange:onTo,placeholder:"تا تاریخ"})}),button("range","نمایش بازه",isCustom,onApply),button("today","امروز",isToday,onToday),button("all","نمایش همه",isAll,onAll)]});
}
function patch2060(source){
 if(source.includes("/* PB2060 shared finance toolbar */"))return source;
 const start=source.indexOf('function ub({role:t,'),end=source.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error("R2060 finance component");
 let p=source.slice(start,end+1);
 const once=(a,b)=>{if(p.split(a).length!==2)throw Error("R2060 anchor "+a.slice(0,100));p=p.replace(a,()=>b)};
 // Add separate receipt filter state before the receipt memo; the original customer filter is retained.
 once('[r,o]=x.useState([])', '[pb2060PayFrom,pb2060SetPayFrom]=x.useState(""),[pb2060PayTo,pb2060SetPayTo]=x.useState(""),[pb2060PayApplied,pb2060SetPayApplied]=x.useState({from:"",to:""}),[pb2060StatementTick,pb2060SetStatementTick]=x.useState(0),pb2060StatementRequest=x.useRef(null),[r,o]=x.useState([])');
 const stateAnchor='[D,de]=x.useState(!1)';
 once(stateAnchor,stateAnchor+', [pb2060StmtApplied,pb2060SetStmtApplied]=x.useState(()=>({from:_e,to:je}))');
 const payStart=p.indexOf("const pb1420Payments="),payEnd=p.indexOf(";",payStart);
 if(payStart<0||payEnd<=payStart)throw Error("R2060 receipt memo");
 p=p.slice(0,payEnd+1)+'const pb2060Receipts=x.useMemo(()=>t==="lab"&&w==="payments"&&(pb2060PayApplied.from||pb2060PayApplied.to)?pb1420Payments.filter(row=>pb2060Within(row,pb2060PayApplied,$s)):pb1420Payments,[pb1420Payments,pb2060PayApplied,t,w]);'+p.slice(payEnd+1);
 const ps=p.indexOf('w==="payments"&&e.jsx("div",{className:"card financeListCard pb1420Payments"'),pe=p.indexOf(',w==="statement"&&',ps);
 if(ps<0||pe<ps)throw Error("R2060 receipt panel");
 let list=p.slice(ps,pe);
 if(!list.includes("pb1420Payments.length")||!list.includes("pb1420Payments.map("))throw Error("R2060 receipt rendering");
 list=list.replaceAll("pb1420Payments.length","pb2060Receipts.length").replaceAll("pb1420Payments.map(","pb2060Receipts.map(");
 p=p.slice(0,ps)+list+p.slice(pe);
 // Apply date presets using React state before requesting statements. Older
 // native versions and web both use b() with its existing authenticated route.
 const endHook='const oe=async()=>';
 const logic=`const pb2060Valid=(from,to)=>{const error=!from||!to?"لطفاً تاریخ شروع و پایان بازه را انتخاب کنید.":$s(from)>$s(to)?"تاریخ شروع نباید بعد از تاریخ پایان باشد.":"";if(error){if(typeof pb2050Notice==="function")pb2050Notice(error);else alert(error);return false}return true};
 const pb2060InvoiceRange=(from,to)=>{_setPbInvFrom(from);_setPbInvTo(to);_setPbInvAppliedFrom(from);_setPbInvAppliedTo(to);Ie(1)};
 const pb2060ReceiptRange=(from,to)=>{pb2060SetPayFrom(from);pb2060SetPayTo(to);pb2060SetPayApplied({from,to})};
 const pb2060StatementRange=(from,to)=>{if(!z||D)return;Pe(from);d(to);pb2060SetStmtApplied({from,to});pb2060StatementRequest.current={customer:z,from,to};A(null);Re(1);pb2060SetStatementTick(v=>v+1)};
 x.useEffect(()=>{const pending=pb2060StatementRequest.current;if(!pending)return;pb2060StatementRequest.current=null;if(t==="lab"&&w==="statement"&&String(z)===String(pending.customer)){void b().catch(()=>{})}},[pb2060StatementTick,t,w,z]);
 x.useEffect(()=>{if(t==="lab"&&w==="invoices"&&typeof pb160Load==="function")void pb160Load("customers",false).catch(()=>{})},[t,w]);
 const pb2060Day=()=>$s(new Date()),pb2060Month=()=>({from:$s(new Date(Date.now()-29*864e5)),to:pb2060Day()});
 const pb2060Toolbar=()=>{const day=pb2060Day();if(w==="invoices")return e.jsx(pb2060Common,{view:w,customers:E,customer:pb1427InvoiceCustomer,onCustomer:id=>{pb1427SetInvoiceCustomer(id);Ie(1)},from:_pbInvFrom,to:_pbInvTo,onFrom:_setPbInvFrom,onTo:_setPbInvTo,applied:{from:_pbInvAppliedFrom,to:_pbInvAppliedTo},onApply:()=>{if(pb2060Valid(_pbInvFrom,_pbInvTo))pb2060InvoiceRange(_pbInvFrom,_pbInvTo)},onToday:()=>pb2060InvoiceRange(day,day),onAll:()=>pb2060InvoiceRange("","")});
 if(w==="payments")return e.jsx(pb2060Common,{view:w,customers:E,customer:pb1420PaymentCustomer,onCustomer:id=>{pb1420SetPaymentCustomer(id);q(id)},from:pb2060PayFrom,to:pb2060PayTo,onFrom:pb2060SetPayFrom,onTo:pb2060SetPayTo,applied:pb2060PayApplied,onApply:()=>{if(pb2060Valid(pb2060PayFrom,pb2060PayTo))pb2060ReceiptRange(pb2060PayFrom,pb2060PayTo)},onToday:()=>pb2060ReceiptRange(day,day),onAll:()=>pb2060ReceiptRange("","")});
 return e.jsx(pb2060Common,{view:w,customers:E,customer:z,onCustomer:id=>{q(id);A(null);Re(1)},from:_e,to:je,onFrom:Pe,onTo:d,applied:pb2060StmtApplied,busy:D,onApply:()=>{if(pb2060Valid(_e,je))pb2060StatementRange(_e,je)},onToday:()=>pb2060StatementRange(day,day),onAll:()=>pb2060StatementRange("","")})};
 `;
 once(endHook,logic+endHook);
 // Keep all legacy anchors for already-installed 160–162 runtime patchers and existing regression checks.
 // Disable rendering old controls on Lab, except original action buttons and their modal.
 const inv='className:t==="lab"?"pb1423InvoiceToolbar":"pb1423OtherInvoiceToolbar",children:[';
 once(inv,inv+'t==="lab"&&pb2060Toolbar(),');
 // Preserve literal legacy anchors (including the runtime-selected All button),
 // but do not mount the duplicate date pickers or calculate their calendars.
 const oldRange='t==="lab"&&e.jsxs("div",{className:"invoiceRangeToolbar"';
 once(oldRange,'false&&'+oldRange);
 const pay='className:"pb1176PaymentActions",children:[';
 once(pay,pay+'pb2060Toolbar(),');
 const stmt='className:"statementFilters",children:[';
 once(stmt,stmt+'t==="lab"&&pb2060Toolbar(),t!=="lab"&&e.jsxs(e.Fragment,{children:[');
 const stmtEnd=']}),e.jsxs("div",{className:"statementActions"';
 once(stmtEnd,']})]}),e.jsxs("div",{className:"statementActions"');
 // Preserve the selected photographer's totals in a separate compact strip,
 // rather than losing them or displacing the shared header controls.
 const metricStart=p.indexOf('pb1420PaymentCustomer&&_pb1177Customer&&e.jsxs("div",{className:"pb1177PaymentMetrics"');
 if(metricStart>=0){
  const call=p.indexOf('e.jsxs(',metricStart),open=p.indexOf('(',call);let depth=0,quote="",escaped=false,end=-1;
  for(let i=open;i<p.length;i++){const c=p[i];if(quote){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote="";continue}if(c==='"'||c==="'"||c==="`"){quote=c;continue}if(c==="(")depth++;else if(c===")"&&!--depth){end=i+1;break}}
  if(end<0||p[end]!==",")throw Error("R2060 receipt metric boundary");
  const metric=p.slice(metricStart,end).replace('className:"pb1177PaymentMetrics"','className:"pb1177PaymentMetrics pb2060ReceiptMetrics"');
  p=p.slice(0,metricStart)+p.slice(end+1);
  const receiptPanel=',w==="payments"&&e.jsx("div",{className:"card financeListCard pb1420Payments"';
  once(receiptPanel,',t==="lab"&&w==="payments"&&'+metric+receiptPanel);
 }
 const stmtActions='className:"statementActions",children:[';
 once(stmtActions,stmtActions+'t==="lab"&&e.jsx("button",{type:"button",className:"pb2060Month",disabled:!z||D,onClick:()=>{const range=pb2060Month();pb2060StatementRange(range.from,range.to)},children:"نمایش ماه آخر"}),');
 return source.slice(0,start)+p+source.slice(end+1)+"\n"+pb2060Within.toString()+"\n"+pb2060Common.toString()+"\n/* PB2060 shared finance toolbar */\n";
}
module.exports={patch2060,pb2060Within};

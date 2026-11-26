'use strict';
function pb2063ReadExtra(store,scope,view,force,clock,request,publish,current){
 if(store.scope!==scope){store.scope=scope;store.rows.clear()}
 let record=store.rows.get(view);
 if(!record){record={ready:false,at:0,flight:null,forced:false,trailing:null};store.rows.set(view,record)}
 if(record.flight){
  if(!force||record.forced)return record.flight;
  if(!record.trailing)record.trailing=record.flight.then(()=>{record.trailing=null;if(current()===scope)return pb2063ReadExtra(store,scope,view,true,clock,request,publish,current)});
  return record.trailing;
 }
 if(!force&&record.ready&&clock()-record.at<10000)return Promise.resolve();
 if(!record.ready)publish("loading");
 record.forced=force;
 const pending=Promise.resolve().then(request).then(data=>{
  if(current()!==scope||store.scope!==scope)return;
  record.ready=true;record.at=clock();publish("ready",data);
 },()=>{if(current()===scope&&store.scope===scope&&!record.ready)publish("error")});
 record.flight=pending;
 const clear=()=>{if(record.flight===pending){record.flight=null;record.forced=false}};
 pending.then(clear,clear);
 return pending;
}
function patchFinance(source){
 if(source.includes("/* PB2063 native focused finance */"))return source;
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error("R2063 native finance anchor "+a.slice(0,100));return s.replace(a,()=>b)};
 const a=source.indexOf("function ub({role:t,"),b=source.indexOf("}function hb(",a);
 if(a<0||b<a)throw Error("R2063 finance component");
 let f=source.slice(a,b+1);
 f=once(f,"pb2051ReceiptsFlight=x.useRef(null)","pb2051ReceiptsFlight=x.useRef(null),pb2063ExtraStore=x.useRef({scope:null,rows:new Map()}),[pb2063ExtraStates,pb2063SetExtraStates]=x.useState({})");
 const helper='const pb2063Scope=()=>JSON.stringify([Sr(),oh(),yg()]);const pb2063ExtraStatus=view=>{const state=pb2063ExtraStates[view];return state?.scope===pb2063Scope()?state.status:"loading"};const pb2063LoadExtra=(view,force=false)=>{const scope=pb2063Scope();return pb2063ReadExtra(pb2063ExtraStore.current,scope,view,force,Date.now,()=>Me("/api/lab/finance/"+view),(status,data)=>{if(status==="ready"){if(view==="expenses")I(data?.expenses||[]);else if(view==="ledger")k(data?.transactions||[])}pb2063SetExtraStates(previous=>({...previous,[view]:{scope,status}}))},pb2063Scope)};';
 f=once(f,"const pb1569FinanceLoader=x.useRef(null);",helper+"const pb1569FinanceLoader=x.useRef(null);");
 // The inspected expense GET reads only finance_expenses, users and expense
 // corrections; unlike the invoice documents, balance and ledger it is not
 // affected by invoice discount reconciliation.
 const start='const extraPath=w==="expenses"?"/api/lab/finance/expenses":w==="ledger"?"/api/lab/finance/ledger":null;const Ot=await Me(ke);';
 f=once(f,start,'const extraPath=w==="expenses"?"/api/lab/finance/expenses":w==="ledger"?"/api/lab/finance/ledger":null;const pb2063Expense=w==="expenses"?pb2063LoadExtra("expenses",pb2051InvoicesReady):null;const Ot=await Me(ke);');
 const old='const extra=extraPath?Me(extraPath).then(data=>{if(w==="expenses")I(data?.expenses||[]);if(w==="ledger")k(data?.transactions||[])}):Promise.resolve();';
 f=once(f,old,'const extra=pb2063Expense||(extraPath?pb2063LoadExtra(w,pb2051InvoicesReady):Promise.resolve());');
 f=once(f,'if(t!=="lab"||!pb1569FinanceReady||pb1569LoadedFinanceView.current===w)return;','if(t!=="lab"||(w!=="expenses"&&!pb2051InvoicesReady)||pb1569LoadedFinanceView.current===w)return;');
 f=once(f,'},[w,t,pb1569FinanceReady]);','},[w,t,pb2051InvoicesReady]);');
 f=once(f,'if(w==="payments"){if(!pb2051ReceiptsLoaded.current)pb2051LoadReceipts();return;}','if(w==="payments"){if(!pb2051ReceiptsLoaded.current)pb2051LoadReceipts();return;}if(w==="expenses"||w==="ledger"){void pb2063LoadExtra(w);return;}');
 const before='(m&&!(t==="lab"&&pb2051InvoicesReady&&["invoices","payments","statement"].includes(w)))?';
 const after='(t==="lab"&&["expenses","ledger"].includes(w)&&pb2063ExtraStatus(w)!=="ready")?e.jsxs("div",{className:"card loadingBox",role:"status",children:[pb2063ExtraStatus(w)==="error"?"دریافت اطلاعات انجام نشد.":"در حال دریافت اطلاعات مالی…",pb2063ExtraStatus(w)==="error"&&e.jsx("button",{type:"button",className:"primary",onClick:()=>pb2063LoadExtra(w,true),children:"تلاش مجدد"})]}):(m&&!(t==="lab"&&(w==="expenses"&&pb2063ExtraStatus(w)==="ready"||pb2051InvoicesReady&&["invoices","payments","statement","ledger"].includes(w))))?';
 f=once(f,before,after);
 return source.slice(0,a)+f+source.slice(b+1)+"\n"+pb2063ReadExtra.toString()+"\n/* PB2063 native focused finance */\n";
}
module.exports={pb2063ReadExtra,patchFinance};

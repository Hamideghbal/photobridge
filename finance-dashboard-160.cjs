'use strict';
const state=",pb160ReadyRef=x.useRef({}),[pb160Ready,pb160SetReady]=x.useState({}),pb160Flights=x.useRef(new Map()),pb160Alive=x.useRef(true),pb160RangeRef=x.useRef(\"\"),[pb160Search,pb160SetSearch]=x.useState(\"\"),[pb160Page,pb160SetPage]=x.useState(1),pb160Range=()=>{const params=new URLSearchParams;Le&&params.set(\"from\",$s(Le));Ke&&params.set(\"to\",$s(Ke));return params.toString()},pb160Load=async(name,force=false)=>{\n const range=pb160Range(),key=name===\"overview\"||name===\"customers\"?name+\"?\"+range:name;\n if(!force&&pb160ReadyRef.current[key])return;\n if(pb160Flights.current.has(key))return pb160Flights.current.get(key);\n const task=(async()=>{\n  const url=name===\"overview\"?\"/api/lab/finance/summary?\"+range+\"&pbNativeOverview=dashboard\":name===\"customers\"?\"/api/lab/finance/summary?\"+range+\"&pbNativeOverview=live\":name===\"invoices\"?\"/api/lab/invoices\":\"/api/lab/finance/\"+name;\n  const data=await Me(url);\n  if(!pb160Alive.current)return;\n  if((name===\"overview\"||name===\"customers\")&&pb160RangeRef.current!==range)return;\n  if(name===\"overview\"||name===\"customers\"){if(!data.summary||typeof data.summary!==\"object\")throw Error(\"finance_summary_unavailable\");f(data.summary);if(name===\"customers\"){if(!Array.isArray(data.customers))throw Error(\"finance_customers_unavailable\");C(data.customers)}}\n  else if(name===\"invoices\"){if(!Array.isArray(data.invoices))throw Error(\"finance_invoices_unavailable\");o(data.invoices);if(typeof pb2051SetInvoicesReady===\"function\")pb2051SetInvoicesReady(true)}\n  else if(name===\"payments\"){if(!Array.isArray(data.payments))throw Error(\"finance_payments_unavailable\");S(data.payments);if(typeof pb2051SetReceiptsState===\"function\"){pb2051ReceiptsLoaded.current=true;pb2051SetReceiptsState(\"ready\")}}\n  else if(name===\"expenses\"){if(!Array.isArray(data.expenses))throw Error(\"finance_expenses_unavailable\");I(data.expenses)}\n  else if(name===\"ledger\"){if(!Array.isArray(data.transactions))throw Error(\"finance_ledger_unavailable\");k(data.transactions)}\n  const next={...pb160ReadyRef.current,[key]:true,[name]:true};if(name===\"customers\"){next.overview=true;next[\"overview?\"+range]=true}pb160ReadyRef.current=next;pb160SetReady(next);\n })();\n pb160Flights.current.set(key,task);try{return await task}finally{if(pb160Flights.current.get(key)===task)pb160Flights.current.delete(key)}\n},pb160Selected=async(view,force=false)=>{\n if(view===\"overview\"){if(force&&pb160ReadyRef.current.overview&&pb160ReadyRef.current.customers){await pb160Load(\"customers\",true)}else await pb160Load(\"overview\",force);return}\n if(view===\"photographers\"||view===\"statement\"){await pb160Load(\"customers\",force);return}\n if([\"invoices\",\"payments\",\"expenses\",\"ledger\"].includes(view))await Promise.all([pb160Load(view,force),pb160Load(\"customers\",force&&!pb160ReadyRef.current.customers)]);\n}";
const hooks="/* PB160 dashboard first */pb160RangeRef.current=pb160Range();\n x.useEffect(()=>{pb160Alive.current=true;return()=>{pb160Alive.current=false}},[t]);\n x.useEffect(()=>{if(t===\"lab\")void pb160Selected(w,false).catch(()=>{});},[t,w]);\n x.useEffect(()=>{if(t!==\"lab\"||!pb160Ready.overview)return;let closed=false;const timer=setTimeout(async()=>{for(const name of [\"customers\",\"invoices\",\"payments\"]){if(closed||!pb160Alive.current)return;try{await pb160Load(name,false)}catch{}}},150);return()=>{closed=true;clearTimeout(timer)}},[t,pb160Ready.overview]);\n const pb160Customers=x.useMemo(()=>w===\"photographers\"?E.filter(row=>!pb160Search.trim()||String((row.name||\"\")+\" \"+(row.mobile||\"\")).toLowerCase().includes(pb160Search.trim().toLowerCase())):[],[E,w,pb160Search]);\n x.useEffect(()=>{pb160SetPage(page=>Math.max(1,Math.min(page,Math.ceil(pb160Customers.length/20))))},[pb160Customers.length]);\n ";
function patchFinanceDashboard(source){
 if(source.includes('/* PB160 dashboard first */'))return source;
 const start=source.indexOf('function ub({role:t'),end=source.indexOf('}function hb(',start);
 if(start<0||end<start)return source;
 let part=source.slice(start,end+1);
 const replace=(a,b)=>{if(part.split(a).length!==2)throw Error('finance160_anchor:'+a.slice(0,70));part=part.replace(a,()=>b)};
 const panel=',e.jsxs("section",{className:"card financeMiniPanel receivablePanel"';
 const panelAt=part.indexOf(panel);
 if(panelAt<0)return source;
 const call=part.indexOf('(',panelAt);let depth=0,quote='',escaped=false,panelEnd=-1;
 for(let i=call;i<part.length;i++){const c=part[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='(')depth++;else if(c===')'&&!--depth){panelEnd=i+1;break}}
 if(panelEnd<0)throw Error('finance160_receivable_panel');
 part=part.slice(0,panelAt)+part.slice(panelEnd);
 const beforeInvoices=',w==="invoices"&&';
 const photographers='t==="lab"&&w==="photographers"&&e.jsxs("section",{className:"card financeMiniPanel receivablePanel pb160Photographers",children:[e.jsxs("div",{className:"financePanelHead",children:[e.jsx("b",{children:"عکاسی‌ها"}),e.jsx("input",{type:"search",value:pb160Search,placeholder:"جستجوی عکاسی…",onChange:event=>{pb160SetSearch(event.target.value);pb160SetPage(1)}})]}),e.jsx("div",{className:"receivableRows",children:pb160Customers.slice((pb160Page-1)*20,pb160Page*20).map(row=>e.jsxs("button",{type:"button",className:"receivableCustomerRow",onClick:()=>{q(String(row.id));A(null);M("statement")},children:[e.jsxs("span",{children:[e.jsx("b",{children:row.name}),e.jsx("small",{children:row.mobile||""})]}),e.jsx("strong",{children:Xe(row.balance)})]},row.id))}),!pb160Customers.length&&e.jsx(zn,{text:"عکاسی یافت نشد."}),pb160Customers.length>20&&e.jsxs("div",{className:"pagination",children:[e.jsx("button",{disabled:pb160Page<=1,onClick:()=>pb160SetPage(n=>n-1),children:"قبلی"}),e.jsx("span",{children:V(pb160Page)+" / "+V(Math.ceil(pb160Customers.length/20))}),e.jsx("button",{disabled:pb160Page*20>=pb160Customers.length,onClick:()=>pb160SetPage(n=>n+1),children:"بعدی"})]})]})';
 replace(beforeInvoices,','+photographers+beforeInvoices);
 replace('{value:"overview",label:"داشبورد"},{value:"invoices"', '{value:"overview",label:"داشبورد"},{value:"photographers",label:"عکاسی‌ها"},{value:"invoices"');
 const button='onClick:()=>M("overview"),children:"داشبورد"}),';
 replace(button,button+'t==="lab"&&e.jsx("button",{className:w==="photographers"?"active":"",onClick:()=>M("photographers"),children:"عکاسی‌ها"}),');
 const ke=',ke=t==="lab"?"/api/lab/invoices":"/api/customer/invoices",';
 replace(ke,state+ke);
 const loader=part.indexOf('pb1472Load=async()=>')>=0?part.indexOf('pb1472Load=async()=>'):part.indexOf('ce=async()=>');
 let labStart=part.indexOf('if(t==="lab"){',loader);
 const legacy='const Ot=await Me(ke);if(o(Ot.invoices||[]),t==="lab"){';
 const legacyAt=part.indexOf(legacy,loader);
 if(legacyAt>=0&&(labStart<0||legacyAt<labStart)){labStart=legacyAt;part=part.slice(0,labStart)+'if(t==="lab"){'+part.slice(labStart+legacy.length)}
 const elseAt=part.indexOf('}else{',labStart);
 if(loader<0||labStart<0||elseAt<labStart||elseAt-labStart>10000)throw Error('finance160_loader');
 if(!part.slice(labStart,elseAt).includes('/api/lab/finance/summary'))throw Error('finance160_summary_anchor');
 part=part.slice(0,labStart)+'if(t==="lab"){await pb160Selected(w,true);'+part.slice(elseAt);
 if(legacyAt>=0)part=part.replace('}else{const[At,Et]=await Promise.all([Me("/api/customer/finance/summary")','}else{const Ot=await Me(ke);o(Ot.invoices||[]);const[At,Et]=await Promise.all([Me("/api/customer/finance/summary")');
 part=part.replace('if(t!=="lab"||!pb1569FinanceReady||pb1569LoadedFinanceView.current===w)return;','if(t==="lab"||!pb1569FinanceReady||pb1569LoadedFinanceView.current===w)return;');
 const calc=part.indexOf('const Ve=');if(calc<0)throw Error('finance160_calculation_anchor');
 part=part.slice(0,calc)+hooks+part.slice(calc);
 const loading='?e.jsx("div",{className:"card loadingBox",children:"در حال دریافت اطلاعات مالی…"})';
 const at=part.indexOf(loading);if(at<0)throw Error('finance160_loading');
 const r2051='(m&&!(t==="lab"&&pb2051InvoicesReady&&["invoices","payments","statement"].includes(w)))';
 const from=part.slice(0,at).endsWith(r2051)?at-r2051.length:part[at-1]==='m'?at-1:-1;
 if(from<0)throw Error('finance160_loading_condition');
 const ready='(t==="lab"?(w==="overview"?!p:w==="statement"||w==="photographers"?!pb160Ready.customers:w==="accounting"?false:!pb160Ready[w]):m)';
 part=part.slice(0,from)+ready+part.slice(at);
 const bt=part.indexOf('bt=async()=>'),nt=part.indexOf(',Nt=',bt);
 if(bt>=0&&nt>bt){const old=part.slice(bt,nt);if(old.includes('/api/lab/finance/summary'))part=part.slice(0,bt)+'bt=async()=>{g(true);try{await pb160Load("overview",true)}finally{g(false)}}'+part.slice(nt)}
 const route='ly=new Set(["overview","invoices","payments","statement","expenses","ledger","accounting"])';
 if(source.split(route).length!==2)throw Error('finance160_route');
 return (source.slice(0,start)+part+source.slice(end+1)).replace(route,'ly=new Set(["overview","photographers","invoices","payments","statement","expenses","ledger","accounting"])');
}
module.exports={patchFinanceDashboard};

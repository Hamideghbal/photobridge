'use strict';
const state=",pb160ReadyRef=x.useRef({}),[pb160Ready,pb160SetReady]=x.useState({}),pb160Flights=x.useRef(new Map()),pb165ExtraTimes=x.useRef({}),pb165ScopeRef=x.useRef(null),pb165Scope=()=>JSON.stringify([Sr(),oh(),yg()]),[pb165Errors,pb165SetErrors]=x.useState({}),pb160Alive=x.useRef(true),pb160RangeRef=x.useRef(\"\"),[pb161StatementMode,pb161SetStatementMode]=x.useState(\"custom\"),pb161StatementSeq=x.useRef(0),pb161StatementCustomer=x.useRef(z),pb161StatementRange=(mode)=>{const end=new Date(),start=new Date(end.getTime()-29*864e5);return mode===\"all\"?{from:\"\",to:\"\"}:{from:new Date($s(start)+\"T12:00:00+03:30\").toISOString(),to:new Date($s(end)+\"T12:00:00+03:30\").toISOString()}},pb161ShowStatement=mode=>{const range=pb161StatementRange(mode);Pe(range.from);d(range.to);pb161SetStatementMode(mode);A(null);Re(1);void b(range).catch(()=>{})},pb160Range=()=>{const params=new URLSearchParams;Le&&params.set(\"from\",$s(Le));Ke&&params.set(\"to\",$s(Ke));return params.toString()},pb160Load=async(name,force=false)=>{\n const scope=pb165Scope();if(pb165ScopeRef.current!==scope){pb165ScopeRef.current=scope;pb160Flights.current.clear();pb160ReadyRef.current={};pb165ExtraTimes.current={};pb160SetReady({});pb165SetErrors({})}\n const range=pb160Range(),isSummary=[\"overview\",\"customers\",\"reconcile\"].includes(name),key=isSummary?name+\"?\"+range:name;\n if(!force&&pb160ReadyRef.current[key])return;\n if(pb160Flights.current.has(key))return pb160Flights.current.get(key);\n const task=(async()=>{\n  const url=name===\"overview\"?\"/api/lab/finance/summary?\"+range+\"&pbNativeOverview=dashboard\":name===\"customers\"||name===\"reconcile\"?\"/api/lab/finance/summary?\"+range+\"&pbNativeOverview=\"+(name===\"customers\"?\"customers\":\"live\"):name===\"invoices\"?\"/api/lab/invoices?pbNativeInvoiceView=\"+(force?\"live\":\"snapshot\"):name===\"payments\"?\"/api/lab/finance/payments?pbNativeReceiptView=\"+(force?\"live\":\"snapshot\"):\"/api/lab/finance/\"+name;\n  const data=await Me(url);\n  if(!pb160Alive.current||pb165Scope()!==scope||pb165ScopeRef.current!==scope)return;\n  if(isSummary&&pb160RangeRef.current!==range)return;\n  if(isSummary){if(!data.summary||typeof data.summary!==\"object\")throw Error(\"finance_summary_unavailable\");f(data.summary);if(name!==\"overview\"){if(!Array.isArray(data.customers))throw Error(\"finance_customers_unavailable\");C(data.customers)}}\n  else if(name===\"invoices\"){if(!Array.isArray(data.invoices))throw Error(\"finance_invoices_unavailable\");o(data.invoices);if(typeof pb2051SetInvoicesReady===\"function\")pb2051SetInvoicesReady(true)}\n  else if(name===\"payments\"){if(!Array.isArray(data.payments))throw Error(\"finance_payments_unavailable\");S(data.payments);if(typeof pb2051SetReceiptsState===\"function\"){pb2051ReceiptsLoaded.current=true;pb2051SetReceiptsState(\"ready\")}}\n  else if(name===\"expenses\"){if(!Array.isArray(data.expenses))throw Error(\"finance_expenses_unavailable\");I(data.expenses)}\n  else if(name===\"ledger\"){if(!Array.isArray(data.transactions))throw Error(\"finance_ledger_unavailable\");k(data.transactions)}\n  if(name===\"expenses\"||name===\"ledger\")pb165ExtraTimes.current[name]=Date.now();const next={...pb160ReadyRef.current,[key]:true,[name]:true};if(name===\"customers\"||name===\"reconcile\"){next.customers=true;next[\"customers?\"+range]=true;next.overview=true;next[\"overview?\"+range]=true}pb160ReadyRef.current=next;pb160SetReady(next);\n })();\n pb160Flights.current.set(key,task);try{const result=await task;if(pb160Alive.current&&pb165Scope()===scope)pb165SetErrors(old=>old[name]?{...old,[name]:false}:old);return result}catch(error){if(pb160Alive.current&&pb165Scope()===scope)pb165SetErrors(old=>({...old,[name]:true}));throw error}finally{if(pb160Flights.current.get(key)===task)pb160Flights.current.delete(key)}\n},pb160Selected=async(view,force=false,navigation=false)=>{\n if(view===\"overview\"){\n  if(force&&pb160ReadyRef.current.overview&&pb160ReadyRef.current.customers)await pb160Load(\"reconcile\",true);\n  else await pb160Load(\"overview\",force);\n  return;\n }\n if(view===\"statement\"){\n  if(!pb160ReadyRef.current.customers)await pb160Load(\"customers\",false);\n  else if(force)await pb160Load(\"reconcile\",true);\n  return;\n }\n if(view===\"invoices\"){\n  // Paint the verified local list first. Refresh only invoices, not all five finance routes.\n  if(!pb160ReadyRef.current.invoices)await pb160Load(\"invoices\",false);\n  if(force)await pb160Load(\"invoices\",true);\n  void pb160Load(\"customers\",false).catch(()=>{});\n  return;\n }\n if(view===\"payments\"){\n  if(!pb160ReadyRef.current.payments)await pb160Load(\"payments\",false);\n  // The dropdown and discount receipts also need these inputs, but never gate first payment paint.\n  void pb160Load(\"customers\",false).catch(()=>{});void pb160Load(\"invoices\",false).catch(()=>{});\n  if(force)await pb160Load(\"payments\",true);\n  return;\n }\n if([\"expenses\",\"ledger\"].includes(view)){\n  const refresh=force&&(!navigation||!pb165ExtraTimes.current[view]||Date.now()-pb165ExtraTimes.current[view]>=10000);\n  const customers=()=>pb160Load(\"customers\",false).catch(()=>{});\n  if(view===\"expenses\"){const pending=pb160Load(view,refresh);void customers();await pending;}\n  else{const scope=pb165Scope();try{await pb160Load(\"invoices\",false);if(scope!==pb165Scope())return;if(refresh)await pb160Load(\"invoices\",true);if(scope!==pb165Scope())return;const pending=pb160Load(view,refresh);void customers();await pending;}catch(error){if(pb160Alive.current&&scope===pb165Scope())pb165SetErrors(old=>({...old,ledger:true}));throw error}}\n }\n}";
const hooks="/* PB160 dashboard first */pb160RangeRef.current=pb160Range();pb161StatementCustomer.current=z;\n x.useEffect(()=>{pb160Alive.current=true;return()=>{pb160Alive.current=false}},[t]);\n x.useEffect(()=>{if(t===\"lab\")void pb160Selected(w,true,true).catch(()=>{});},[t,w]);\n x.useEffect(()=>{if(t!==\"lab\"||!pb160Ready.overview)return;let closed=false;const timer=setTimeout(async()=>{await Promise.allSettled([\"invoices\",\"payments\"].map(name=>pb160Load(name,false)));for(const name of [\"customers\",\"reconcile\"]){if(closed||!pb160Alive.current)return;try{await pb160Load(name,false)}catch{}}},150);return()=>{closed=true;clearTimeout(timer)}},[t,pb160Ready.overview]);\n";
function patchFinanceDashboard(source){
 // A newer server can supply a shared toolbar. Keep invoice/receipt Today,
 // but never render Today in the statement (account ledger).
 if(!source.includes('!statement&&button("today","امروز",isToday,onToday)'))source=source.replace('button("today","امروز",isToday,onToday)','!statement&&button("today","امروز",isToday,onToday)');
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
 const ke=',ke=t==="lab"?"/api/lab/invoices":"/api/customer/invoices",';
 replace(ke,state+ke);
 const loader=part.indexOf('pb1472Load=async()=>')>=0?part.indexOf('pb1472Load=async()=>'):part.indexOf('ce=async()=>');
 let labStart=part.indexOf('if(t==="lab"){',loader);
 const legacyPlain='const Ot=await Me(ke);if(o(Ot.invoices||[]),t==="lab"){';
 const legacyQuiet='const Ot=await Me(ke);pb1526Loaded.current=true;if(o((Ot.invoices||[]).slice().sort((a,b)=>(Date.parse(b.issued_at)||0)-(Date.parse(a.issued_at)||0)||String(b.id).localeCompare(String(a.id)))),t==="lab"){';
 const legacy=part.includes(legacyQuiet)?legacyQuiet:legacyPlain;
 const legacyAt=part.indexOf(legacy,loader);
 if(legacyAt>=0&&(labStart<0||legacyAt<labStart)){labStart=legacyAt;part=part.slice(0,labStart)+'if(t==="lab"){'+part.slice(labStart+legacy.length)}
 const elseAt=part.indexOf('}else{',labStart);
 if(loader<0||labStart<0||elseAt<labStart||elseAt-labStart>10000)throw Error('finance160_loader');
 if(!part.slice(labStart,elseAt).includes('/api/lab/finance/summary'))throw Error('finance160_summary_anchor');
 part=part.slice(0,labStart)+'if(t==="lab"){await pb160Selected(w,true);'+(legacy===legacyQuiet?'pb1526Loaded.current=true;':'')+part.slice(elseAt);
 if(legacyAt>=0)part=part.replace('}else{const[At,Et]=await Promise.all([Me("/api/customer/finance/summary")','}else{const Ot=await Me(ke);'+(legacy===legacyQuiet?'pb1526Loaded.current=true;o((Ot.invoices||[]).slice().sort((a,b)=>(Date.parse(b.issued_at)||0)-(Date.parse(a.issued_at)||0)||String(b.id).localeCompare(String(a.id))));':'o(Ot.invoices||[]);')+'const[At,Et]=await Promise.all([Me("/api/customer/finance/summary")');
 part=part.replace('if(t!=="lab"||!pb1569FinanceReady||pb1569LoadedFinanceView.current===w)return;','if(t==="lab"||!pb1569FinanceReady||pb1569LoadedFinanceView.current===w)return;');
 const calc=part.indexOf('const Ve=');if(calc<0)throw Error('finance160_calculation_anchor');
 part=part.slice(0,calc)+hooks+part.slice(calc);
 const loading='?e.jsx("div",{className:"card loadingBox",children:"در حال دریافت اطلاعات مالی…"})';
 const at=part.indexOf(loading);if(at<0)throw Error('finance160_loading');
 const r2051='(m&&!(t==="lab"&&pb2051InvoicesReady&&["invoices","payments","statement"].includes(w)))';
 const from=part.slice(0,at).endsWith(r2051)?at-r2051.length:part[at-1]==='m'?at-1:-1;
 if(from<0)throw Error('finance160_loading_condition');
 const ready='(t==="lab"?(w==="overview"?!p:w==="statement"?!pb160Ready.customers:w==="accounting"?false:!pb160Ready[w]):m)';
 part=part.slice(0,from)+'(t==="lab"&&["expenses","ledger"].includes(w)&&!pb160Ready[w]&&pb165Errors[w])?e.jsxs("div",{className:"card loadingBox",children:["دریافت اطلاعات انجام نشد.",e.jsx("button",{type:"button",onClick:()=>{pb165SetErrors(old=>({...old,[w]:false}));void pb160Selected(w,true).catch(()=>{})},children:"تلاش مجدد"})]}):'+ready+part.slice(at);
 const bt=part.indexOf('bt=async()=>'),nt=part.indexOf(',Nt=',bt);
 if(bt>=0&&nt>bt){const old=part.slice(bt,nt);if(old.includes('/api/lab/finance/summary'))part=part.slice(0,bt)+'bt=async()=>{g(true);try{await pb160Load("overview",true)}finally{g(false)}}'+part.slice(nt)}
 // Pass explicit dates into the existing statement request, never depend on asynchronous React state.
 const statementStart=part.indexOf('b=async(Je,Ot=!1)=>'),statementEnd=part.indexOf('finally{de(!1)}}',statementStart);
 if(statementStart<0||statementEnd<0)throw Error('finance161_statement_loader');
 let statement=part.slice(statementStart,statementEnd+'finally{de(!1)}}'.length);
 const exact=(a,b)=>{if(statement.split(a).length!==2)throw Error('finance161_statement:'+a);statement=statement.replace(a,()=>b)};
 exact('const At=z;','const At=z,pb161Seq=++pb161StatementSeq.current,pb161From=Je&&typeof Je==="object"&&"from" in Je?Je.from:_e,pb161To=Je&&typeof Je==="object"&&"to" in Je?Je.to:je;');
 exact('_e&&Et.set("from",$s(_e)),je&&Et.set("to",$s(je))','pb161From&&Et.set("from",$s(pb161From)),pb161To&&Et.set("to",$s(pb161To))');
 exact('A(dn);','if(t==="lab"&&(pb161StatementSeq.current!==pb161Seq||pb161StatementCustomer.current!==At))return null;A(dn);');
 exact('finally{de(!1)}}','finally{if(pb161StatementSeq.current===pb161Seq)de(!1)}}');
 part=part.slice(0,statementStart)+statement+part.slice(statementEnd+'finally{de(!1)}}'.length);
 // Reuse existing date fields, print/PDF, and server-side opening balances.
 const filters=part.indexOf('className:"statementFilters"'),actions=part.indexOf('className:"statementActions"',filters);
 if(filters<0||actions<filters)throw Error('finance161_statement_filters');
 let filter=part.slice(filters,actions);
 const buttons='t==="lab"&&e.jsx("button",{type:"button",className:"pb2047StatementRange "+(pb161StatementMode==="all"?"primary active":""),"aria-pressed":pb161StatementMode==="all",disabled:D||!z,onClick:()=>pb161ShowStatement("all"),children:"نمایش کامل حساب معین"}),t==="lab"&&e.jsx("button",{type:"button",className:"pb2047StatementRange "+(pb161StatementMode==="month"?"primary active":""),"aria-pressed":pb161StatementMode==="month",disabled:D||!z,onClick:()=>pb161ShowStatement("month"),children:"نمایش ماه آخر"}),';
 filter=filter.replace('children:[','children:['+(filter.includes('pb2060Toolbar()')?'':buttons));
 filter=filter.replaceAll('Pe(Je),Re(1)','Pe(Je),pb161SetStatementMode("custom"),Re(1)').replaceAll('d(Je),Re(1)','d(Je),pb161SetStatementMode("custom"),Re(1)').replaceAll('Pe(""),Re(1)','Pe(""),pb161SetStatementMode("custom"),Re(1)').replaceAll('d(""),Re(1)','d(""),pb161SetStatementMode("custom"),Re(1)');
 part=part.slice(0,filters)+filter+part.slice(actions);
 // The applied dates, not the typed dates, determine the active invoice button.
 const all='className:"invoiceRangeAll"';
 if(part.split(all).length===2)part=part.replace(all,'className:"invoiceRangeAll"+(!_pbInvAppliedFrom&&!_pbInvAppliedTo?" primary active":""),"aria-pressed":!_pbInvAppliedFrom&&!_pbInvAppliedTo');
 else{
  const label='children:"نمایش همه"';
  const pos=part.indexOf(label,part.indexOf('w==="invoices"&&'));
  if(pos<0)throw Error('finance161_invoice_all');
  const btn=part.lastIndexOf('e.jsx("button",{',pos);
  const block=part.slice(btn,pos+label.length);
  if(!block.includes('_setPbInvAppliedFrom("")')||!block.includes('_setPbInvAppliedTo("")'))throw Error('finance161_invoice_all_action');
  const changed=block.replace(/className:"([^"]+)"/,'className:"$1"+(!_pbInvAppliedFrom&&!_pbInvAppliedTo?" primary active":""),"aria-pressed":!_pbInvAppliedFrom&&!_pbInvAppliedTo');
  if(changed===block)throw Error('finance161_invoice_all_class');
  part=part.slice(0,btn)+changed+part.slice(pos+label.length);
 }
 const allLabel='children:"نمایش همه"';
 const allPos=part.indexOf(allLabel,part.indexOf('w==="invoices"&&'));
 if(allPos<0)throw Error('finance162_all_button');
 const allStart=part.lastIndexOf('e.jsx("button",{',allPos);
 let allBlock=part.slice(allStart,allPos+allLabel.length);
 if(!allBlock.includes('_setPbInvAppliedFrom("")')||!allBlock.includes('_setPbInvAppliedTo("")'))throw Error('finance162_all_action');
 allBlock=allBlock.replace('type:"button",','type:"button","data-pb162-invoice-all":true,');
 if(!allBlock.includes('data-pb162-invoice-all'))throw Error('finance162_all_marker');
 part=part.slice(0,allStart)+allBlock+part.slice(allPos+allLabel.length);
 return source.slice(0,start)+part+source.slice(end+1);

}
module.exports={patchFinanceDashboard};

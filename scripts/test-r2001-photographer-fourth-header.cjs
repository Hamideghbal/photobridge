const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const a=ui.indexOf('function ub({role:t,');
const b=ui.indexOf('}function hb(',a);
const finance=ui.slice(a,b+1);
const css=fs.readFileSync('dist/web/photobridge-r2001-photographer-fourth-header.css','utf8');
test('R2001 photographer summary/detailed buttons work with no lab customer selected',()=>{
 const start=finance.indexOf('e.jsxs("section",{className:"card statementToolbar"');
 const end=finance.indexOf(',_&&e.jsxs(e.Fragment',start);
 assert(start>=0&&end>start);
 const calls=[],jsx=(type,props)=>({type,...props});
 const context={
  e:{jsx,jsxs:jsx,Fragment:'fragment'},t:'customer',z:'',_e:'',je:'',
  E:[],q(){},A(){},Re(){},Pe(){},d(){},Hs:'PersianDate',D:false,
  _: {summary:{closing:0},rows:[]},r:[],st:[],Xe:x=>String(x),R:x=>x,
  b:()=>calls.push('network'),
  _pb1177StmtMode:'summary',_setPb1177StmtMode:x=>calls.push(x),
  Jy:()=>calls.push('print'),window:{pb1176Finance:{detailed:()=>calls.push('detailed-print')}},
  tt:()=>calls.push('pdf'),
 };
 const tree=vm.runInNewContext(finance.slice(start,end),context);
 const actions=tree.children[1].children.filter(Boolean);
 const summary=actions.find(item=>item.children==='نمایش خلاصه');
 const detailed=actions.find(item=>item.children==='نمایش با جزئیات');
 assert(summary&&!summary.disabled,'photographer can select summary even when z empty');
 assert(detailed&&!detailed.disabled,'photographer can select detail even when z empty');
 summary.onClick();detailed.onClick();
 assert.deepEqual(calls,['summary','detailed'],'customer changes render state without unnecessary fetch');
 assert(finance.includes('_pb1177StmtMode==="detailed"&&Je.reference_type==="invoice"'));
 assert(finance.includes('PB1441StatementDetail,{row:Je,invoices:r}'));
});
test('R2001 lab modes retain guarded customer selection and server refresh',()=>{
 assert(finance.includes('disabled:D||t==="lab"&&!z'));
 assert(finance.includes('_setPb1177StmtMode("summary");t==="lab"&&b()'));
 assert(finance.includes('_setPb1177StmtMode("detailed");t==="lab"&&b()'));
});
test('R2001 photographer invoice keeps one Today preset and period-scoped metrics',()=>{
 assert(finance.includes('className:"pb1176Today "'));
 assert(finance.includes('showToday:t==="lab"'));
 assert(finance.includes('className:"pb2000CustomerMetrics pb2001InvoiceMetrics"'));
 assert(finance.includes('Ve.filter(Je=>(Je.document_type||"invoice")==="invoice")'));
 assert(finance.includes('Number(Je.paid_total||0)'));
 assert(finance.includes('Number(Je.balance??'));
 assert(finance.includes('false&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})'));
 assert(finance.includes('e.jsx("span",{children:t==="lab"?"بخش حسابداری":"بخش مالی"})'));
 if(finance.includes('_pbRecorded='))assert(finance.includes('_pbRecorded=t==="lab"&&'),'accounting flag must remain laboratory-only');
 if(finance.includes('accountingTransferredBadge'))assert(finance.includes('t==="lab"&&Je.accounting_exported&&e.jsx("small"'),'accounting exported badge must remain laboratory-only');
 const start=ui.indexOf('function Hs('),end=ui.indexOf('}function ',start+12);
 const picker=ui.slice(start,end+1);
 assert(picker.includes('_pb2001ShowToday&&e.jsxs("button",{type:"button",className:"calendarTodayBtn"'));
});
test('R2001 fixed fourth header is white, single-row, scoped to photographer',()=>{
 assert(css.includes('html.pb1126Embedded body #root .photographerRolePageScrollArea'));
 assert(css.includes('position:fixed!important'));
 assert(css.includes('height:60px!important'));
 assert(css.includes('background:#fff!important'));
 assert(css.includes('flex-flow:row nowrap!important'));
 assert(css.includes('customerStatementWorkspace>.statementToolbar'));
 assert(css.includes('pb2001InvoiceMetrics'));
 assert(!css.includes('.labRolePageScrollArea'));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(html.includes('photographerFinanceFourth=r2001'));
 const direct=html.includes('photobridge-r2001-photographer-fourth-header.css');
 if(!direct){
  const match=html.match(/photobridge-boot-[a-f0-9]{16}\.css/);
  assert(match,'bundled stylesheet is served');
  const boot=fs.readFileSync('dist/web/assets/'+match[0],'utf8');
  assert(boot.includes('R2001 | Photographer financial fourth header'));
 }
});

test('R2002 actual legacy Today and accounting counts render only for laboratory',()=>{
 const legacyToday='t==="lab"&&e.jsx("button",{type:"button",className:"pb1201InvoiceToday"';
 const counts='t==="lab"&&e.jsxs("div",{className:"pb1201InvoiceCounts"';
 assert.equal(finance.split(legacyToday).length,2);
 assert.equal(finance.split(counts).length,2);
 assert.equal(finance.split('className:"pb1201InvoiceToday"').length,2);
 assert.equal(finance.split('className:"pb1201InvoiceCounts"').length,2);
 assert(finance.includes('className:"pb1176Today "'));
 assert(!finance.includes('t==="lab"&&e.jsx("button",{type:"button",className:"pb1176Today "'));
 assert(ui.includes('/* PB2002 photographer finance polish */'));
});
test('R2002 top separator and contrasting ledger controls survive stylesheet delivery',()=>{
 assert(css.includes('border-block-start:1px solid #cbd5e1!important'));
 assert(css.includes('button.pb1177ViewMode:not(.active)'));
 assert(css.includes('button:is(.pb1177ViewMode.active,.pb1177Print)'));
 assert(css.includes('color:#344054!important;-webkit-text-fill-color:#344054!important'));
 assert(css.includes('color:#fff!important;-webkit-text-fill-color:#fff!important'));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(html.includes('photographerFinancePolish=r2002'));
 if(!html.includes('photobridge-r2001-photographer-fourth-header.css')){
  const match=html.match(/photobridge-boot-[a-f0-9]{16}\.css/);
  assert(match);
  assert(fs.readFileSync('dist/web/assets/'+match[0],'utf8').includes('R2002 | Photographer finance fourth-header separation'));
 }
});

test('R2003 photographer date controls are statement-style and presets reset actual filtering state',()=>{
 assert(finance.includes('className:"statementDateLabel pb2003InvoiceDateLabel"'));
 assert(finance.includes('className:"statementDateControl"'));
 assert(finance.includes('if(t!=="lab")c("");_setPbInvFrom(day)'));
 assert(finance.includes('t!=="lab"&&c(""),_setPbInvFrom("")'));
 assert(finance.includes('false&&e.jsxs("div",{className:"pb2000CustomerMetrics"'));
 assert(finance.includes('pb2003Day(Je.issued_at||Je.created_at)'));
 assert(css.includes('linear-gradient(90deg,transparent 0%,#cbd5e1'));
 assert(css.includes('border-radius:0 10px 10px 0!important'));
 assert(css.includes('border-radius:10px 0 0 10px!important'));
 const guide=fs.readFileSync('dist/web/photobridge-workflow-guides-v572.js','utf8');
 assert(guide.includes('>راهنما</em>'));
 assert(guide.includes("mount('print',print)"));
 assert(guide.includes("mount('album',album)"));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert(html.includes('photographerDateFilters=r2003'));
 assert(html.includes('splitGuide=r2003'));
});

test('R2004 date picker role wrapper preserves existing lab picker and photographer clear control',()=>{
 for(const [key,field,set,label] of [['From','_pbInvFrom','_setPbInvFrom','از تاریخ'],['To','_pbInvTo','_setPbInvTo','تا تاریخ']]){
  const marker='compact:!0,value:'+field+',onChange:'+set+',placeholder:"'+label+'",showToday:t==="lab"';
  assert.equal(finance.split(marker).length-1,2,'one preserved lab picker and one customer picker');
  const start=finance.indexOf('(t==="lab"?e.jsx(Hs,{'+marker);
  assert(start>=0,'lab picker remains original');
  const fragment=finance.slice(start,start+1600);
  assert(fragment.includes('className:"statementDateLabel pb2003InvoiceDateLabel"'));
  assert(fragment.includes('_setPbInvApplied'+key+'("");Ie(1)'));
 }
 assert(css.includes('label:has(.pb2003InvoiceDateLabel)'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('financeDateBuild=r2004'));
});

test('R2005 archive and finance guide uploads are independent for mobile and desktop',()=>{
 const guide=fs.readFileSync('dist/web/photobridge-workflow-guides-v572.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(guide));
 for(const kind of ['archive','finance'])for(const device of ['mobile','desktop'])assert(guide.includes("key:'"+kind+"-"+device+"',kind:'"+kind+"',device:'"+device+"'"));
 assert(guide.includes("['print','album','archive','finance'].includes(kind)"));
 assert(guide.includes('for(const s of slots)'));
 assert(guide.includes("for(const kind of ['archive','finance'])"));
 assert(guide.includes('button.previousElementSibling!==target'));
 assert(guide.includes('mountUtilityGuides();'));
 assert(guide.includes('if(window.self!==window.top)return null'));
 assert(guide.includes('link[href*="photobridge-boot-"]'));
 assert(guide.includes('if(style)return; // R2005'));
 assert(css.includes('button.pb2005UtilityGuide'));
 assert(css.includes('animation:none!important;transition:none!important'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('utilityGuides=r2005'));
});

test('R2006 actual F37 mobile header reconciles first-entry and preserves tab nodes',()=>{
 const header=fs.readFileSync('dist/web/photobridge-v904r100f41-header-date-name-fit.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(header));
 assert(header.includes("const id='print:'+kind"));
 assert(header.includes("const sig=m+'|'+aa.map(a=>a.id+':'+a.label).join('|')"));
 assert(header.includes("if(button.classList.contains('active')!==!!a.active)"));
 assert(header.includes("const waitingPrint=m==='print'"));
 assert(header.includes("attributeFilter:['class']"));
 assert(header.includes("for(const ms of [80,250,600,1200,2500,4500])"));
 assert(header.includes('pb2006MobileGuide'));
 assert(header.includes("if(id.startsWith('print:')){actions('print');source=sourceMap.get(id)}"));
 assert(css.includes('#pbF37Tabs.pb2006PrintTabs'));
 const guide=fs.readFileSync('dist/web/photobridge-workflow-guides-v572.js','utf8');
 assert(guide.includes("if(document.querySelector?.('#pbF37Tabs.pb2006PrintTabs'))return null"));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('mobileHeader=r2006'));
});

test('R2007 canonical print entry and archive in mobile menu; desktop guides use actual utility parent',()=>{
 const header=fs.readFileSync('dist/web/photobridge-v904r100f41-header-date-name-fit.js','utf8');
 const chooser=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
 const guide=fs.readFileSync('dist/web/photobridge-workflow-guides-v572.js','utf8');
 const nav=fs.readFileSync('dist/web/photobridge-r1099-photographer-tabs.js','utf8');
 for(const text of [header,chooser,guide,nav])assert.doesNotThrow(()=>new vm.Script(text));
 assert(header.includes("['finance','.photographerPrintCommonAction.finance','مالی']];"));
 assert(header.includes('pb2007ArchiveMenuPair'));
 assert(header.includes("location.assign('/photographer/archive?workspace=print')"));
 assert(header.includes("const active=kind==='print'?"));
 assert(chooser.includes("u.pathname='/photographer/orders/flow';u.searchParams.set('workspace','print')"));
 assert(nav.includes("location.replace('/photographer/orders?workspace=print')"));
 assert(guide.includes('return target?.parentElement||null'));
 assert(css.includes('repeat(3,minmax(0,1fr))'));
 assert(ui.includes('/* PB2007 canonical print route */'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('canonicalPrint=r2007'));
});

test('R2008 generated Print context patch emits real line breaks and valid executable JS',()=>{
 const writer=fs.readFileSync('scripts/enable-r2001-photographer-fourth-header.mjs','utf8');
 const start=writer.indexOf("if(!ui.includes('/* PB2007 canonical print route */'))");
 const end=writer.indexOf('execFileSync',start);
 assert(start>=0&&end>start);
 const snippet=writer.slice(start,end);
 const gate=new Function('return '+snippet.match(/const gate=(.*);/)[1])();
 const patch=new Function('ui','once','file','write',snippet+'\nreturn ui;');
 const once=(value,before,after)=>{assert.equal(value.split(before).length,2);return value.replace(before,after)};
 const output=patch('let '+gate+';',once,'fixture',()=>{});
 assert(output.endsWith('\n/* PB2007 canonical print route */\n'));
 const evaluate=new Function('H','Se','location',output+'\nreturn D;');
 for(const [H,Se,pathname,search,expected] of [
  [false,'orders','/photographer/orders','',true],
  [false,'album','/photographer/album','',true],
  [false,'finance','/photographer/finance','',true],
  [true,'orders','/photographer/orders','',false],
  [false,'clients','/photographer/gallery','',false]
 ])assert.equal(evaluate(H,Se,{pathname,search}),expected);
 assert.equal(patch(output,once,'fixture',()=>{}),output);
 assert.doesNotThrow(()=>new vm.Script(output));
 assert(ui.includes('\n/* PB2007 canonical print route */\n'));
});

test('R2011 mobile photographer finance retains sticky native tabs and a single vertical scrollport',()=>{
 const marker=css.indexOf('/* R2011: mobile photographer finance');
 assert(marker>=0);const patch=css.slice(marker);
 assert(patch.includes('@media(max-width:820px)'));
 assert(patch.includes('.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea:has(>.financeWorkspace)'));
 assert(patch.includes('overflow-y:auto!important;overflow-x:hidden!important'));
 assert.match(patch,/\.financeWorkspace>\.financeNavDock\{\s*position:sticky!important;top:0!important/);
 assert(patch.includes('height:auto!important;min-height:0!important;max-height:none!important'));
 assert(patch.includes('touch-action:pan-x pan-y!important;overscroll-behavior-y:auto!important'));
 assert(patch.includes('position:relative!important;top:auto!important;inset-block-start:auto!important'));
 assert(patch.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
 const header=fs.readFileSync('dist/web/photobridge-v904r100f41-header-date-name-fit.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(header));
 assert(header.includes('<span aria-hidden="true">▶</span><small class="pb2011GuideCaption" aria-hidden="true">راهنما</small>'));
 assert(patch.includes('flex-direction:column!important'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('mobileFinance=r2011'));
});

test('R2012 mobile order board removes legacy spacing and keeps invoice adjacent to Details',()=>{
 const patch=css.slice(css.indexOf('/* R2012: mobile photographer order board'));
 assert(patch.includes('@media(max-width:820px)'));
 assert(patch.includes('margin-top:0!important;margin-block-start:0!important;padding-top:0!important'));
 assert(patch.includes('.customerOrderHead>.orderStatus'));
 assert(patch.includes('button.pb2012OrderInvoice'));
 assert(patch.includes('button.pb2012OrderPdf{display:none!important}'));
 assert(patch.includes('button.detail{order:-2!important}'));
 assert(patch.includes('button.pb2012InvoiceLookup{display:none!important}'));
 assert(ui.includes('/* PB2012 mobile order invoice action */'));
 assert(ui.includes('className:"pb2012OrderInvoice"+(De.invoice_id?"":" pb2012InvoiceLookup")'));
 assert(ui.includes('onClick:()=>Ze(De),children:"فاکتور"'));
 const start=ui.indexOf('const pb2012Invoices='),end=ui.indexOf(';',start);
 assert(start>=0&&end>start);
 const find=new Function('Me','De','return (async()=>{'+ui.slice(start,end+1)+'return ot})()');
 const invoices=[{id:'a',order_id:'other'},{id:'correction',order_id:'target',document_type:'correction'},{id:'b',order_id:'target',document_type:'invoice'}];
 return Promise.all([
  find(async()=>({invoices}),{id:'target'}).then(v=>assert.equal(v.id,'b')),
  find(async()=>({invoices}),{id:'missing'}).then(v=>assert.equal(v,undefined)),
  find(async()=>({invoices}),{id:'target',invoice_id:'b'}).then(v=>assert.equal(v.id,'b'))
 ]);
});

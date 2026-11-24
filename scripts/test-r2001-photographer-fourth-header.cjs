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

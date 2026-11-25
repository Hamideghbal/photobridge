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
 const end=writer.indexOf('\n}',start)+2; // Isolate this patch, not subsequent release blocks.
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

test('R2014 desktop frame query cannot hide the top-level account header and native Orders route is canonical',()=>{
 const writer=fs.readFileSync('scripts/enable-r2001-photographer-fourth-header.mjs','utf8');
 const line=writer.split('\n').find(s=>s.startsWith('const pb2014ShellBoot='));
 assert(line);const boot=JSON.parse(line.slice('const pb2014ShellBoot='.length,-1));
 function run(href,embedded){
  let loc=new URL(href);const win={};win.self=win;win.top=embedded?{}:win;
  win.frameElement=embedded?{closest:()=>true}:null;
  const history={state:null,replaceState(state,title,url){loc=new URL(url,loc)},pushState(state,title,url){loc=new URL(url,loc)}};
  const location={get href(){return loc.href},get origin(){return loc.origin},get pathname(){return loc.pathname},get search(){return loc.search},get hash(){return loc.hash}};
  vm.runInNewContext(boot,{window:win,location,history,URL,matchMedia:()=>({matches:true})});
  return {get url(){return loc},history};
 }
 const root=run('https://photobridge.ir/photographer/orders?pbDesktopContent=1&pbEntryDone=lab',false);
 assert.equal(root.url.pathname,'/photographer/orders/flow');
 assert.equal(root.url.searchParams.get('workspace'),'print');
 assert.equal(root.url.searchParams.has('pbDesktopContent'),false);
 root.history.pushState(null,'','/photographer/orders/ready?pbDesktopContent=1');
 assert.equal(root.url.searchParams.has('pbDesktopContent'),false);
 const frame=run('https://photobridge.ir/photographer/orders/flow?pbDesktopContent=1&workspace=print',true);
 frame.history.pushState(null,'','/photographer/upload');
 assert.equal(frame.url.searchParams.get('pbDesktopContent'),'1');
 assert.equal(frame.url.searchParams.get('workspace'),'print');
 const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 assert(nav.includes("if(window.self!==window.top&&(query.get('pbDesktopContent')==='1'||embeddedHost))"));
 assert(nav.includes('const native=selected?(current&&nativeHeader(current)):nativeHeader(document)'));
 assert(css.includes('--pb2014OrderContentTop'));
 assert(css.includes('.photographerLabContextActions>button.photographerContextAction.primary'));
});


test('R2015 native third row survives both order routes, delayed action mount, reload and chooser transitions',()=>{
 const source=fs.readFileSync('dist/web/photobridge-r1461-print-navigation.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(source));
 const tokens=new Set(),props=new Map(),railProps=new Map([['display','none'],['visibility','hidden']]);
 const style=map=>({getPropertyValue:k=>map.get(k)||'',setProperty:(k,v)=>map.set(k,v),removeProperty:k=>map.delete(k)});
 const rail={style:style(railProps),querySelector:()=>null};
 let board=true,choosing=false,composer=false,embedded=false,frame;
 const area={querySelector:()=>board?{}:null};
 const main={querySelector:s=>s.includes('ContextRail')?rail:area,querySelectorAll:()=>[],style:style(props),classList:{contains:k=>composer&&k==='photographerAlbumCreateWorkspaceMode',toggle:(k,v)=>v?tokens.add(k):tokens.delete(k)}};
 const location={pathname:'/photographer/orders',search:'',origin:'https://photobridge.ir'};
 const win={};win.self=win;win.top=win;
 const document={readyState:'complete',body:{classList:{contains:()=>choosing}},querySelector:s=>s.startsWith('main.')?main:null,getElementById:()=>({getBoundingClientRect:()=>({bottom:121})})};
 const history={pushState(){},replaceState(){}};
 vm.runInNewContext(source,{window:win,parent:win,document,location,history,URL,URLSearchParams,matchMedia:()=>({matches:true}),requestAnimationFrame:cb=>{frame=cb},MutationObserver:class{observe(){}},addEventListener(){}});
 const tick=()=>{history.pushState();frame()};
 tick();assert(tokens.has('pb1461Orders'));assert(tokens.has('pb2015OrderBoard'));assert.equal(props.get('--pb2014OrderTop'),'121px');assert.equal(props.get('--pb2014OrderContentTop'),'165px');assert.equal(railProps.size,0);
 location.pathname='/photographer/album';tick();assert(tokens.has('pb1464Album'));assert(!tokens.has('pb1461Orders'));
 win.top={};tick();assert.equal(props.get('--pb2014OrderTop'),'0px');assert.equal(props.get('--pb2014OrderContentTop'),'44px');
 location.pathname='/photographer/orders/ready';tick();assert(tokens.has('pb1461Orders'));
 choosing=true;tick();assert(!tokens.has('pb2015OrderBoard'));assert(!props.has('--pb2014OrderTop'));
 choosing=false;location.pathname='/photographer/album/new';tick();assert(!tokens.has('pb2015OrderBoard'));
 location.pathname='/photographer/album';composer=true;tick();assert(!tokens.has('pb2015OrderBoard'));
 composer=false;board=false;tick();assert(!tokens.has('pb2015OrderBoard'));
 board=true;location.pathname='/photographer/finance';tick();assert(!tokens.has('pb2015OrderBoard'));
 assert(css.includes('/* R2015: one native third row'));
 assert(css.includes('#photographer-album-new-order-slot'));
 assert(css.includes('#photographer-album-status-desktop-slot .albumHeaderStatuses'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('orderThird=r2015'));
});


test('R2016 reserves third row before order cards load and avoids competing viewport writers',()=>{
 const src=fs.readFileSync('dist/web/photobridge-r1461-print-navigation.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(src));
 const inset=fs.readFileSync('dist/web/photobridge-r1318-print-insets.js','utf8');
 assert(inset.includes('/* PB2016 stable print viewport */'));
 assert(inset.includes('if(area&&!/^\\/photographer\\/'));
 const legacy=fs.readFileSync('dist/web/photobridge-v904r100f41-header-date-name-fit.js','utf8');
 assert(legacy.includes('function clearPrint(){/* PB2016 desktop owner */'));
 assert(css.includes('--pb2016ContentEdge:calc(var(--pb2016ChromeEdge,114px) + 44px)'));
 assert(css.includes('overflow-anchor:none!important'));
 assert(css.includes('.simplePrintPilotPrimaryAdd,.simplePrintPilotHeaderSubmitMobile,.simplePrintPilotHeaderCancelMobile'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('stableViewport=r2016'));
});


test('R2017 print secondary controls retain their identity when active and disabled state change',()=>{
 const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(nav));
 const start=nav.indexOf(' function pb2017SyncPrintControls('),end=nav.indexOf(' function cleanClone(original){',start);
 assert(start>=0&&end>start);
 const fn=new Function('printControlKey',nav.slice(start,end)+'\nreturn pb2017SyncPrintControls;')(b=>b.key);
 const button=(key,active=false)=>{
  const set=new Set([key]),attrs=new Map();if(active)set.add('active');
  return {key,dataset:{pb2017PrintKey:key},disabled:false,classList:{contains:k=>set.has(k),toggle:(k,v)=>v?set.add(k):set.delete(k)},getAttribute:k=>attrs.get(k)??null,hasAttribute:k=>attrs.has(k),setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};
 };
 const keys=['photographerPrintPhotoTab','photographerPrintAlbumTab','finance','archive'];
 const copies=keys.map(k=>button(k));const row={querySelectorAll:()=>copies};
 for(const selected of keys){
  const originals=keys.map(k=>button(k,k===selected));originals[3].disabled=selected==='finance';originals.find(b=>b.key===selected).setAttribute('aria-pressed','true');
  fn(row,originals);
  for(const copy of copies)assert.equal(copy.classList.contains('active'),copy.key===selected);
  assert.equal(copies[3].disabled,selected==='finance');
 }
 assert(nav.includes('return [key,label];'));
 assert(nav.includes("row.dataset.pb2017Ready==='1'"));
 assert(nav.includes("transitioning&&!keep"));
 assert(nav.includes('pb2017SyncPrintControls(row,visible)'));
 const patch=css.slice(css.indexOf('/* R2017: desktop has one working Send action'));
 assert.match(patch,/button\.simplePrintPilotHeaderSubmitMobile\{\s*display:none!important/);
 assert(!patch.includes('.simplePrintPilotQuoteSend'),'existing quote send action is untouched');
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('stableSecondary=r2017'));
});


test('R2018 all four print destinations are required and share route-driven selection',()=>{
 const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(nav));
 const a=nav.indexOf(' const pb2018Keys='),b=nav.indexOf(' function cleanClone(original){',a);
 assert(a>=0&&b>a);
 const h=new Function('printControlKey','location',nav.slice(a,b)+'\nreturn {pb2018Complete,pb2018RouteKey,pb2018Select};')(v=>v.key,{pathname:'/photographer/orders/flow'});
 const keys=['class:photographerPrintPhotoTab','class:photographerPrintAlbumTab','class:finance','class:archive'];
 const source=keys.map(key=>({key}));
 assert(!h.pb2018Complete(source.slice(0,2)));assert(!h.pb2018Complete(source.slice(0,3)));assert(h.pb2018Complete(source));
 const routes=['/photographer/orders/flow','/photographer/album','/photographer/finance','/photographer/archive'];
 const copies=keys.map(key=>{const attrs=new Map(),classes=new Set();return {dataset:{pb2017PrintKey:key},classList:{contains:k=>classes.has(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)}});
 routes.forEach((pathname,i)=>{
  const key=h.pb2018RouteKey({defaultView:{location:{pathname}}});assert.equal(key,keys[i]);
  h.pb2018Select({querySelectorAll:()=>copies},key);
  copies.forEach((copy,n)=>assert.equal(copy.classList.contains('active'),n===i));
 });
 assert(nav.includes("active==='print'?'print':String(pb1631Finance)"));
 assert(nav.includes('!pb2018Complete(visible)'));
 assert(nav.includes('pb2018MountPrintGuides?.()'));
 const patch=css.slice(css.indexOf('/* R2018: four matching desktop tabs'));
 assert(patch.includes('.finance,.archive'));assert(patch.includes('left:50%!important'));assert(patch.includes('translateX(-50%)'));
 assert(patch.includes('background:var(--pb1989-blue,#3b82f6)!important'));assert(patch.includes('background:#fff!important;color:#1b2e48!important'));assert(patch.includes('.pb569GuideArrow'));assert(patch.includes('.pb569GuideLabel'));assert(patch.includes('.pb1127PrintRow[hidden]'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('fourTabs=r2018'));
});


test('R2020 desktop lab right, primary group centered, selected guide follows its own tab, and finance third row centered',()=>{
 const patch=css.slice(css.indexOf('/* R2020:'));
 assert(patch.includes('grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important'));
 assert.match(patch,/\.pb1459LabContext\{\s*grid-column:1!important/);
 assert.match(patch,/\.pb1127PrintModes\{\s*grid-column:2!important/);
 assert(patch.includes('+button.pb1978VideoGuideButton'));
 assert(patch.includes('background:#2563eb!important'));
 assert.match(patch,/\.pb1632FinanceTabs:not\(\[hidden\]\)\{\s*justify-content:center!important/);
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const bundle=html.match(/<link\b[^>]*href=["']\/assets\/(photobridge-boot-[a-f0-9]{16}\.css)["'][^>]*>/i);
 if(bundle){
  const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
  assert.equal(manifest.boot,bundle[1]);
  assert(manifest.sources.some(u=>u.startsWith('/photobridge-r2001-photographer-fourth-header.css?')&&u.includes('centerHeader=r2020')));
  assert(fs.readFileSync('dist/web/assets/'+bundle[1],'utf8').includes(patch.trim()));
 }else{
  assert(/<link\b[^>]*href=["']\/photobridge-r2001-photographer-fourth-header\.css\?[^"']*centerHeader=r2020[^"']*["']/i.test(html));
 }
});


test('R2022 queue skeleton is tied to first-load or retry, never fake order IDs',()=>{
 const start=ui.indexOf('function Zg('),end=ui.indexOf('function wv(',start);
 const queue=ui.slice(start,end);
 const a=queue.indexOf("PB1856load==='loading'&&!Ce.length?Array.from({length:3}");
 const b=queue.indexOf(':Ce.length?',a);
 assert(a>=0&&b>a);
 const expression=queue.slice(a,b);
 const mock={jsx:(tag,props,key)=>({tag,props,key}),jsxs:(tag,props,key)=>({tag,props,key})};
 const render=new Function('PB1856load','Ce','l','e','return '+expression+':null');
 for(const l of ['print','album']){
  const loading=render('loading',[],l,mock);
  assert.equal(loading.length,3);
  for(const card of loading){
   assert.equal(card.props.className,'card pb2022OrderSkeleton');
   assert.equal(card.props['aria-hidden'],true);
   assert(!card.props['data-order-id']);
   assert.equal(card.props.children[2].props.children.length,l==='album'?5:4);
  }
  assert.equal(render('ready',[],l,mock),null);
  assert.equal(render('error',[],l,mock),null);
  assert.equal(render('loading',[{id:'existing'}],l,mock),null);
 }
 assert(css.includes('@keyframes pb2022QueueShimmer'));
 assert(css.includes('@media(prefers-reduced-motion:reduce)'));
});


test('R2024 chooser to new lab releases second header with four real controls, even if old boot is still set',()=>{
 const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
 assert.doesNotThrow(()=>new vm.Script(nav));
 const a=nav.indexOf(' const pb2018Keys='),b=nav.indexOf(' function cleanClone(original){',a);
 const c=nav.indexOf(' function pb1315Sync(panel,notify=true){'),d=nav.indexOf(' function pb1315Watch(panel){',c);
 assert(a>=0&&b>a&&c>=0&&d>c);
 const cls=(...initial)=>{const set=new Set(initial);return {contains:k=>set.has(k),toggle:(k,on)=>on?set.add(k):set.delete(k),remove:k=>set.delete(k)}};
 const keys=['class:photographerPrintPhotoTab','class:photographerPrintAlbumTab','class:finance','class:archive'];
 const controls=keys.map(key=>({key,hidden:false,getAttribute:()=>null,classList:cls()}));
 const makeDoc=({search='',boot=false,chooser=false,ready=true,path='/photographer/orders/flow',count=4}={})=>{
  const doc={body:{classList:chooser?cls('pbR100F14ChoosingLab'):cls()},documentElement:{classList:boot?cls('pbR100F37LabEnterBoot'):cls()},defaultView:{location:{pathname:path,search},getComputedStyle:()=>({display:'block'})}};
  doc.querySelector=q=>q==='#pbR99LabChooser'?(chooser?{hidden:false}:null):q==='#photographerRoleHeaderV710'?(ready?{querySelectorAll:()=>controls.slice(0,count)}:null):q.includes('photographerRolePageScrollArea')?(ready?{children:[]}:null):q==='.photographerPrintModeNav'?(ready?{}:null):null;
  return doc;
 };
 const parent={documentElement:{classList:cls('pb1315PanelChanging')}},row={hidden:true,dataset:{}},loader={hidden:false};
 let doc=makeDoc({chooser:true,search:'?pbLabChooser=1'}),scheduled=0;
 const panel={isConnected:true,hidden:false,dataset:{panel:'print'},querySelector:q=>q==='iframe'?{contentDocument:doc}:loader};
 const h=new Function('printControlKey','location','document','selected','chrome','schedule',nav.slice(a,b)+'\n'+nav.slice(c,d)+'\nreturn {pb2024ChoosingLab,pb2024PrintReady,pb1315Sync};')(v=>v.key,{pathname:'/photographer/archive'},parent,'print',{querySelector:()=>row},()=>scheduled++);
 assert(h.pb2024ChoosingLab(doc));assert(!h.pb2024PrintReady(doc));h.pb1315Sync(panel,false);
 doc=makeDoc({ready:false,boot:true});h.pb1315Sync(panel,false);
 assert(parent.documentElement.classList.contains('pb1315PanelChanging'));assert(!loader.hidden);
 doc=makeDoc({boot:true,count:2});assert(!h.pb2024PrintReady(doc));h.pb1315Sync(panel,false);assert(!loader.hidden);
 // The new document is ready before its orders are fetched and before legacy boot cleanup.
 doc=makeDoc({boot:true});assert(h.pb2024PrintReady(doc));h.pb1315Sync(panel,false);
 assert(loader.hidden);assert(!parent.documentElement.classList.contains('pb1315PanelChanging'));assert.equal(scheduled,0);
 h.pb1315Sync(panel);assert.equal(scheduled,1);
 for(const path of ['/photographer/album','/photographer/finance','/photographer/archive'])assert(h.pb2024PrintReady(makeDoc({path})));
 assert(!h.pb2024PrintReady(makeDoc({path:'/photographer/gallery'})));
 assert(!h.pb2024PrintReady(makeDoc({search:'?pbLabChooser=1',boot:true})));
 assert(nav.includes("row._pb2024Document!==doc"));
 assert(nav.includes("pb1315Sync(panels.get('print'),false)"));
 assert(nav.includes("!pb2024PrintReady(doc)||!pb2018Complete(visible)"));
});

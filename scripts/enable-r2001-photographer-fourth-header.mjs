/* R2001 — consistent fourth finance header and working photographer ledger modes. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
function once(s,a,b,label){
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R2001] '+label+' expected once; found '+count);
 return s.replace(a,b);
}
let ui=read(file);
if(!ui.includes('/* PB2001 fourth finance header */')){
 const begin=ui.indexOf('function ub({role:t,'),end=ui.indexOf('}function hb(',begin);
 if(begin<0||end<begin)throw Error('[R2001] finance component boundaries missing');
 let part=ui.slice(begin,end+1);
 // On photographers, z is always empty. It is a laboratory customer picker,
 // so never disable the photographer's ledger modes because of it.
 part=once(part,
  'disabled:D||!z,onClick:()=>{_setPb1177StmtMode("summary");b()},children:"نمایش خلاصه"',
  'disabled:D||t==="lab"&&!z,onClick:()=>{_setPb1177StmtMode("summary");t==="lab"&&b()},children:"نمایش خلاصه"',
  'photographer summary toggle');
 part=once(part,
  'disabled:D||!z,onClick:()=>{_setPb1177StmtMode("detailed");b()},children:"نمایش با جزئیات"',
  'disabled:D||t==="lab"&&!z,onClick:()=>{_setPb1177StmtMode("detailed");t==="lab"&&b()},children:"نمایش با جزئیات"',
  'photographer detailed toggle');
 // The photographer portal must not display laboratory bookkeeping labels or flags.
 part=once(part,'e.jsx("span",{children:"بخش حسابداری"})','e.jsx("span",{children:t==="lab"?"بخش حسابداری":"بخش مالی"})','finance picker label');
 // Later invoice builders can modify the recorded-status expression; scope
 // the existing computed flag without assuming an obsolete right-hand side.
 if(part.includes('_pbRecorded=')&&!part.includes('_pbRecorded=t==="lab"&&')){
  part=once(part,'_pbRecorded=','_pbRecorded=t==="lab"&&','lab-only accounting badge guard');
 }
 if(part.includes('Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"')){
  part=once(part,'Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"','t==="lab"&&Je.accounting_exported&&e.jsx("small",{className:"accountingTransferredBadge"','lab-only accounting-export guard');
 }
 // Keep the complete invoice records, but remove the irrelevant financial
 // document count/title from the photographer's displayed invoice controls.
 part=once(part,
  't!=="lab"&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})',
  'false&&e.jsxs("div",{children:[e.jsx("b",{children:"فاکتورها و اسناد مالی"})',
  'photographer invoice counter/title');
 // One quick Today preset remains in the toolbar; calendar popovers no longer
 // produce duplicate Today controls for the same photographer range.
 part=once(part,
  'compact:!0,value:_pbInvFrom,onChange:_setPbInvFrom,placeholder:"از تاریخ"',
  'compact:!0,value:_pbInvFrom,onChange:_setPbInvFrom,placeholder:"از تاریخ",showToday:t==="lab"',
  'photographer invoice from-date picker');
 part=once(part,
  'compact:!0,value:_pbInvTo,onChange:_setPbInvTo,placeholder:"تا تاریخ"',
  'compact:!0,value:_pbInvTo,onChange:_setPbInvTo,placeholder:"تا تاریخ",showToday:t==="lab"',
  'photographer invoice to-date picker');
 const metrics='t==="customer"&&e.jsxs("div",{className:"pb2000CustomerMetrics pb2001InvoiceMetrics",role:"status","aria-live":"polite",children:[e.jsxs("span",{children:[e.jsx("small",{children:"جمع فاکتورها"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.total||0),0))})]}),e.jsxs("span",{children:[e.jsx("small",{children:"پرداخت‌ها"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.paid_total||0),0))})]}),e.jsxs("span",{className:"pb2000Balance",children:[e.jsx("small",{children:"مانده حساب"}),e.jsx("b",{children:Xe(Ve.filter(Je=>(Je.document_type||"invoice")==="invoice").reduce((sum,Je)=>sum+Number(Je.balance??(Number(Je.total||0)-Number(Je.paid_total||0))),0))})]})]})';
 part=once(part,
  'e.jsxs("div",{className:"invoiceRangeToolbar",children:[',
  'e.jsxs("div",{className:"invoiceRangeToolbar",children:['+metrics+',',
  'invoice period totals inserted as toolbar child');
 // Only the rendered view mode changes for a photographer; the loaded ledger
 // and its read-only line items stay available without a redundant network trip.
 ui=ui.slice(0,begin)+part+ui.slice(end+1);
 // The quick Today action is kept; the two invoice date calendars are the
 // only place where the new showToday option is disabled.
 ui=once(ui,'function Hs({value:t,onChange:a,placeholder:s="انتخاب تاریخ",compact:r=!1})',
  'function Hs({value:t,onChange:a,placeholder:s="انتخاب تاریخ",compact:r=!1,showToday:_pb2001ShowToday=!0})',
  'Persian picker optional Today preset');
 const dateStart=ui.indexOf('function Hs('),dateEnd=ui.indexOf('}function ',dateStart+12);
 if(dateStart<0||dateEnd<dateStart)throw Error('[R2001] date picker missing');
 let picker=ui.slice(dateStart,dateEnd+1);
 picker=once(picker,'e.jsxs("button",{type:"button",className:"calendarTodayBtn"',
  '_pb2001ShowToday&&e.jsxs("button",{type:"button",className:"calendarTodayBtn"',
  'one Today control in picker');
 ui=ui.slice(0,dateStart)+picker+ui.slice(dateEnd+1);
 ui+='\n/* PB2001 fourth finance header */\n';
 write(file,ui);
}
// R2002: R1202 added a second Today shortcut and lab bookkeeping counts.
// Guard the actual JSX, not merely the calendar popover or the old title.
if(!ui.includes('/* PB2002 photographer finance polish */')){
 const begin=ui.indexOf('function ub({role:t,'),end=ui.indexOf('}function hb(',begin);
 if(begin<0||end<begin)throw Error('[R2002] finance component missing');
 let part=ui.slice(begin,end+1);
 part=once(part,
  'e.jsx("button",{type:"button",className:"pb1201InvoiceToday"',
  't==="lab"&&e.jsx("button",{type:"button",className:"pb1201InvoiceToday"',
  'R2002 legacy Today shortcut is lab-only');
 part=once(part,
  'e.jsxs("div",{className:"pb1201InvoiceCounts"',
  't==="lab"&&e.jsxs("div",{className:"pb1201InvoiceCounts"',
  'R2002 legacy document and accounting counts are lab-only');
 ui=ui.slice(0,begin)+part+ui.slice(end+1)+'\n/* PB2002 photographer finance polish */\n';
 write(file,ui);
}
// R2003: preserve the laboratory's original range controls; make photographer
// filters use the same Persian picker layout as the statement.
if(!ui.includes('/* PB2003 photographer date filters */')){
 const begin=ui.indexOf('function ub({role:t,'),end=ui.indexOf('}function hb(',begin);
 if(begin<0||end<begin)throw Error('[R2003] finance component missing');
 let part=ui.slice(begin,end+1);
 for(const [key,field,set,placeholder] of [
  ['From','_pbInvFrom','_setPbInvFrom','از تاریخ'],
  ['To','_pbInvTo','_setPbInvTo','تا تاریخ']
 ]){
  // R2004: R2001 already verified the unique picker props. Older toolbar
  // writers may add a label class, span or other wrapper: do not match those.
  const marker='compact:!0,value:'+field+',onChange:'+set+',placeholder:"'+placeholder+'",showToday:t==="lab"';
  const at=part.indexOf(marker);
  if(at<0||part.indexOf(marker,at+marker.length)>=0)throw Error('[R2004] unique '+key+' picker props missing');
  const start=part.lastIndexOf('e.jsx(Hs,{',at);
  const close=part.indexOf('})',at+marker.length);
  if(start<0||close<0||at-start>180||close-at-marker.length>180)throw Error('[R2004] '+key+' picker boundary missing');
  const picker=part.slice(start,close+2);
  const clear=field+'&&e.jsx("button",{type:"button",className:"dateClearBtn","aria-label":"پاک کردن '+placeholder+'",onClick:()=>{'+set+'("");_setPbInvApplied'+key+'("");Ie(1)},children:"×"})';
  const control='e.jsx("div",{className:"statementDateLabel pb2003InvoiceDateLabel","aria-label":"'+placeholder+'",children:e.jsxs("div",{className:"statementDateControl",children:['+picker+','+clear+']})})';
  // Replace only the picker JSX, preserving the enclosing label and every
  // lab prop byte-for-byte. Do not duplicate either calendar or date label.
  part=once(part,picker,'(t==="lab"?'+picker+':'+control+')','R2004 '+key+' picker control');
 }
 // Use the already existing state setters and remove stale search on explicit
 // Today / All presets. Dates and search are local filters, never writes.
 part=once(part,'const day=$s(new Date());_setPbInvFrom(day);_setPbInvTo(day);_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day);Ie(1)',
  'const day=$s(new Date());if(t!=="lab")c("");_setPbInvFrom(day);_setPbInvTo(day);_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day);Ie(1)','R2003 today reset');
 part=once(part,'_setPbInvFrom(""),_setPbInvTo(""),_setPbInvAppliedFrom(""),_setPbInvAppliedTo(""),Ie(1)',
  't!=="lab"&&c(""),_setPbInvFrom(""),_setPbInvTo(""),_setPbInvAppliedFrom(""),_setPbInvAppliedTo(""),Ie(1)','R2003 all reset');
 // Date-only ISO inputs already denote a Tehran civil day. Avoid parsing them
 // through UTC again; historical customer records may use created_at.
 part=once(part,'const At=$s(Je.issued_at),Et=_pbInvAppliedFrom?$s(_pbInvAppliedFrom):"",dn=_pbInvAppliedTo?$s(_pbInvAppliedTo):"";',
  'const pb2003Day=v=>typeof v==="string"&&/^\\d{4}-\\d{2}-\\d{2}$/.test(v)?v:$s(v),At=t==="lab"?$s(Je.issued_at):pb2003Day(Je.issued_at||Je.created_at),Et=_pbInvAppliedFrom?pb2003Day(_pbInvAppliedFrom):"",dn=_pbInvAppliedTo?pb2003Day(_pbInvAppliedTo):"";','R2003 civil-date filtering');
 // Keep the original ledger totals in the statement paper, not its toolbar.
 part=once(part,'t==="customer"&&e.jsxs("div",{className:"pb2000CustomerMetrics",','false&&e.jsxs("div",{className:"pb2000CustomerMetrics",','R2003 hide duplicate statement totals');
 ui=ui.slice(0,begin)+part+ui.slice(end+1)+'\n/* PB2003 photographer date filters */\n';
 write(file,ui);
}
// R2007: native Print header must exist even on the first unqualified Orders route.
if(!ui.includes('/* PB2007 canonical print route */')){
 const gate='D=!H&&["orders","upload","album","archive","finance"].includes(Se)&&new URLSearchParams(location.search).get("workspace")==="print"';
 if(ui.includes(gate))ui=once(ui,gate,'D=!H&&["orders","upload","album","archive","finance"].includes(Se)&&(new URLSearchParams(location.search).get("workspace")==="print"||/^\\/photographer\\/(?:orders|upload|album|archive|finance)(?:\\/|$)/.test(location.pathname))','R2007 native print context');
 else if(!ui.includes('D=!H&&["orders","upload","album","archive","finance"].includes(Se)'))throw Error('[R2007] native print gate missing');
 ui+=String.fromCharCode(10)+'/* PB2007 canonical print route */'+String.fromCharCode(10);write(file,ui);
}
// R2012: preserve the existing authenticated customer invoice preview.
// When the order response omits invoice_id, the mobile button may resolve
// only a real invoice linked to this exact order, never an unrelated document.
if(!ui.includes('/* PB2012 mobile order invoice action */')){
 const invoice='De.invoice_id&&e.jsx("button",{onClick:()=>Ze(De),children:"فاکتور"})';
 const pdf='De.invoice_id&&De.invoice_pdf_ready&&e.jsx("button",{onClick:()=>Ke(De),children:"PDF"})';
 ui=once(ui,invoice,'e.jsx("button",{className:"pb2012OrderInvoice"+(De.invoice_id?"":" pb2012InvoiceLookup"),onClick:()=>Ze(De),children:"فاکتور"})','R2012 explicit order invoice action');
 ui=once(ui,pdf,'De.invoice_id&&De.invoice_pdf_ready&&e.jsx("button",{className:"pb2012OrderPdf",onClick:()=>Ke(De),children:"PDF"})','R2012 explicit PDF action');
 const lookup='const ot=((await Me("/api/customer/invoices")).invoices||[]).find(Ee=>Ee.id===De.invoice_id);';
 const resolved='const pb2012Invoices=(await Me("/api/customer/invoices")).invoices||[],ot=(De.invoice_id&&pb2012Invoices.find(Ee=>String(Ee.id)===String(De.invoice_id)))||pb2012Invoices.find(Ee=>De.id&&String(Ee.order_id)===String(De.id)&&(!Ee.document_type||Ee.document_type==="invoice"));';
 ui=once(ui,lookup,resolved,'R2012 authenticated order invoice lookup');
 ui+=String.fromCharCode(10)+'/* PB2012 mobile order invoice action */'+String.fromCharCode(10);write(file,ui);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const cssName='photobridge-r2001-photographer-fourth-header.css';
fs.copyFileSync('scripts/r2001-photographer-fourth-header.css','dist/web/'+cssName);
let html=read('dist/web/index.html');
if(!html.includes(cssName))
 html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r2004"></head>','fourth header CSS link');
const versionKey='&photographerFinanceFourth=r2001';
const asset='index-UIRefine-v655-r84.js';
if(!html.includes(versionKey)){
 if(!html.includes(asset+'?'))throw Error('[R2001] UI module URL not found');
 const pattern=new RegExp(asset.replace(/\./g,'\\.')+'[^"\\s<>]*','g');
 let hits=0;
 html=html.replace(pattern,url=>{hits++;return url+versionKey+'&photographerFinancePolish=r2002'});
 if(hits!==1)throw Error('[R2001] expected one UI module URL, found '+hits);
}
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g,url=>url.includes('photographerDateFilters=r2003')?url:url+'&photographerDateFilters=r2003');
html=html.replace(/(photobridge-workflow-guides-v572\.js\?[^"'<>\s]*)/g,url=>url.includes('splitGuide=r2003')?url:url+'&splitGuide=r2003');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g,url=>url.includes('financeDateBuild=r2004')?url:url+'&financeDateBuild=r2004');
html=html.replace(/(photobridge-workflow-guides-v572\.js\?[^"'<>\s]*)/g,url=>url.includes('utilityGuides=r2005')?url:url+'&utilityGuides=r2005');
html=html.replace(/(photobridge-(?:workflow-guides-v572|v904r100f41-header-date-name-fit|r1099-photographer-tabs)\.js\?[^"'<>\s]*)/g,url=>url.includes('mobileHeader=r2006')?url:url+'&mobileHeader=r2006');
html=html.replace(/(photobridge-(?:workflow-guides-v572|v904r100f41-header-date-name-fit|v904r99-lab-chooser|r1099-photographer-tabs)\.js\?[^"'<>\s]*|index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g,url=>url.includes('canonicalPrint=r2007')?url:url+'&canonicalPrint=r2007');
html=html.replace(/(photobridge-v904r100f41-header-date-name-fit\.js\?[^"'<> \t\r\n]*|photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('mobileFinance=r2011')?url:url+'&mobileFinance=r2011');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*|photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('mobileOrders=r2012')?url:url+'&mobileOrders=r2012');
html=html.replace(/(photobridge-(?:v904r100f41-header-date-name-fit\.js|r1322-mobile-print-cards\.css|r2001-photographer-fourth-header\.css)\?[^"'<>\s]*|index-UIRefine-v655-r84\.js\?[^"'<>\s]*)/g,url=>url.includes('orderBoard=r2013')?url:url+'&orderBoard=r2013');
const pb2014ShellBoot="/* PB2014 desktop shell boundary */\n(function(){\n if(!matchMedia('(min-width:821px)').matches)return;\n const isRoot=window.self===window.top;\n let printFrame=false;\n try{printFrame=!isRoot&&!!window.frameElement?.closest('.pb1126ContentPanel[data-panel=\"print\"]')}catch{}\n const isPrint=p=>/^\\/photographer\\/(?:orders|upload|album|archive|finance)(?:\\/|$)/.test(p);\n const normalize=value=>{\n  if(value==null)return value;\n  let u;try{u=new URL(value,location.href)}catch{return value}\n  if(u.origin!==location.origin||!/^\\/photographer(?:\\/|$)/.test(u.pathname))return value;\n  if(isRoot){\n   for(const key of ['pbDesktopContent','pbDesktopFrameStore','pbUtilityWindow','pbCrmDesktopTab'])u.searchParams.delete(key);\n  }else if(printFrame&&isPrint(u.pathname)){\n   u.searchParams.set('pbDesktopContent','1');u.searchParams.set('workspace','print');\n  }\n  if(isPrint(u.pathname)&&u.searchParams.get('pbLabChooser')!=='1'){\n   if(u.pathname==='/photographer/orders'||u.pathname==='/photographer/orders/')u.pathname='/photographer/orders/flow';\n   u.searchParams.set('workspace','print');\n  }\n  return u.pathname+u.search+u.hash;\n };\n if(!isRoot&&!printFrame)return;\n const initial=normalize(location.href);\n if(initial!==location.pathname+location.search+location.hash)history.replaceState(history.state,'',initial);\n for(const name of ['pushState','replaceState']){\n  const original=history[name];\n  history[name]=function(state,title,url){return original.call(this,state,title,normalize(url))};\n }\n})();";
if(!html.includes('id="pb2014ShellBoot"'))html=html.replace('<head>','<head><script id="pb2014ShellBoot">'+pb2014ShellBoot+'</script>');
html=html.replace(/(photobridge-(?:r1126-desktop-navigation|r1461-print-navigation|v904r99-lab-chooser|r1099-photographer-tabs)\.js\?[^"'<>\s]*|photobridge-r2001-photographer-fourth-header\.css\?[^"'<>\s]*)/g,url=>url.includes('desktopShell=r2014')?url:url+'&desktopShell=r2014');
html=html.replace(/(photobridge-(?:r1461-print-navigation\.js|r2001-photographer-fourth-header\.css)\?[^"'<> \t\r\n]*)/g,url=>url.includes('orderThird=r2015')?url:url+'&orderThird=r2015');
write('dist/web/index.html',html);

// R2014: a frame query is not evidence of being inside a frame.
const pb2014NavFile='dist/web/photobridge-r1126-desktop-navigation.js';
let pb2014Nav=read(pb2014NavFile);
if(!pb2014Nav.includes('/* PB2014 actual desktop frame */')){
 const old="if(query.get('pbDesktopContent')==='1'||embeddedHost)";
 if(pb2014Nav.includes(old))pb2014Nav=once(pb2014Nav,old,"if(window.self!==window.top&&(query.get('pbDesktopContent')==='1'||embeddedHost)) /* PB2014 actual desktop frame */",'R2014 real frame identity');
 else throw Error('[R2014] expected desktop embedded guard');
 // Never read a different workspace's native header during an active iframe transition.
 pb2014Nav=once(pb2014Nav,"const native=nativeHeader(currentDocument()||document)||nativeHeader(document);if(!native)return;","const current=currentDocument();const native=selected?(current&&nativeHeader(current)):nativeHeader(document);if(!native)return;",'R2014 active header isolation');
 write(pb2014NavFile,pb2014Nav);
}
execFileSync(process.execPath,['--check',pb2014NavFile],{stdio:'inherit'});

console.log('[R2001] photographer fourth headers and invoice/statement modes ready');


// R2016: the legacy measured inset must not compete with the route-owned
// Print/Album viewport. Preserve it for finance/archive and other old routes.
const pb2016InsetFile='dist/web/photobridge-r1318-print-insets.js';
let pb2016Inset=read(pb2016InsetFile);
if(!pb2016Inset.includes('/* PB2016 stable print viewport */')){
 const anchor="if(area){const top=getComputedStyle(area).position==='fixed'?window.pb1318PrintInset():0;";
 pb2016Inset=once(pb2016Inset,anchor,"if(area&&!/^\\/photographer\\/(?:orders(?:\\/(?:flow|needs_fix|ready|completed))?|album|upload)\\/?$/.test(location.pathname)){const top=getComputedStyle(area).position==='fixed'?window.pb1318PrintInset():0;",'R2016 stop competing legacy inset');
 pb2016Inset+='\n/* PB2016 stable print viewport */\n';write(pb2016InsetFile,pb2016Inset);
}
execFileSync(process.execPath,['--check',pb2016InsetFile],{stdio:'inherit'});
// These old mobile-only geometry helpers also run cleanup on desktop.
// Do not let them clear the active desktop viewport on every DOM mutation.
for(const name of ['photobridge-ui-fixes-v765.js','photobridge-v904r100f37-store-header-core.js','photobridge-v904r100f38-header-route-isolation.js','photobridge-v904r100f39-print-actions-cleanup.js','photobridge-v904r100f40-mobile-polish.js','photobridge-v904r100f41-header-date-name-fit.js']){
 const p='dist/web/'+name;if(!fs.existsSync(p))continue;
 let js=read(p);
 for(const signature of ['function syncGeometry(w){','function resetScrollGeometry(w){','function fixPrint(){','function clearPrint(){']){
  if(!js.includes(signature)||js.includes(signature+'/* PB2016 desktop owner */'))continue;
  js=once(js,signature,signature+"/* PB2016 desktop owner */if(matchMedia('(min-width:821px)').matches&&document.documentElement.classList.contains('pb1126Desktop')&&/^\\/photographer\\/(?:orders(?:\\/(?:flow|needs_fix|ready|completed))?|album|upload)\\/?$/.test(location.pathname))return;",'R2016 mobile-only geometry '+name);
 }
 write(p,js);execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
}
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-(?:r1461-print-navigation|r1318-print-insets|ui-fixes-v765|v904r100f3[789]-[^"'<> \t\r\n?]+|v904r100f4[01]-[^"'<> \t\r\n?]+)\.js\?[^"'<> \t\r\n]*|photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('stableViewport=r2016')?url:url+'&stableViewport=r2016');
 write(p,h);
}

// R2017: keep native Print actions and guide nodes mounted across tab switches.
const pb2017NavFile='dist/web/photobridge-r1126-desktop-navigation.js';
let pb2017Nav=read(pb2017NavFile);
if(!pb2017Nav.includes('/* PB2017 stable Print secondary row */')){
 const patch=(a,b,label)=>{pb2017Nav=once(pb2017Nav,a,b,'R2017 '+label)};
 patch(' function cleanClone(original){'," /* PB2017 stable Print secondary row */\n function pb2017SyncPrintControls(row,visible){\n  const copies=[...row.querySelectorAll('[data-pb2017-print-key]')];\n  for(const original of visible){\n   const copy=copies.find(button=>button.dataset.pb2017PrintKey===printControlKey(original));\n   if(!copy)continue;\n   for(const name of ['active','selected']){\n    const next=original.classList.contains(name);\n    if(copy.classList.contains(name)!==next)copy.classList.toggle(name,next);\n   }\n   for(const name of ['aria-current','aria-selected','aria-pressed']){\n    const next=original.getAttribute(name);\n    if(next===null){if(copy.hasAttribute(name))copy.removeAttribute(name);}\n    else if(copy.getAttribute(name)!==next)copy.setAttribute(name,next);\n   }\n   if(copy.disabled!==original.disabled)copy.disabled=original.disabled;\n   if(copy.classList.contains('photographerPrintPhotoTab')||copy.classList.contains('photographerPrintAlbumTab')){\n    const selected=original.classList.contains('active')||original.classList.contains('selected')||original.getAttribute('aria-selected')==='true'||original.getAttribute('aria-pressed')==='true';\n    if(copy.dataset.pb1989Active!==String(selected))copy.dataset.pb1989Active=String(selected);\n   }\n  }\n }\n"+' function cleanClone(original){','state sync helper');

 patch("return [key,label,button.disabled,button.classList.contains('active'),button.getAttribute('aria-current')];","return [key,label];",'structural signature only');
 patch("const pb1459LabSignature=pb1459LabSource?JSON.stringify([pb1459LabSource.outerHTML,pb1459LabSource.value,pb1459LabSource.disabled]):'';","const pb1459LabSignature=pb1459LabSource?JSON.stringify([pb1459LabSource.options.length<=1?pb1459LabSource.dataset.labName||'':'',[...pb1459LabSource.options].map(o=>[o.value,o.textContent])]):pb2017Retain?(row.dataset.pb2017LabSignature||''):'';",'lab structure only');
 patch("JSON.stringify(visible.map(printControlSignature))","JSON.stringify(visible.map(printControlSignature).sort((a,b)=>a[0].localeCompare(b[0])))",'stable source order');

 patch("  const choosing=active==='store'?","  const pb2017Retain=active==='print'&&row.dataset.pb2017Ready==='1';\n  const choosing=active==='store'?",'previous ready row');
 patch("(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print')","(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print'&&!pb2017Retain)",'transient native absence is not chooser');
 patch("  const sources=choosing?[]:","  if(active!=='print'||choosing)delete row.dataset.pb2017Ready;\n  const sources=choosing?[]:",'real chooser clears retention');
 patch("  const headerControls=frameStore?frameStoreControls:cameraStore?cameraStoreControls:[];","  const headerControls=frameStore?frameStoreControls:cameraStore?cameraStoreControls:[];\n  if(pb2017Retain&&!choosing&&(!visible.some(el=>el.classList.contains('photographerPrintPhotoTab'))||!visible.some(el=>el.classList.contains('photographerPrintAlbumTab'))))return;",'retain complete row while source remounts');
 patch("const printKey=active==='print'?printControlKey(original):null;","const printKey=active==='print'?printControlKey(original):null;if(printKey)copy.dataset.pb2017PrintKey=printKey;",'stable proxy identity');
 patch("  const printPanel=panels.get('print');\n  const loading=printPanel?.querySelector('.pb1126Loading');","  if(active==='print'&&!choosing){pb2017SyncPrintControls(row,visible);if(pb1459LabSource){row.dataset.pb2017LabSignature=pb1459LabSignature;const labSelect=row.querySelector('.pb1459LabSelect');if(labSelect){if(labSelect.value!==pb1459LabSource.value)labSelect.value=pb1459LabSource.value;if(labSelect.disabled!==pb1459LabSource.disabled)labSelect.disabled=pb1459LabSource.disabled;for(const option of labSelect.options){const live=[...pb1459LabSource.options].find(o=>o.value===option.value);if(live&&option.disabled!==live.disabled)option.disabled=live.disabled;}}}}\n  const printPanel=panels.get('print');\n  const loading=printPanel?.querySelector('.pb1126Loading');",'update state without replacing DOM');
 patch("const waiting=active==='print'&&!choosing&&(!nativeModes||!clonedModes||!loading?.hidden||document.documentElement.classList.contains('pb1315PanelChanging'));","const waiting=active==='print'&&!choosing&&!pb2017Retain&&(!nativeModes||!clonedModes||(loading&&!loading.hidden)||document.documentElement.classList.contains('pb1315PanelChanging'));\n  if(active==='print'&&!choosing&&!waiting&&clonedModes)row.dataset.pb2017Ready='1';",'initial readiness only');
 patch("  row.hidden=choosing||waiting;","  if(row.hidden!==(choosing||waiting))row.hidden=choosing||waiting;",'idempotent visibility');
 patch("   document.documentElement.classList.toggle('pb1315PanelChanging',transitioning);\n   const row=chrome?.querySelector('.pb1126Secondary');\n   if(row&&transitioning)row.hidden=true;","   const row=chrome?.querySelector('.pb1126Secondary');\n   const keep=!!row&&row.dataset.pb2017Ready==='1'&&!choosing&&!boot;\n   document.documentElement.classList.toggle('pb1315PanelChanging',transitioning&&!keep);\n   if(row&&transitioning&&!keep)row.hidden=true;",'keep header during content transition');
 patch("     document.documentElement.classList.add('pb1315PanelChanging');\n     const row=chrome?.querySelector('.pb1126Secondary');if(row)row.hidden=true;","     const row=chrome?.querySelector('.pb1126Secondary');\n     if(row?.dataset.pb2017Ready!=='1'){document.documentElement.classList.add('pb1315PanelChanging');if(row)row.hidden=true;}",'preserve row across iframe load');
 write(pb2017NavFile,pb2017Nav);
}
execFileSync(process.execPath,['--check',pb2017NavFile],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-(?:r1126-desktop-navigation\.js|r2001-photographer-fourth-header\.css)\?[^"'<> \t\r\n]*)/g,url=>url.includes('stableSecondary=r2017')?url:url+'&stableSecondary=r2017');
 write(p,h);
}

// R2018: initial entry is atomic; the four primary destinations have one identity.
const pb2018NavFile='dist/web/photobridge-r1126-desktop-navigation.js';
let pb2018Nav=read(pb2018NavFile);
if(!pb2018Nav.includes('/* PB2018 four stable Print tabs */')){
 const patch=(a,b,label)=>{pb2018Nav=once(pb2018Nav,a,b,'R2018 '+label)};
 patch(' function cleanClone(original){'," /* PB2018 four stable Print tabs */\n const pb2018Keys=['class:photographerPrintPhotoTab','class:photographerPrintAlbumTab','class:finance','class:archive'];\n const pb2018Main=button=>pb2018Keys.includes(printControlKey(button));\n function pb2018RouteKey(doc){\n  let path='';try{path=doc?.defaultView?.location.pathname||location.pathname}catch{}\n  if(/^\\/photographer\\/finance(?:\\/|$)/.test(path))return 'class:finance';\n  if(/^\\/photographer\\/archive(?:\\/|$)/.test(path))return 'class:archive';\n  if(/^\\/photographer\\/album(?:\\/|$)/.test(path))return 'class:photographerPrintAlbumTab';\n  if(/^\\/photographer\\/(?:orders|upload)(?:\\/|$)/.test(path))return 'class:photographerPrintPhotoTab';\n  return '';\n }\n function pb2018Select(row,key){\n  if(!key)return;\n  for(const b of row.querySelectorAll('[data-pb2017-print-key]')){\n   if(!pb2018Keys.includes(b.dataset.pb2017PrintKey))continue;\n   const selected=b.dataset.pb2017PrintKey===key;\n   for(const name of ['active','selected'])if(b.classList.contains(name)!==selected)b.classList.toggle(name,selected);\n   for(const name of ['aria-pressed','aria-selected'])if(b.getAttribute(name)!==String(selected))b.setAttribute(name,String(selected));\n   if(b.dataset.pb1989Active!==String(selected))b.dataset.pb1989Active=String(selected);\n  }\n }\n function pb2018Complete(visible){\n  const keys=new Set(visible.map(printControlKey));\n  return pb2018Keys.every(k=>keys.has(k));\n }\n"+' function cleanClone(original){','four tab helpers');

 // Finance adds a third row, but that fact must not invalidate the second row.
 patch("String(pb1631Finance)+'|'+pb1459LabSignature+'|'","(active==='print'?'print':String(pb1631Finance))+'|'+(active==='print'?'':pb1459LabSignature)+'|'",'route-independent second row signature');
 patch("JSON.stringify(visible.map(printControlSignature).sort((a,b)=>a[0].localeCompare(b[0])))","JSON.stringify(visible.filter(pb2018Main).map(printControlSignature).sort((a,b)=>a[0].localeCompare(b[0])))",'only stable primary identities in signature');
 patch("if(pb2017Retain&&!choosing&&(!visible.some(el=>el.classList.contains('photographerPrintPhotoTab'))||!visible.some(el=>el.classList.contains('photographerPrintAlbumTab'))))return;","if(pb2017Retain&&!choosing&&!pb2018Complete(visible))return;",'retain all four during remount');
 patch("const waiting=active==='print'&&!choosing&&!pb2017Retain&&(!nativeModes||!clonedModes||(loading&&!loading.hidden)||document.documentElement.classList.contains('pb1315PanelChanging'));","const waiting=active==='print'&&!choosing&&!pb2017Retain&&(!pb2018Complete(visible)||!nativeModes||!clonedModes||(loading&&!loading.hidden)||doc?.documentElement?.classList.contains('pbR100F37LabEnterBoot')||document.documentElement.classList.contains('pb1315PanelChanging'));",'initial row waits for all four and lab boot');
 // Preserve R1989 click logic and tests, but apply it to finance/archive too.
 patch("if(modes&&(copy.classList.contains('photographerPrintPhotoTab')||copy.classList.contains('photographerPrintAlbumTab')))","if(modes&&pb2018Main(copy))",'same selection on every primary tab');
 patch("modes.querySelectorAll('button.photographerPrintPhotoTab,button.photographerPrintAlbumTab')","modes.querySelectorAll('button.photographerPrintPhotoTab,button.photographerPrintAlbumTab,button.finance:not(.pb2005UtilityGuide),button.archive:not(.pb2005UtilityGuide)')",'four immediate active states');
 patch("if(active==='print'&&!choosing){pb2017SyncPrintControls(row,visible);","if(active==='print'&&!choosing){pb2017SyncPrintControls(row,visible);pb2018Select(row,pb2018RouteKey(doc));",'route is authoritative for selected tab');
 patch("if(active==='print'&&!choosing){pb2017SyncPrintControls(row,visible);pb2018Select(row,pb2018RouteKey(doc));","if(active==='print'&&!choosing){pb2017SyncPrintControls(row,visible);pb2018Select(row,pb2018RouteKey(doc));if(pb1459LabSource&&row.dataset.pb2017LabSignature!==pb1459LabSignature){const context=pb1459LabContext(pb1459LabSource),old=row.querySelector('.pb1459LabContext');if(old)old.replaceWith(context);else row.append(context);}",'update lab context without replacing tabs');
 // On first entry, mount guide siblings in the same JS turn as the row.
 patch("if(row.hidden!==(choosing||waiting))row.hidden=choosing||waiting;","if(row.hidden!==(choosing||waiting))row.hidden=choosing||waiting;\n  if(active==='print'&&!choosing&&!waiting)window.pb2018MountPrintGuides?.();",'atomic guide mounting');
 write(pb2018NavFile,pb2018Nav);
}
execFileSync(process.execPath,['--check',pb2018NavFile],{stdio:'inherit'});
const pb2018GuideFile='dist/web/photobridge-workflow-guides-v572.js';
let pb2018Guide=read(pb2018GuideFile);
if(!pb2018Guide.includes('/* PB2018 synchronous guide mount */')){
 pb2018Guide=once(pb2018Guide,'  function queueSync(){','  /* PB2018 synchronous guide mount */\n  window.pb2018MountPrintGuides=()=>{mountHeaderButtons();mountUtilityGuides()};\n  function queueSync(){','R2018 atomic guide hook');
 write(pb2018GuideFile,pb2018Guide);
}
execFileSync(process.execPath,['--check',pb2018GuideFile],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-(?:r1126-desktop-navigation\.js|workflow-guides-v572\.js|r2001-photographer-fourth-header\.css)\?[^"'<> \t\r\n]*)/g,url=>url.includes('fourTabs=r2018')?url:url+'&fourTabs=r2018');
 write(p,h);
}


// R2019: invalidate the served stylesheet when its action positioning changes.
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*/g,url=>url.includes('centerOrder=r2019')?url:url+'&centerOrder=r2019');
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('centerHeader=r2020')?url:url+'&centerHeader=r2020');
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('compactGuides=r2021')?url:url+'&compactGuides=r2021');
 write(p,h);
}


// R2022: render placeholders from the actual queue load state, not a timer.
const pb2022File='dist/web/assets/index-UIRefine-v655-r84.js';
let pb2022UI=read(pb2022File);
if(!pb2022UI.includes('/* PB2022 queue skeleton */')){
 const start=pb2022UI.indexOf('function Zg('),end=pb2022UI.indexOf('function wv(',start);
 if(start<0||end<start)throw Error('R2022 photographer queue component missing');
 let queue=pb2022UI.slice(start,end);
 if(!queue.includes("PB1856setLoad('ready')")||!queue.includes("PB1856setLoad('error')"))throw Error('R2022 actual queue load state missing');
 const anchor='className:"customerOrderGrid liveOrderGrid",children:Ce.length?';
 const skeleton="className:\"customerOrderGrid liveOrderGrid\",\"aria-busy\":PB1856load==='loading'&&!Ce.length,children:PB1856load==='loading'&&!Ce.length?Array.from({length:3},(_,index)=>e.jsxs('div',{className:'card pb2022OrderSkeleton','aria-hidden':true,children:[...Array.from({length:2},(_,group)=>e.jsxs('div',{className:'pb2022SkeletonGroup',children:[e.jsx('span',{className:'pb2022SkeletonLine'}),e.jsx('span',{className:'pb2022SkeletonLine'})]},group)),e.jsx('div',{className:'pb2022SkeletonStages',children:Array.from({length:l==='album'?5:4},(_,stage)=>e.jsx('span',{className:'pb2022SkeletonDot'},stage))}),e.jsx('span',{className:'pb2022SkeletonAction'})]},'queue-loading-'+index)):Ce.length?";
 queue=once(queue,anchor,skeleton,'R2022 live queue skeleton');
 pb2022UI=pb2022UI.slice(0,start)+queue+pb2022UI.slice(end)+'\n/* PB2022 queue skeleton */\n';
 write(pb2022File,pb2022UI);
}
execFileSync(process.execPath,['--check',pb2022File],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('queueSkeleton=r2022')?url:url+'&queueSkeleton=r2022');
 h=h.replace(/(index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('queueSkeleton=r2022')?url:url+'&queueSkeleton=r2022');
 write(p,h);
}


// R2023: invalidate the stylesheet only; queue behavior unchanged.
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('joinedGuides=r2023')?url:url+'&joinedGuides=r2023');
 write(p,h);
}


// R2024: the real visible Print document owns readiness after lab selection.
// A previous panel's boot/loader flag must not permanently hide the second row.
const pb2024NavFile='dist/web/photobridge-r1126-desktop-navigation.js';
let pb2024Nav=read(pb2024NavFile);
if(!pb2024Nav.includes('/* PB2024 lab switch header recovery */')){
 const patch=(a,b,label)=>{pb2024Nav=once(pb2024Nav,a,b,'R2024 '+label)};
 const helper=" /* PB2024 lab switch header recovery */\n function pb2024ChoosingLab(doc){\n  if(!doc?.body)return false;\n  try{if(new URLSearchParams(doc.defaultView.location.search).get('pbLabChooser')==='1')return true}catch{}\n  const chooser=doc.querySelector('#pbR99LabChooser');\n  if(chooser&&!chooser.hidden&&doc.defaultView?.getComputedStyle(chooser).display!=='none')return true;\n  return doc.body.classList.contains('pbR100F14ChoosingLab')||(doc.documentElement.classList.contains('pbR100F14LabChooserBoot')&&!doc.querySelector('.photographerPrintModeNav'));\n }\n function pb2024PrintReady(doc){\n  if(!doc?.body||pb2024ChoosingLab(doc)||!pb2018RouteKey(doc))return false;\n  const native=doc.querySelector('#photographerRoleHeaderV710'),scroll=doc.querySelector('main.photographerMain.photographerPrintWorkspace>.photographerRolePageScrollArea');\n  if(!native||!scroll)return false;\n  const sources=[...native.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack'));\n  return pb2018Complete(sources);\n }\n";
 patch(' function cleanClone(original){',helper+' function cleanClone(original){','live document readiness helpers');
 const oldChoose="(!!doc?.querySelector('#pbR99LabChooser')||doc?.body?.classList.contains('pbR100F14ChoosingLab')||doc?.documentElement?.classList.contains('pbR100F14LabChooserBoot')||(!doc?.querySelector('.photographerPrintModeNav')&&selected==='print'&&!pb2017Retain))";
 patch(oldChoose,'pb2024ChoosingLab(doc)','chooser means real chooser, never missing native nav');
 // Reconcile the transition state on every normal body-mutation render,
 // including when only React's native controls become available.
 patch(' function pb1315Sync(panel){',' function pb1315Sync(panel,notify=true){','allow render-time reconciliation without scheduling itself');
 patch("  const choosing=chooser&&!chooser.hidden&&doc.defaultView?.getComputedStyle(chooser).display!=='none';","  const choosing=pb2024ChoosingLab(doc);",'consistent chooser test');
 patch("  const workspace=!!doc.querySelector('.photographerPrintModeNav')&&!!scroll?.children.length;","  const workspace=pb2024PrintReady(doc);",'actual four controls and scroll root, not loaded orders');
 patch("  const transitioning=boot||(!choosing&&!workspace);","  const transitioning=!choosing&&!workspace;",'legacy boot is not a readiness veto');
 patch("   if(!transitioning)schedule();","   if(!transitioning&&notify)schedule();",'no render loop');
 // Reset clone identity when the iframe replaces its document. Otherwise
 // a matching structural signature can leave cloned handlers from the old lab.
 patch("  const pb2017Retain=active==='print'&&row.dataset.pb2017Ready==='1';","  if(active==='print'&&row._pb2024Document!==doc){row._pb2024Document=doc;delete row.dataset.pb2017Ready;delete row.dataset.source;delete row.dataset.pb2017LabSignature;}\n  if(active==='print'&&selected==='print')pb1315Sync(panels.get('print'),false);\n  const pb2017Retain=active==='print'&&row.dataset.pb2017Ready==='1';",'document generation and transition reconciliation');
 patch("const waiting=active==='print'&&!choosing&&!pb2017Retain&&(!pb2018Complete(visible)||!nativeModes||!clonedModes||(loading&&!loading.hidden)||doc?.documentElement?.classList.contains('pbR100F37LabEnterBoot')||document.documentElement.classList.contains('pb1315PanelChanging'));","const waiting=active==='print'&&!choosing&&!pb2017Retain&&(!pb2024PrintReady(doc)||!pb2018Complete(visible)||!nativeModes||!clonedModes);\n  if(active==='print'&&!choosing&&!waiting&&pb2024PrintReady(doc)){if(loading)loading.hidden=true;document.documentElement.classList.remove('pb1315PanelChanging');}",'release stale wait only with actual complete current-document controls');
 write(pb2024NavFile,pb2024Nav);
}
execFileSync(process.execPath,['--check',pb2024NavFile],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r1126-desktop-navigation\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('labHeaderRecovery=r2024')?url:url+'&labHeaderRecovery=r2024');
 write(p,h);
}


// R2025: refresh visual polish without changing navigation or order loading.
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('statusContrast=r2025')?url:url+'&statusContrast=r2025');
 write(p,h);
}


// R2026: customer invoice presets represent the applied dates, with immediate
// validation and a result message. The laboratory's filter behavior is unchanged.
let pb2026UI=read(file);
if(!pb2026UI.includes('/* PB2026 customer invoice filter feedback */')){
 const start=pb2026UI.indexOf('function ub({role:t,'),end=pb2026UI.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error('R2026 finance component missing');
 let part=pb2026UI.slice(start,end+1);
 const patch=(a,b,label)=>{part=once(part,a,b,'R2026 '+label)};
 const state='[_pbAccountingMark,_setPbAccountingMark]=x.useState(null)';
 patch(state,state+',[_pb2026Mode,_setPb2026Mode]=x.useState("all"),[_pb2026Notice,_setPb2026Notice]=x.useState(null)','customer filter state');
 // R1822 already wraps the invoice filter before this stage. Keep sorting before pagination.
 const applied='const Ve=pb1822FinanceNewestFirst(r.filter(';
 const helper='const pb2026Notify=(kind,message="")=>_setPb2026Notice(old=>({kind,message,serial:(old?.serial||0)+1})),pb2026ApplyRange=()=>{if(t!=="lab"){if(!_pbInvFrom||!_pbInvTo){pb2026Notify("error","لطفاً تاریخ شروع و پایان بازه را انتخاب کنید.");return}if(_pbInvFrom>_pbInvTo){pb2026Notify("error","تاریخ شروع نباید بعد از تاریخ پایان باشد.");return}_setPb2026Mode("range");pb2026Notify("range")}_setPbInvAppliedFrom(_pbInvFrom),_setPbInvAppliedTo(_pbInvTo),Ie(1)};const Ve=pb1822FinanceNewestFirst(r.filter(';
 patch(applied,helper,'validate requested date range');
 const today='_pbInvAppliedFrom===$s(new Date())&&_pbInvAppliedTo===$s(new Date())';
 patch('className:"pb1176Today "+('+today+'?"active":"")','className:"pb1176Today "+(('+today+'&&(t==="lab"||_pb2026Mode!=="range"))?"active":""),"aria-pressed":'+today+'&&(t==="lab"||_pb2026Mode!=="range")','today selection');
 patch('className:"invoiceRangeApply",onClick:()=>{_setPbInvAppliedFrom(_pbInvFrom),_setPbInvAppliedTo(_pbInvTo),Ie(1)}','className:"invoiceRangeApply"+(t!=="lab"&&!!(_pbInvAppliedFrom||_pbInvAppliedTo)&&(_pb2026Mode==="range"||!('+today+'))?" active":""),"aria-pressed":t!=="lab"&&!!(_pbInvAppliedFrom||_pbInvAppliedTo)&&(_pb2026Mode==="range"||!('+today+')),onClick:t==="lab"?()=>{_setPbInvAppliedFrom(_pbInvFrom),_setPbInvAppliedTo(_pbInvTo),Ie(1)}:pb2026ApplyRange','range selected state');
 patch('className:"invoiceRangeAll",onClick:','className:"invoiceRangeAll"+(t!=="lab"&&!_pbInvAppliedFrom&&!_pbInvAppliedTo?" active":""),"aria-pressed":t!=="lab"&&!_pbInvAppliedFrom&&!_pbInvAppliedTo,onClick:','all selected state');
 patch('if(t!=="lab")c("");_setPbInvFrom(day);_setPbInvTo(day);_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day);Ie(1)','if(t!=="lab")c("");_setPbInvFrom(day);_setPbInvTo(day);_setPbInvAppliedFrom(day);_setPbInvAppliedTo(day);Ie(1);if(t!=="lab"){_setPb2026Mode("today");pb2026Notify("today")}','today notice');
 patch('t!=="lab"&&c(""),_setPbInvFrom(""),_setPbInvTo(""),_setPbInvAppliedFrom(""),_setPbInvAppliedTo(""),Ie(1)','t!=="lab"&&c(""),_setPbInvFrom(""),_setPbInvTo(""),_setPbInvAppliedFrom(""),_setPbInvAppliedTo(""),Ie(1),t!=="lab"&&(_setPb2026Mode("all"),pb2026Notify("all"))','all notice');
 // R2028: scope to the R2003 date-clear button, not a shared setter tail.
 for(const [key,placeholder] of [['From','از تاریخ'],['To','تا تاریخ']]){
  const handler='className:"dateClearBtn","aria-label":"پاک کردن '+placeholder+'",onClick:()=>{_setPbInv'+key+'("");_setPbInvApplied'+key+'("");Ie(1)';
  patch(handler,handler+';_setPb2026Notice(null);_setPb2026Mode("all")','clear '+key+' feedback');
 }
 const feedback='t==="customer"&&_pb2026Notice&&e.jsx("div",{className:"pb2026InvoiceFeedback",role:_pb2026Notice.kind==="error"?"alert":"status","aria-live":"polite","data-kind":_pb2026Notice.kind,children:_pb2026Notice.kind==="error"?_pb2026Notice.message:m?"در حال دریافت فاکتورها…":_pb2026Notice.kind==="range"?(Ve.length?V(Ve.length)+" سند مالی در بازه انتخابی یافت شد.":"در بازه انتخابی فاکتور یا سند مالی یافت نشد."):_pb2026Notice.kind==="today"?(Ve.length?V(Ve.length)+" سند مالی امروز یافت شد.":"امروز فاکتور یا سند مالی یافت نشد."):(Ve.length?V(Ve.length)+" سند مالی نمایش داده شد.":"فاکتور یا سند مالی یافت نشد.")},_pb2026Notice.serial)';
 patch('Ve.length?e.jsxs(e.Fragment,{children:[','Ve.length?e.jsxs(e.Fragment,{children:['+feedback+',','notice above results');
 const empty='e.jsx(zn,{text:"هنوز فاکتور یا سند مالی صادر نشده است."})';
 patch(empty,'(t==="lab"?'+empty+':e.jsxs(e.Fragment,{children:['+feedback+',e.jsx(zn,{text:(_pbInvAppliedFrom||_pbInvAppliedTo)?"در بازه انتخابی فاکتور یا سند مالی وجود ندارد.":l?"فاکتور یا سند مالی مطابق جستجو یافت نشد.":"هنوز فاکتور یا سند مالی صادر نشده است."})]}))','notice and accurate empty state');
 pb2026UI=pb2026UI.slice(0,start)+part+pb2026UI.slice(end+1)+'\n/* PB2026 customer invoice filter feedback */\n';
 write(file,pb2026UI);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*|index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('invoiceFeedback=r2026')?url:url+'&invoiceFeedback=r2026');
 write(p,h);
}


// R2029: bump the delivered stylesheet before the final CSS bundling step.
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('financePolish=r2029')?url:url+'&financePolish=r2029');
 write(p,h);
}


// R2030: the embedded finance scrollport starts at the iframe edge (the
// parent already reserves all three headers). Do not reapply an inner legacy
// Print header inset. Other Print/Album/archive routes keep their behavior.
let pb2030Inset=read(pb2016InsetFile);
if(!pb2030Inset.includes('/* PB2030 embedded finance inset */')){
 const anchor='const top=getComputedStyle(area).position===\'fixed\'?window.pb1318PrintInset():0;';
 const replacement='const top=area.querySelector(".financeWorkspace")?0:getComputedStyle(area).position===\'fixed\'?window.pb1318PrintInset():0; /* PB2030 embedded finance inset */';
 pb2030Inset=once(pb2030Inset,anchor,replacement,'R2030 embedded finance scroll origin');
 write(pb2016InsetFile,pb2030Inset);
}
execFileSync(process.execPath,['--check',pb2016InsetFile],{stdio:'inherit'});

// R2030: a real shared invoice column header inside the same horizontal
// scroll container as its records. The existing row renderer, document types,
// action handlers, filtering, totals and pagination stay unchanged.
let pb2030UI=read(file);
if(!pb2030UI.includes('/* PB2030 photographer invoice columns */')){
 const start=pb2030UI.indexOf('function ub({role:t,'),end=pb2030UI.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error('[R2030] finance component missing');
 let part=pb2030UI.slice(start,end+1);
 const anchor='className:"invoiceRows accountingInvoiceRows",children:qe.map(Je=>{';
 const labels=['شماره سند','لابراتوار','سفارش / سند مبنا','تاریخ صدور','مبلغ','پرداخت / نوع سند','مانده / شرح','عملیات'];
 const head='e.jsx("div",{className:"pb2030InvoiceColumns",children:'+JSON.stringify(labels)+'.map(label=>e.jsx("span",{children:label},label))},"pb2030-columns")';
 part=once(part,anchor,'className:"invoiceRows accountingInvoiceRows",children:(t==="customer"?[null,...qe]:qe).map(Je=>{if(Je===null)return '+head+';','R2030 shared invoice column heading');
 pb2030UI=pb2030UI.slice(0,start)+part+pb2030UI.slice(end+1)+'\n/* PB2030 photographer invoice columns */\n';
 write(file,pb2030UI);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*|photobridge-r1318-print-insets\.js\?[^"'<> \t\r\n]*|index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('fixedFinance=r2030')?url:url+'&fixedFinance=r2030');
 write(p,h);
}


// R2032: measure the actual bottom of the visible finance third row, not
// the nominal two-row chrome height. The same measurement serves the native
// root scrollport and the embedded Print iframe without double-counting.
let pb2032Inset=read(pb2016InsetFile);
if(!pb2032Inset.includes('/* PB2032 actual finance header edge */')){
 const anchor="const resize=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;";
 const helper=[
  '/* PB2032 actual finance header edge */',
  'const pb2032BaseInset=window.pb1319DesktopPrintInset;',
  'const pb2032Third=chrome=>chrome.querySelector(".pb1632FinanceTabs:not([hidden])");',
  'window.pb1319DesktopPrintInset=chrome=>Math.max(pb2032BaseInset(chrome),edge([pb2032Third(chrome)].filter(Boolean)));',
  'function pb2032Measure(chrome){',
  ' const third=chrome&&pb2032Third(chrome);',
  ' if(third&&visible(third)){watch(third);watch(chrome);const value=window.pb1319DesktopPrintInset(chrome)+"px";if(document.documentElement.style.getPropertyValue("--pb2032-finance-edge")!==value)document.documentElement.style.setProperty("--pb2032-finance-edge",value);}',
  ' else if(document.documentElement.style.getPropertyValue("--pb2032-finance-edge"))document.documentElement.style.removeProperty("--pb2032-finance-edge");',
  '}'
 ].join('\n');
 pb2032Inset=once(pb2032Inset,anchor,helper+'\n '+anchor,'R2032 finance edge helper');
 const panelLine='if(chrome&&panel&&!panel.hidden){';
 pb2032Inset=once(pb2032Inset,panelLine,'pb2032Measure(chrome);\n  '+panelLine,'R2032 measure before scroll positioning');
 write(pb2016InsetFile,pb2032Inset);
}
execFileSync(process.execPath,['--check',pb2016InsetFile],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*|photobridge-r1318-print-insets\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('financeEdge=r2032')?url:url+'&financeEdge=r2032');
 write(p,h);
}


// R2033: never mount the redundant customer finance heading, including
// the loading frame and payments. Lab headings and handlers are unchanged.
let pb2033UI=read(file);
if(!pb2033UI.includes('/* PB2033 customer finance heading and statement validation */')){
 const start=pb2033UI.indexOf('function ub({role:t,'),end=pb2033UI.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error('[R2033] finance component missing');
 let part=pb2033UI.slice(start,end+1);
 const heading='e.jsxs("div",{className:"sectionTopline financeTopline"';
 part=once(part,heading,'t==="lab"&&'+heading,'R2033 omit photographer finance heading at render');
 const submit='onClick:()=>b(),children:D?"در حال محاسبه…":"نمایش حساب"';
 const validated='onClick:()=>{if(t==="customer"){if(!_e||!je){alert("لطفاً تاریخ شروع و پایان بازه را انتخاب کنید.");return}if(_e>je){alert("تاریخ شروع نباید بعد از تاریخ پایان باشد.");return}}b()},children:D?"در حال محاسبه…":"نمایش حساب"';
 part=once(part,submit,validated,'R2033 validate explicit photographer statement action');
 pb2033UI=pb2033UI.slice(0,start)+part+pb2033UI.slice(end+1)+'\n/* PB2033 customer finance heading and statement validation */\n';
 write(file,pb2033UI);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*|index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('financeSettings=r2033')?url:url+'&financeSettings=r2033');
 write(p,h);
}


// R2034: tag only the customer workspace at its root. This tag is present
// during loading, when the individual invoice/statement/payment children
// have not yet been mounted.
let pb2034UI=read(file);
if(!pb2034UI.includes('/* PB2034 customer finance tab identity */')){
 const start=pb2034UI.indexOf('function ub({role:t,'),end=pb2034UI.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error('[R2034] finance component missing');
 let part=pb2034UI.slice(start,end+1);
 const anchor='className:"financeWorkspace accountingWorkspace financeWorkspaceCompact",children:';
 part=once(part,anchor,'className:"financeWorkspace accountingWorkspace financeWorkspaceCompact","data-pb2034-finance-tab":t==="customer"?w:void 0,children:','R2034 customer finance tab identity');
 pb2034UI=pb2034UI.slice(0,start)+part+pb2034UI.slice(end+1)+'\n/* PB2034 customer finance tab identity */\n';
 write(file,pb2034UI);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 h=h.replace(/(photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*|photobridge-r1318-print-insets\.js\?[^"'<> \t\r\n]*|index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*)/g,url=>url.includes('allFinanceEdges=r2034')?url:url+'&allFinanceEdges=r2034');
 write(p,h);
}



// R2035: one desktop landing owner. R1099 already resolves authenticated
// membership and chooses the real Print workspace; the legacy entry router
// must not issue a competing Gallery replacement on desktop.
const pb2035EntryFile='dist/web/photobridge-r100f5-entry-routing.js';
let pb2035Entry=read(pb2035EntryFile);
if(!pb2035Entry.includes('/* PB2035 desktop landing owner */')){
 const anchor='  async function route(){';
 pb2035Entry=once(pb2035Entry,anchor,anchor+"\n    /* PB2035 desktop landing owner */ if(window.matchMedia&&!window.matchMedia('(max-width:820px)').matches)return;",'R2035 desktop landing owner');
 write(pb2035EntryFile,pb2035Entry);
}
// Bound chooser calls and keep the last confirmed selection distinct from a
// pending request. A timeout never assumes that a selection was committed.
const pb2035ChooserFile='dist/web/photobridge-v904r99-lab-chooser.js';
let pb2035Chooser=read(pb2035ChooserFile);
if(!pb2035Chooser.includes('/* PB2035 bounded lab selection */')){
 const start=pb2035Chooser.indexOf('  async function api(path,opt={}){');
 const end=pb2035Chooser.indexOf('\n  function style(){',start);
 if(start<0||end<=start)throw Error('[R2035] chooser API boundary');
 const helper=[
  '  /* PB2035 bounded lab selection */',
  '  let pb2035Selecting=false;',
  '  async function api(path,opt={}){',
  '    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);',
  '    try{',
  '      const r=await fetch(path,{credentials:"include",cache:"no-store",...opt,signal:controller.signal,headers:{"Content-Type":"application/json","x-photobridge-portal":"photographer",...(opt.headers||{})}});',
  '      let j={};try{j=await r.json()}catch(err){if(controller.signal.aborted)throw err}',
  '      if(!r.ok){const e=new Error(j?.error||("HTTP "+r.status));e.status=r.status;e.data=j;throw e}return j;',
  '    }finally{clearTimeout(timer)}',
  '  }'
 ].join('\n');
 pb2035Chooser=pb2035Chooser.slice(0,start)+helper+pb2035Chooser.slice(end);
 const anchor="if(sel){const id=sel.dataset.select;sel.disabled=true;";
 pb2035Chooser=once(pb2035Chooser,anchor,"if(sel){if(pb2035Selecting)return;pb2035Selecting=true;const id=sel.dataset.select;sel.disabled=true;",'R2035 single lab selection');
 pb2035Chooser=once(pb2035Chooser,"sessionStorage.setItem(SESSION_KEY,id);cleanup();const u=new URL(location.href);","sessionStorage.setItem(SESSION_KEY,id);try{sessionStorage.setItem('pb2035ConfirmedLab',JSON.stringify({id,at:Date.now()}));sessionStorage.setItem('photobridge:r100f37:lab-enter-pending',String(Date.now()))}catch{}const u=new URL(location.href);",'R2035 retain chooser until confirmed navigation');
 pb2035Chooser=once(pb2035Chooser,"sel.disabled=false;toast(err.status===403?","pb2035Selecting=false;sel.disabled=false;toast(err.name==='AbortError'?'پاسخ لابراتوار طول کشید؛ دوباره تلاش کنید.':err.status===403?",'R2035 recover from selection timeout');
 const runAnchor="    if(!isPrintRoute()){cleanup();return}\n    if(running)";
 pb2035Chooser=once(pb2035Chooser,runAnchor,[
  '    if(!isPrintRoute()){cleanup();return}',
  '    if(pb2035Selecting)return;',
  '    // A successful POST already selected the lab. Do not reopen the chooser',
  '    // on the next document merely because an old prefetched list is stale.',
  '    if(!force&&new URLSearchParams(location.search).get("pbEntryDone")==="lab"){',
  '      try{const confirmed=JSON.parse(sessionStorage.getItem("pb2035ConfirmedLab")||"null");if(confirmed&&confirmed.id===sessionStorage.getItem(SESSION_KEY)&&Date.now()-confirmed.at>=0&&Date.now()-confirmed.at<30000){cleanup();return}}catch{}',
  '    }',
  '    if(running)'
 ].join('\n'),'R2035 avoid redundant chooser round trip after confirmed select');
 // An in-flight background refresh must not repaint the chooser during selection.
 pb2035Chooser=pb2035Chooser.replaceAll('epoch!==runEpoch||!isPrintRoute()','epoch!==runEpoch||!isPrintRoute()||pb2035Selecting');
 write(pb2035ChooserFile,pb2035Chooser);
}
for(const p of [pb2035EntryFile,pb2035ChooserFile])execFileSync(process.execPath,['--check',p],{stdio:'inherit'});

// A document opened directly on /photographer/login can complete login in
// the same React document. Keep its desktop observer installed, but render
// nothing on the auth screen; reassert desktop ownership on the real route.
const pb2035NavFile='dist/web/photobridge-r1126-desktop-navigation.js';
let pb2035Nav=read(pb2035NavFile);
if(!pb2035Nav.includes('/* PB2035 same-document login */')){
 const gate="if(!/^\\/photographer(?:\\/|$)/.test(location.pathname)||/^\\/photographer\\/(login|signup|register|invite)(?:\\/|$)/.test(location.pathname)){";
 const pos=pb2035Nav.indexOf(gate);
 if(pos<0)throw Error('[R2035] desktop bootstrap route guard');
 const render=pb2035Nav.indexOf(' function render(){');
 if(render<pos)throw Error('[R2035] expected bootstrap before renderer');
 pb2035Nav=pb2035Nav.slice(0,pos)+pb2035Nav.slice(pos).replace(gate,gate.replace('(login|signup|register|invite)','(signup|register|invite)'));
 const native="const current=currentDocument();const native=selected?(current&&nativeHeader(current)):nativeHeader(document);if(!native)return;";
 pb2035Nav=once(pb2035Nav,native,native+"document.documentElement.classList.add('pb1126Desktop'); /* PB2035 same-document login */",'R2035 reassert canonical header ownership');
 write(pb2035NavFile,pb2035Nav);
}
execFileSync(process.execPath,['--check',pb2035NavFile],{stdio:'inherit'});

// Install the gate before any deferred legacy renderer or React first paint.
// Desktop only; the approved mobile animated splash is untouched.
const pb2035Gate=read('scripts/r2035-photographer-entry.js');
const pb2035Style=read('scripts/r2035-photographer-entry.css');
new Function(pb2035Gate);
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let h=read(p);
 if(p==='dist/web/index.html'&&!h.includes('id="pb2035EntryGate"')){
  h=once(h,'<head>','<head><style id="pb2035EntryStyle">'+pb2035Style+'</style><script id="pb2035EntryGate">'+pb2035Gate+'</script>','R2035 prepaint entry gate');
 }
 h=h.replace(/(photobridge-r1126-desktop-navigation\.js\?[^"'<> \t\r\n]*|photobridge-r100f5-entry-routing\.js\?[^"'<> \t\r\n]*|photobridge-v904r99-lab-chooser\.js\?[^"'<> \t\r\n]*|photobridge-r2001-photographer-fourth-header\.css\?[^"'<> \t\r\n]*)/g,url=>url.includes('stableEntry=r2035')?url:url+'&stableEntry=r2035');
 write(p,h);
}

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib');
const read=p=>fs.readFileSync(p,'utf8');
const api=new Function(read('scripts/r2047-lab-print-finance-patch.js.txt')+'\nreturn {pb2047CleanUploadName,pb2047UniqueUploadBase,pb2047PrintMarked,pb2047Downloaded,pb2047RangeError,pb2047InRange,pb2047Ui,pb2047Server,pb2048StatementFilters,pb2049FinanceAssetUrl}')();
test('R2047 removes arbitrary user suffix before the file extension',()=>{
 const f=api.pb2047CleanUploadName;
 for(const [input,output] of [['IMG_201=2.jpg','IMG_201.jpg'],['عکس = قاب = 3.JPG','عکس.JPG'],['A=S:Frame.png','A.png'],['A=foo.bar.jpeg','A.jpeg'],['A=.tif','A.tif'],['A=any','A'],['=4.jpg','photo.jpg'],['a.b.jpg','a.b.jpg'],['folder=1/IMG=2.jpg','IMG.jpg']])assert.equal(f(input),output,input);
});
test('R2047 sequential normalized name collision keeps both files distinct',async()=>{
 const id='01234567-89ab-4cde-8f01-23456789abcd',fn=api.pb2047UniqueUploadBase;
 assert.equal(await fn({query:async()=>({rowCount:0})},'order',id,'IMG.jpg'),'IMG.jpg');
 assert.equal(await fn({query:async()=>({rowCount:1})},'order',id,'IMG.jpg'),'IMG-0123456789ab.jpg');
});
test('R2047 automatic verified download and invoice cannot complete print or binding',()=>{
 for(const invoice_id of [undefined,'invoice-1']){
  const order={status:'downloaded',downloaded_at:'2026-11-26',invoice_id,album_stage:'files_received'};
  assert(api.pb2047Downloaded(order));
  assert.equal(api.pb2047PrintMarked(order,false),false);assert.equal(api.pb2047PrintMarked(order,true),false);
  assert(api.pb2047PrintMarked({...order,status:'printing'},false));
  assert(api.pb2047PrintMarked({...order,status:'printing',album_stage:'printing'},true));
 }
 assert(api.pb2047PrintMarked({status:'ready'},false));
 assert(api.pb2047PrintMarked({album_stage:'binding'},true));
});
test('R2047 finance range reports missing photographer, invalid dates and empty results',()=>{
 const date=x=>String(x||'').slice(0,10);
 assert.match(api.pb2047RangeError('','2026-11-01','2026-11-26',date),/عکاسی/);
 assert.match(api.pb2047RangeError('a','','2026-11-26',date),/تاریخ/);
 assert(api.pb2047RangeError('a','2026-11-26','2026-11-01',date));
 assert.equal(api.pb2047RangeError('a','2026-11-01','2026-11-26',date),'');
 const rows=[{customer_id:'a',issued_at:'2026-11-26T22:00:00Z'},{customer_id:'b',issued_at:'2026-11-20'}];
 assert(api.pb2047InRange(rows,'a','2026-11-01','2026-11-26',date));
 assert.equal(api.pb2047InRange(rows,'a','2026-11-01','2026-11-25',date),false);
 assert.equal(api.pb2047InRange(rows,'c','2026-11-01','2026-11-26',date),false);
});
test('R2048 handles actual R1431 hidden Lab submit and R2033 customer validation',async()=>{
 const label='children:D?"در حال محاسبه…":"نمایش حساب"})';
 const click='onClick:()=>{if(t==="customer"){if(!_e||!je){alert("لطفاً تاریخ شروع و پایان بازه را انتخاب کنید.");return}if(_e>je){alert("تاریخ شروع نباید بعد از تاریخ پایان باشد.");return}}b()},';
 const variants=[
  't!=="lab"&&e.jsx("button",{className:"primary",disabled:D,'+click+label,
  't!=="lab"&&e.jsx("button",{className:"primary",disabled:D,onClick:()=>b(),'+label,
  'e.jsx("button",{className:"primary",disabled:D||t==="lab"&&!z,onClick:()=>b(),'+label
 ];
 for(const variant of variants){
  const transformed=api.pb2048StatementFilters(variant);
  assert(transformed.includes(variant.startsWith('t!==')?variant:'t!=="lab"&&'+variant));
  const make=new Function('t','D','z','_e','je','$s','b','alert','e','pb2047RangeError','return ['+transformed+'].filter(Boolean)');
  const date=x=>String(x||''),e={jsx:(type,props)=>props};let calls=0;const messages=[];
  const render=(role,customer,from,to,rows=[])=>make(role,false,customer,from,to,date,async()=>{calls++;return {rows}},m=>messages.push(m),e,api.pb2047RangeError);
  let buttons=render('lab','','2026-11-01','2026-11-26');assert.equal(buttons.length,1);assert.equal(buttons[0].disabled,false);assert.equal(buttons[0].children,'نمایش بازه');await buttons[0].onClick();assert.equal(calls,0);assert.match(messages.pop(),/عکاسی/);
  buttons=render('lab','studio','2026-11-01','2026-11-26');await buttons[0].onClick();assert.equal(calls,1);assert.match(messages.pop(),/گردش مالی/);
  buttons=render('lab','studio','2026-11-01','2026-11-26',[{}]);await buttons[0].onClick();assert.equal(calls,2);assert.equal(messages.length,0);
  buttons=render('customer','','2026-11-01','2026-11-26');assert.equal(buttons.length,1);assert.equal(buttons[0].children,'نمایش حساب');await buttons[0].onClick();assert.equal(calls,3);
 }
});
test('R2049 keeps finance cache invalidation and R1960/R1897 final URL contract together',()=>{
 for(const raw of [
  '/assets/index-UIRefine-v655-r84.js?v=r1159&nativePhoto=r2044&albumSizes=r1960',
  '/lab-desktop-ui/assets/index-UIRefine-v655-r84.js?v=r1159&albumSizes=r1960&labPrintFinance=r2047&labStatement=r2048&labStage=r1956',
  '/assets/index-UIRefine-v655-r84.js?v=r1159&labStage=r1894&albumSizes=r1960&labFinanceCache=r2049'
 ]){
  const patched=api.pb2049FinanceAssetUrl(raw);
  assert.equal(api.pb2049FinanceAssetUrl(patched),patched);
  const final=patched.replace(/&labStage=r\d+/g,'')+'&labStage=r1956';
  assert.match(final,/albumSizes=r1960&labStage=r1956$/);
  for(const tag of ['labPrintFinance=r2047','labStatement=r2048','labFinanceCache=r2049','albumSizes=r1960','labStage=r1956'])assert.equal(final.split(tag).length,2);
  assert(final.startsWith(raw.split('&')[0]));
 }
});
test('R2050 caches Persian month calculation and reuses identical formatters',()=>{
 let months=0;
 const helper=new Function('wg',read('scripts/r2050-native-finance-speed.js.txt')+'\nreturn {pb2050Formatter,pb2050CalendarMonth}')((year,month)=>{months++;return [year,month]});
 const options={timeZone:"Asia/Tehran",year:"numeric",month:"numeric",day:"numeric"},locale="en-US-u-ca-persian",d=new Date("2026-11-26T08:00:00Z");
 assert.equal(helper.pb2050Formatter(locale,options),helper.pb2050Formatter(locale,options));
 assert.deepEqual(helper.pb2050Formatter(locale,options).formatToParts(d),new Intl.DateTimeFormat(locale,options).formatToParts(d));
 assert.equal(helper.pb2050CalendarMonth(1405,9),helper.pb2050CalendarMonth(1405,9));assert.equal(months,1);
 helper.pb2050CalendarMonth(1405,10);assert.equal(months,2);
});
test('R2050 native finance feedback is nonblocking and replaces previous notice',()=>{
 const nodes=[];const make=()=>({children:[],append(...children){this.children.push(...children)},setAttribute(){},addEventListener(name,fn){this[name]=fn},remove(){this.removed=true}});
 const doc={createElement:make,getElementById:id=>nodes.findLast(node=>node.id===id&&!node.removed),body:{append:node=>nodes.push(node)}};
 const notice=new Function('document','setTimeout',read('scripts/r2050-native-finance-speed.js.txt')+'\nreturn pb2050Notice')(doc,()=>{});
 notice('انتخاب عکاسی');notice('انتخاب تاریخ');assert(nodes[0].removed);assert.equal(nodes[1].children[1].children[1].textContent,'انتخاب تاریخ');nodes[1].children[2].click();assert(nodes[1].removed);
});
test('R2051 photographer picker has one neutral frame and independent searchable content',()=>{
 const jsx=(type,props)=>({type,...props}),picker=new Function('x','e','wn',read('scripts/r2050-native-finance-speed.js.txt')+'\nreturn pb2050CustomerPicker')({useMemo:fn=>fn()},{jsx},'Select');
 for(const statement of [false,true]){
  const tree=picker({statement,value:'s',customers:[{id:'s',name:'استودیو'}],onChange:()=>{}});
  assert(tree.className.includes('pb2051PickerFrame'));assert.equal(tree.children.className,'pb2050CustomerPicker');
  assert.equal(tree.children.options[1].label,'استودیو');assert.equal(tree.children.searchable,true);
 }
});
test('R2051 confirmed invoice rows are committed before dependent requests, and receipt warm reads coalesce',async()=>{
 const patch=new Function(read('scripts/r2051-finance-first-load.js.txt')+'\nreturn pb2051Patch')();
 const fixture='function ub({role:t,quickPinned:a}){const[r,o]=x.useState([]);const loader=async()=>{if(t==="lab"){const extraPath=w==="payments"?"/api/lab/finance/payments":null;const Ot=await Me(ke);const Et=await Me("summary");C(Et.customers||[]);S(extra?.payments||[]);}else{}};const pb1569FinanceLoader=x.useRef(null);x.useEffect(()=>{pb1569LoadedFinanceView.current=w;\n   const endpoint=w==="payments"?"/api/lab/finance/payments":null;},[w]);const pb1420Payments=pb1822FinanceNewestFirst(h,"receipt");return (m?e.jsx("div",{className:"card loadingBox",children:"در حال دریافت اطلاعات مالی…"}):e.jsx("div",{children:pb1420Payments.length?1:0}));w==="statement"&&e.jsxs("div",{className:"customerStatementWorkspace",children:[]})}function hb(){}';
 const patched=patch(fixture);assert.equal(patch(patched),patched);new Function(patched);
 const begin=patched.indexOf('const extraPath=w==="expenses"'),end=patched.indexOf('}else{',begin),loader=patched.slice(begin,end);
 const calls=[],release={};const Me=path=>{calls.push(path);return new Promise(resolve=>{release[path]=resolve})};
 const receiptStart=patched.indexOf('const pb2051LoadReceipts='),receiptEnd=patched.indexOf('const pb1569FinanceLoader=',receiptStart);
 const run=new Function('Me','o','f','C','q','S','pb2051SetInvoicesReady','pb2051SetReceiptsState','pb2051ReceiptsLoaded','pb2051ReceiptsFlight','return (()=>{'+patched.slice(receiptStart,receiptEnd)+';return {load:async(w)=>{const At=new URLSearchParams(),ke="invoice",z="studio",I=()=>{},k=()=>{};'+loader+'},receipts:pb2051LoadReceipts}})()')(Me,()=>calls.push('invoice-render'),()=>calls.push('summary-render'),()=>{},()=>{},()=>calls.push('receipt-render'),()=>calls.push('invoice-ready'),state=>calls.push(state),{current:false},{current:null});
 const pending=run.load('invoices');assert.deepEqual(calls,['invoice']);release.invoice({invoices:[]});await Promise.resolve();assert.deepEqual(calls.slice(0,3),['invoice','invoice-render','invoice-ready']);
 const p=run.receipts(),p2=run.receipts();assert.equal(p,p2);assert.equal(calls.filter(x=>x==='/api/lab/finance/payments').length,1);
 release['/api/lab/finance/payments']({payments:[]});await p;assert(calls.includes('receipt-render'));assert(!calls.includes('summary-render'));release['/api/lab/finance/summary?']({customers:[]});await pending;assert(calls.includes('summary-render'));
});
test('R2047 final server and Lab web/Windows payloads contain matching fixes and integrity metadata',()=>{
 const s=read('dist/api/server.js');
 assert(s.includes('/* PB2047 server */'));
 assert(s.includes("status=CASE WHEN status IN ('printing','reviewing','ready_print','printed','ready','completed') THEN status ELSE 'downloaded' END"));
 assert(s.includes("album_stage=CASE WHEN album_stage IN ('printing','binding','ready','completed') THEN album_stage ELSE 'files_received' END"));
 assert(s.split("safeFileName(pb2047CleanUploadName(String(b.name || 'file')))").length>=4);
 assert.equal(api.pb2047Server(s),s);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const asset='assets/index-UIRefine-v655-r84.js',ui=read(root+'/'+asset),html=read(root+'/index.html');
  assert(ui.includes('/* PB2047 Lab UI */'));
  assert(ui.includes('if(nt==="print")return pb2047PrintMarked(le,o==="album")'));
  assert(ui.includes('return Cn(le,"printing");'));
  assert(ui.includes('t==="lab"&&e.jsx("button",{type:"button",className:"primary pb2047StatementRange"'));
  assert(ui.includes('در بازه انتخاب‌شده برای این عکاسی فاکتوری وجود ندارد.'));
  assert(ui.includes('در بازه انتخاب‌شده برای این عکاسی گردش مالی وجود ندارد.'));
  assert(html.includes('labPrintFinance=r2047'));assert.match(html,/labPrintFinance=r2047&labStatement=r2048&labFinanceCache=r2049&albumSizes=r1960&labStage=r1956/);assert(html.includes('pb2047LabFinanceStyle'));
  assert.equal(api.pb2047Ui(ui),ui);
  if(root.endsWith('/lab-desktop-ui')){
   assert(ui.includes('/* PB2050 native finance responsiveness */'));
   assert(ui.includes('const f=c?pb2050CalendarMonth(g.year,g.month):[]'));
   assert(ui.includes('m(false);a(nl(k))'));
   assert(ui.includes('const Ve=x.useMemo(()=>pb1822FinanceNewestFirst(r.filter('));
   assert(ui.includes('if(error){pb2050Notice(error);return;}'));
   assert(html.includes('nativeFinance=r2050')&&html.includes('pb2050NativeFinanceStyle'));
   assert(ui.includes('/* PB2051 progressive native finance */')&&ui.includes('pb2051PickerFrame'));
   assert(ui.includes('pb2051SetInvoicesReady(true)')&&ui.includes('pb2051LoadReceipts()'));
   assert(html.includes('financeFirstLoad=r2051')&&html.includes('pb2051FinanceStyle'));
  }else assert(!ui.includes('/* PB2050 native finance responsiveness */'));

  for(const name of [asset,'index.html']){
   const file=root+'/'+name,bytes=fs.readFileSync(file);
   for(const [suffix,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(file+suffix))assert(decode(fs.readFileSync(file+suffix)).equals(bytes),'stale compressed '+file);
   if(root.endsWith('lab-desktop-ui')){const m=JSON.parse(read(root+'/manifest.json'));assert.equal(m.files.find(x=>x.name===name)?.sha256,crypto.createHash('sha256').update(bytes).digest('hex'))}
  }
 }
});

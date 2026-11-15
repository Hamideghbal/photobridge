const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('dist/web/assets/index-UIRefine-v655-r84.js');
const api=read('dist/api/server.js');
const css=read('dist/web/photobridge-r1132-photo-copies-mobile.css');
const header=read('dist/web/photobridge-r1126-desktop-navigation.css');
const html=read('dist/web/index.html');
const sql=read('migrations/177_order_file_print_copies.sql');
const getFunc=(code,from,to)=>{const a=code.indexOf(from),b=code.indexOf(to,a+from.length);assert.ok(a>=0&&b>a,'function anchors');return code.slice(a,b)};
test('copy quantity is capped 1 to 99 and display name preserves extension',()=>{
 const f=getFunc(app,'function pbPrintCopies(t)','function ej({');
 const funcs=vm.runInNewContext(f+';({pbPrintCopies,pbPrintCopyFilename})');
 assert.equal(funcs.pbPrintCopies({}),1);
 assert.equal(funcs.pbPrintCopies({printCopies:3}),3);
 assert.equal(funcs.pbPrintCopies({printCopies:1000}),99);
 assert.equal(funcs.pbPrintCopies({printCopies:-8}),1);
 assert.equal(funcs.pbPrintCopyFilename('DSC_1024.jpg',3),'DSC_1024 = 3.jpg');
 assert.equal(funcs.pbPrintCopyFilename('DSC_1024.jpg',1),'DSC_1024.jpg');
 const server=vm.runInNewContext(getFunc(api,'function orderPrintCopyName(name, copies)','function albumMoney(')+';orderPrintCopyName');
 assert.equal(server('DSC_1024.jpg',3),'DSC_1024 = 3.jpg');
 assert.equal(server('DSC_1024.jpg',1),'DSC_1024.jpg');
 assert.ok(server('x'.repeat(180)+'.jpg',99).length<=140);
});
test('upload keeps a single file and sends quantity as metadata',()=>{
 assert.ok(app.includes('name:tt.file.name,printCopies:pbPrintCopies(tt)'));
 assert.ok(app.includes('const ot=T.reduce((ue,P)=>ue+P.files.length,0)'));
 assert.ok(app.includes('frameOverride:null,printCopies:1,progress:0'));
 assert.ok(app.includes('printCopies:pbPrintCopies(ye)'));
 assert.ok(app.includes('PBsetCopies=(ue,P,b)=>'));
 assert.ok(app.includes('className:"simplePrintFinalCopies"'));
 assert.ok(app.includes('className:"simplePrintPhotoCopies"'));
});
test('quotes multiply physical copies including chassis and frames',()=>{
 assert.ok(app.includes('b+=Number(Nt||0)*PBcount'));
 assert.ok(app.includes('b+=pb1781Unit(ue,Ye,"chassis",P)*PBcount'),'model-specific chassis price must multiply by copies');
 assert.ok(app.includes('b+=pb1781Unit(ue,Ye,"frame",P)*PBcount'),'model-specific frame price must multiply by copies');
 assert.ok(app.includes('count:ue.files.reduce((n,f)=>n+pbPrintCopies(f),0)'));
});
test('actual quote calculation uses selected model prices, physical copies and explicit no-print',()=>{
 const start=app.indexOf('const ot=T.reduce((ue,P)=>ue+P.files.length,0)'),end=app.indexOf(',we=Ee.reduce(',start);
 assert(start>=0&&end>start,'quote calculation exists in deployed UI');
 const model=app.match(/const pb1781Unit=\(group,file,kind,row\)=>\{[^\n]+?\};/);
 assert(model,'model-specific unit-price resolver exists');
 const catalog={rates:{s1:{c1:17000,f1:32000}}};
 const row={luster:5000,chassis:1000,frame:2000};
 const quote=vm.runInNewContext('((T,pb1781Catalog)=>{'+model[0]+app.slice(start,end)+';return Ee;})',{
  Zu:()=>row,Wr:(group,file,kind)=>file[kind]??group[kind],t:{},pbPrintCopies:file=>Math.max(1,Math.min(99,Math.round(Number(file.printCopies)||1)))
 });
 const group={id:'g',sizeId:'s1',paperType:'luster',files:[{printCopies:3,chassis:true,frame:true,chassisModelId:'c1',frameModelId:'f1'}]};
 const result=quote([group],catalog)[0];assert.equal(result.total,(5000+17000+32000)*3);assert.equal(result.count,3);assert.equal(result.fileCount,1);assert.equal(result.chassisCount,3);assert.equal(result.frameCount,3);assert.equal(result.pending,false);
 assert.equal(quote([{...group,files:[{...group.files[0],withoutPrint:true}]}],catalog)[0].total,(17000+32000)*3);
 assert.equal(quote([group],{rates:{}})[0].pending,true,'missing model price must remain unresolved, not silently use the legacy price');
 assert.equal(quote([{...group,files:[{printCopies:2,chassis:true,frame:true}]}],catalog)[0].total,(5000+1000+2000)*2,'legacy models retain their own rates');
});
test('actual backend invoice rows preserve model snapshots, copy quantities and component totals',()=>{
 const anchor=api.indexOf('SELECT f.print_size_id,f.print_type,f.chassis,f.frame,f.addon_selection,COALESCE(f.print_copies,1) print_copies');
 const start=api.indexOf('const grouped = new Map();',anchor),end=api.indexOf('const iq = await c.query',start);
 assert(anchor>0&&start>anchor&&end>start,'production invoice grouping and subtotal exist');
 const helperStart=api.indexOf('function pb1797InvoiceComponentRows('),helperEnd=api.indexOf('async function pb1799ProductInvoice(',helperStart);
 assert(helperStart>0&&helperEnd>helperStart,'production component-row splitter exists');
 const invoice=vm.runInNewContext('((rows)=>{'+api.slice(helperStart,helperEnd)+'const fq={rows};'+api.slice(start,end)+';return {items,subtotal};})',{invoicePrintTypeLabel:value=>value});
 const file={print_size_id:'s1',size_label:'20×30',print_type:'luster',luster:5000,chassis:true,frame:true,chassis_price:1000,frame_price:2000,print_copies:3,addon_selection:{chassis:{id:'c1',name:'شاسی ضخیم',unitPrice:17000},frame:{id:'f1',name:'قاب چوبی',colorId:'gold',colorName:'طلایی',unitPrice:32000}}};
 const actual=invoice([file]);assert.equal(actual.subtotal,162000);
 assert.deepEqual(Array.from(actual.items,row=>[row.componentKind,row.quantity,row.unitPrice,row.lineTotal]),[['print',3,5000,15000],['chassis',3,17000,51000],['frame',3,32000,96000]]);
 assert(actual.items.find(row=>row.componentKind==='frame').description.includes('طلایی'));
 assert.equal(invoice([{...file,chassis_price:999999,frame_price:999999}]).subtotal,162000,'later tariff changes cannot rewrite immutable model prices');
 assert.equal(invoice([file,{...file,print_copies:2}]).subtotal,270000,'matching files aggregate physical copies');
 const noPrint=invoice([{...file,print_type:'none'}]);assert.equal(noPrint.subtotal,147000);assert.equal(noPrint.items.some(row=>row.componentKind==='print'),false);
 assert.equal(invoice([{...file,addon_selection:{},print_copies:2}]).subtotal,16000,'legacy models keep legacy rates');
 assert.equal(invoice([{...file,override_unit_price:4000}]).subtotal,159000,'paper overrides do not overwrite addon prices');
 const separate=invoice([file,{...file,addon_selection:{...file.addon_selection,frame:{...file.addon_selection.frame,id:'f2',colorId:'black',colorName:'مشکی'}}}]);
 assert.equal(separate.items.filter(row=>row.componentKind==='frame').length,2,'different model/color snapshots never merge');
 assert.equal(separate.items.reduce((sum,row)=>sum+row.lineTotal,0),separate.subtotal);
});
test('backend validates, persists, renames and invoices all copies',()=>{
 assert.ok(api.includes("error: 'invalid_print_copies'"));
 // Column count grew when frame/chassis model selection was persisted.
 const inserts=[...api.matchAll(/INSERT INTO order_files\s*\(([^)]+)\)\s*VALUES\s*\(([^;]+?)\)/g)];
 assert(inserts.some(([,columns,values])=>/\bprint_copies\b/.test(columns)&&/\boriginal_state\b/.test(columns)&&/['"]pending['"]/.test(values)), 'file insertion must persist print copy count and initial pending state');
 assert.ok(api.includes('const name = orderPrintCopyName(safeFileName'));
 // R1666 sanitizes each directory segment before appending the quantity filename.
 const pathExpression=api.slice(api.indexOf('const name = orderPrintCopyName(safeFileName')).match(/const relativePath = ([^;]+);/);
 assert.ok(pathExpression,'upload relative-path expression exists');
 const sanitizer=getFunc(api,'function safeFileName(name)','function orderPrintCopyName(');
 const relativePath=vm.runInNewContext(sanitizer+';((b,name)=>'+pathExpression[1]+')');
 assert.equal(relativePath({relativePath:'جلسه\\روز اول\\DSC_1024.jpg'},'DSC_1024 = 3.jpg'),'جلسه/روز اول/DSC_1024 = 3.jpg');
 assert.equal(relativePath({relativePath:'shoot:one/DSC_1024.jpg'},'DSC_1024 = 3.jpg'),'shoot_one/DSC_1024 = 3.jpg');
 assert.equal(relativePath({name:'DSC_1024.jpg'},'DSC_1024.jpg'),'DSC_1024.jpg');
 assert.ok(relativePath({relativePath:('folder/'.repeat(200))+'photo.jpg'},'photo = 99.jpg').length<=900);
 assert.ok(api.includes('sum(copies)::int quantity'));
 assert.ok(api.includes('current.quantity += Number(f.print_copies || 1)'));
 assert.ok(api.includes('current.lineTotal += unit * Number(f.print_copies || 1)'));
 assert.ok(api.includes('cur.quantity += Number(x.print_copies || 1)'));
 assert.ok(api.includes('sum(print_copies) FILTER (WHERE chassis)'));
 assert.ok(api.includes('sum(print_copies) FILTER (WHERE frame)'));
});
test('migration and responsive dock settings are present',()=>{
 assert.ok(sql.includes('ADD COLUMN IF NOT EXISTS print_copies integer NOT NULL DEFAULT 1'));
 assert.ok(sql.includes('print_copies BETWEEN 1 AND 99'));
 assert.ok(css.includes('flex:1 1 0!important'));
 assert.ok(css.includes('flex-wrap:nowrap!important'));
 // In final production output the CSS remains present inside the hashed boot bundle.
 if(html.includes('/photobridge-r1132-photo-copies-mobile.css?v=r1134')) {
  assert.ok(html.includes('/photobridge-r1132-photo-copies-mobile.css?v=r1134'));
 } else {
  const manifest=JSON.parse(read('dist/web/assets/photobridge-boot-manifest.json'));
  assert.ok(manifest.sources.includes('/photobridge-r1132-photo-copies-mobile.css?v=r1134'));
  assert.ok(html.includes('/assets/'+manifest.boot));
  assert.ok(read('dist/web/assets/'+manifest.boot).includes('photobridge-r1132-photo-copies-mobile.css'));
 }
 assert.ok(html.includes('assets/index-UIRefine-v655-r84.js?v=r1159'));
 assert.ok(header.includes('bottom:17px!important'));
});

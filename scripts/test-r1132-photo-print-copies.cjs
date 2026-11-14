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
test('backend validates, persists, renames and invoices all copies',()=>{
 assert.ok(api.includes("error: 'invalid_print_copies'"));
 // Column count grew when frame/chassis model selection was persisted.
 const inserts=[...api.matchAll(/INSERT INTO order_files\\s*\\(([^)]+)\\)\\s*VALUES\\s*\\(([^;]+?)\\)/g)];
 assert(inserts.some(([,columns,values])=>/\\bprint_copies\\b/.test(columns)&&/\\boriginal_state\\b/.test(columns)&&/['"]pending['"]/.test(values)), 'file insertion must persist print copy count and initial pending state');
 assert.ok(api.includes('const name = orderPrintCopyName(safeFileName'));
 assert.ok(api.includes('.replace(/[^/]+$/, name).slice(0, 900)'));
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

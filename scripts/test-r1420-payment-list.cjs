const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const source=ui.match(/function PB1420PaymentRows\(rows,customerId\)\{[^\n]*\}/)[0],filter=vm.runInNewContext('('+source+')');
const rows=[{id:'old',customer_id:1,paid_at:'2026-01-01',amount:20},{id:'new',customer_id:2,paid_at:'2026-03-01',amount:40},{id:'middle',customer_id:1,paid_at:'2026-02-01',amount:10}];
test('all receipts default newest first, selection filters by customer ID and clear restores all without changing inputs',()=>{
 const before=JSON.stringify(rows);
 assert.equal(JSON.stringify(filter(rows,'').map(x=>x.id)),JSON.stringify(['new','middle','old']));
 assert.equal(JSON.stringify(filter(rows,'1').map(x=>x.id)),JSON.stringify(['middle','old']));
 assert.equal(filter(rows,'missing').length,0);assert.equal(filter(rows,'').length,3);
 assert.equal(JSON.stringify(rows),before);
});
test('payment selector starts with all customers independently of the statement default and connects explicit selection',()=>{
 assert.ok(ui.includes('[pb1420PaymentCustomer,pb1420SetPaymentCustomer]=x.useState("")'));
 assert.ok(ui.includes('if(w==="payments")pb1420SetPaymentCustomer("")'));
 assert.ok(ui.includes('value:pb1420PaymentCustomer,onChange:Je=>{pb1420SetPaymentCustomer(Je.target.value);q(Je.target.value)}'));
 assert.ok(ui.includes('children:"همهٔ عکاسی‌ها"'));
 assert.ok(ui.includes('onClick:()=>pb1420PaymentCustomer?Ye():_setPb1437PickAction("payment")'),'when no photographer is selected, open the current chooser first');
});
test('receipt list evaluates to a separate Date column and only selected rows',()=>{
 const start=ui.indexOf('w==="payments"&&e.jsx("div",{className:"card financeListCard pb1420Payments"'),end=ui.indexOf(',w==="statement"&&',start);
 assert.ok(start>0&&end>start);
 const jsx=(type,props)=>({type,...props});
 const tree=vm.runInNewContext(ui.slice(start,end),{w:'payments',t:'lab',e:{jsx,jsxs:jsx},pb1420Payments:filter(rows,'1'),pb1420PaymentCustomer:'1',R:String,Xe:String,V:String,vn:v=>v,ge(){},zn:'Empty'});
 const list=tree.children.children;
 assert.equal(list[0].children[1].children,'تاریخ');
 assert.equal(list.length,3);
 assert.equal(list[1].children.find(x=>x&&x.type==='time').dateTime,'2026-02-01');
 assert.equal(list[2].children.find(x=>x&&x.type==='time').dateTime,'2026-01-01');
});
test('secondary finance has no duplicate pricing link and archive footer follows archive content once',()=>{
 const header=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
 assert.ok(header.includes("[['امور مالی',true]]"));
 assert.ok(!header.includes("[['امور مالی',true],['تعرفه‌ها',false]]"));
 const start=ui.indexOf('f==="archive"&&e.jsxs("div",{className:"pb1420ArchivePage"'),end=ui.indexOf(',f==="finance"&&',start);
 const jsx=(type,props)=>({type,...props});
 const tree=vm.runInNewContext(ui.slice(start,end),{f:'archive',hb:'Archive',e:{jsx,jsxs:jsx}});
 assert.equal(tree.children[0].type,'Archive');assert.equal(tree.children[1].className,'productFooter pb1420ArchiveFooter');
 assert.ok(ui.includes('f!=="settings"&&f!=="finance"&&f!=="archive"&&e.jsxs("footer"'));
});
test('build transform is idempotent and generated scripts remain parseable',()=>{
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1147-lab-admin-header.js','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1420-payment-list.mjs']);
 paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 for(const p of paths.slice(0,2))execFileSync(process.execPath,['--check',p]);
});

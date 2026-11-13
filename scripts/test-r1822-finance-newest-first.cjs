'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const path='assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8');
function sorter(root){
 const s=read(root+'/'+path);
 const helper=s.match(/function pb1822FinanceNewestFirst\(rows,kind\)\{[^\n]+?\}\s*(?=function pb1821LabInvoiceIssuer)/)?.[0];
 assert(helper,root+' finance comparator exists');
 return vm.runInNewContext(helper+'; pb1822FinanceNewestFirst');
}
test('R1822: most recent invoice first, stable across same-day invoice numbers',()=>{
 const sort=sorter('dist/web');
 const rows=[{id:'1',number:1,issued_at:'2026-11-11T12:00:00Z'},
  {id:'2',number:2,issued_at:'2026-11-13T08:00:00Z'},
  {id:'3',number:3,issued_at:'2026-11-12T09:00:00Z'}];
 const before=JSON.stringify(rows);
 assert.deepEqual(Array.from(sort(rows,'invoice'),r=>r.number),[2,3,1]);
 assert.equal(JSON.stringify(rows),before,'input invoices must stay untouched');
 assert.deepEqual(Array.from(sort([{id:'4',number:4,issued_at:'2026-11-13'},{id:'5',number:5,issued_at:'2026-11-13'}],'invoice'),r=>r.number),[5,4]);
});
test('R1822: receipts include discounts in one chronological list',()=>{
 const sort=sorter('dist/web');
 const rows=[{id:'p1',paid_at:'2026-11-10T12:00:00Z',amount:50},
  {id:'d1',paid_at:'2026-11-13T12:00:00Z',pb1431ReceiptKind:'discount',amount:20},
  {id:'p2',paid_at:'2026-11-12T12:00:00Z',amount:30}];
 assert.deepEqual(Array.from(sort(rows,'receipt'),r=>r.id),['d1','p2','p1']);
 assert.equal(rows[0].id,'p1','no mutation of payment history');
 assert.deepEqual(Array.from(sort([{id:'a',created_at:'2026-11-10'},{id:'b',created_at:'2026-11-11'}],'receipt'),r=>r.id),['b','a']);
});
test('R1822: both web and Windows list invoices/receipts newest first before pagination',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/'+path);
  assert(js.includes('const Ve=pb1822FinanceNewestFirst(r.filter(Je=>{'),root+' invoice filter');
  assert(js.includes('}),"invoice"),he=Math.max(1,Math.ceil(Ve.length/N))'),root+' invoice sort BEFORE pagination');
  assert(js.includes('const pb1420Payments=pb1822FinanceNewestFirst('),root+' receipt list');
  assert(js.includes(',"receipt");'),root+' receipts chronological');
  assert(js.includes('pb1821LabInvoiceIssuer'),'R1821 lab invoice issuer retained');
  assert(read(root+'/index.html').includes('financeNewest=r1822'),root+' browser cache refreshed');
  new vm.Script(js);
 }
});
test('R1822: native hot-update manifest uses current exact bytes',()=>{
 const root='dist/web/lab-desktop-ui',m=JSON.parse(read(root+'/manifest.json'));
 const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
 for(const name of [path,'index.html']){
  const file=m.files.find(x=>x.name===name);
  assert(file,name+' in native update manifest');
  assert.equal(file.sha256,hash(fs.readFileSync(root+'/'+name)));
 }
 assert.equal(m.build,hash(JSON.stringify(m.files)));
});

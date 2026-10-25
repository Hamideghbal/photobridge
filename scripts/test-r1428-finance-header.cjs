const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const file='dist/web/assets/index-UIRefine-v655-r84.js',ui=fs.readFileSync(file,'utf8');
test('invoice date defaults and entry reset show all studios across all dates',()=>{
 const a=ui.indexOf('[_pbInvFrom,_setPbInvFrom]'),b=ui.indexOf(',[_pbAccountingMark',a);
 assert(a>0&&b>a);const values=[];vm.runInNewContext('const '+ui.slice(a,b)+';',{x:{useState:v=>{values.push(v);return[v,()=>{}]}}});assert.deepEqual(values,['','','','']);
 const start=ui.indexOf('x.useEffect(()=>{if(w==="invoices")'),end=ui.indexOf(';const Ve=',start);assert(start>0&&end>start);
 const calls=[],ctx={w:'invoices',t:'lab',x:{useEffect:fn=>fn()},pb1427SetInvoiceCustomer:v=>calls.push(['customer',v]),_setPbInvFrom:v=>calls.push(['from',v]),_setPbInvTo:v=>calls.push(['to',v]),_setPbInvAppliedFrom:v=>calls.push(['appliedFrom',v]),_setPbInvAppliedTo:v=>calls.push(['appliedTo',v]),Ie:v=>calls.push(['page',v])};
 vm.runInNewContext(ui.slice(start,end),ctx);assert.deepEqual(calls,[['customer',''],['from',''],['to',''],['appliedFrom',''],['appliedTo',''],['page',1]]);
 calls.length=0;vm.runInNewContext(ui.slice(start,end),{...ctx,w:'payments'});assert.deepEqual(calls,[]);
});
test('header transform repeats safely and versions delivered assets',()=>{
 const files=[file,'dist/web/index.html','dist/web/photobridge-r1423-finance-bars.css'],before=files.map(p=>fs.readFileSync(p,'utf8'));execFileSync(process.execPath,['scripts/enable-r1428-finance-header.mjs']);files.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));execFileSync(process.execPath,['--check',file]);assert(before[1].includes('financeHeader=r1428'));assert(before[1].includes('photobridge-r1423-finance-bars.css?v=r1428'));
});

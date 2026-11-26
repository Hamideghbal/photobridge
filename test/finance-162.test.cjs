'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const {receiptRows}=require('../receipt-view-162.cjs');
test('receipt projection keeps local identities and offline receipts, no duplicate mapped remote rows',()=>{
 const snapshot={payments:{a:{id:'a',serverId:'s',amount:10,remote:false,origin_offline:true},b:{id:'b',amount:20,origin_offline:true}}};
 const original=JSON.stringify(snapshot),rows=receiptRows(snapshot,[{id:'s',amount:12,paid_at:'2026-11-25'},{id:'c',amount:30,paid_at:'2026-11-26'}]);
 assert.equal(rows.length,3);assert.equal(rows.find(r=>r.id==='a').amount,12);assert.equal(rows.find(r=>r.id==='b').amount,20);assert.equal(rows[0].id,'c');assert.equal(JSON.stringify(snapshot),original);
});
test('receipt transport does not wait for general reconciliation',()=>{const h=read('local-business-host.cjs'),a=h.indexOf("['snapshot','live'].includes(url.searchParams.get('pbNativeReceiptView'))"),b=h.indexOf('// Isolated list-view fast path',a);assert(a>=0&&b>a);assert(!h.slice(a,b).includes('refreshFinance('));assert(h.slice(a,b).includes('receiptRows(latest,rows)'));});
test('active all filter and embedded settings are explicitly styled and smoke-checked',()=>{assert(read('native-queue.css').includes('button[data-pb162-invoice-all][aria-pressed="true"]'));assert(read('inline-backup-162.cjs').includes('/desktop/backups?embedded=1'));assert(read('compat-smoke.cjs').includes('PB162 inline backup'));});

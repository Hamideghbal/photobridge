const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=fs.readFileSync('dist/api/server.js','utf8');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const slice=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);assert(i>0&&j>i,a+' visible in generated build');return text.slice(i,j)};
test('R1895: all legacy Lab rows expose the removal action',()=>{
  const code=slice(ui,'ma=le=>',',_a=async');
  assert.match(code,/ma=le=>!!\(le&&le\.id\)/);
  for(const order of [
    {id:'old-no-invoice',status:'received'},
    {id:'old-invoiced',status:'completed',invoice_id:'invoice',downloaded_at:'2026-01-01'},
    {id:'paid',status:'ready',payment_status:'paid',invoice_id:'invoice'}
  ])assert.equal(vm.runInNewContext('('+code.slice('ma='.length,code.indexOf(',si='))+')') (order),true);
});
test('R1895: removal never requires a local folder; paid orders offer clearly labeled queue-only hide',async()=>{
  const section=slice(ui,'ma=le=>',',_a=async');
  const calls=[],alerts=[];
  let paid=false;
  const ctx={E:false,C:()=>{},V:String,h:null,confirm:()=>true,S:()=>{},I:()=>{},ye:async()=>{},P:()=>{},alert:s=>alerts.push(s),
    Me:async(path,options)=>{calls.push([path,options.method]);if(paid&&options.method==='DELETE'&&!path.endsWith('queue-hide'))throw{data:{error:'paid_order_requires_lab'}};return{ok:true}},
    Ef:()=>{throw Error('unexpected local file read')},ai:()=>{throw Error('unexpected folder check')}};
  vm.runInNewContext('const '+section+';globalThis.deleteLab=si;',ctx);
  await ctx.deleteLab({id:'old',number:23,status:'completed',invoice_id:'existing'});
  assert.deepEqual(calls,[['/api/lab/orders/old','DELETE']]);
  calls.length=0;paid=true;
  await ctx.deleteLab({id:'paid',number:24,status:'ready',invoice_id:'existing'});
  assert.deepEqual(calls,[['/api/lab/orders/paid','DELETE'],['/api/lab/orders/paid/queue-hide','POST']]);
  assert.equal(alerts.length,0);
});
test('R1895: server retains permission and payment/courier financial guards',()=>{
  const handler=slice(api,"if (labOrder && req.method === 'DELETE')","if (labOrder && req.method === 'PATCH')");
  assert.match(handler,/SELECT \* FROM orders WHERE id=\$1 AND lab_id=\$2/);
  assert.match(handler,/order\.payment_status \|\| ''/);
  assert.match(handler,/paid_order_requires_lab/);
  assert.match(handler,/courier_already_requested/);
  assert.match(handler,/paid_total/);
  assert.match(handler,/invoice_decrease/);
  assert.match(handler,/postBalancedFinanceTransaction/);
  assert.match(handler,/order_already_cancelled/);
  assert.doesNotMatch(handler,/order_already_downloaded|order_not_deletable/);
});
test('R1895: produced original files, receipts and consumed inventory survive cancellation',()=>{
  const handler=slice(api,"if (labOrder && req.method === 'DELETE')","if (labOrder && req.method === 'PATCH')");
  assert.match(handler,/alreadyProduced=Boolean\(order\.downloaded_at\|\|priorInvoice\.rowCount/);
  assert.match(handler,/if \(!alreadyProduced\) for \(const \[sizeId, qty\] of stock\)/);
  assert.match(handler,/if \(rq\.rowCount && !alreadyProduced\)/);
  assert.match(handler,/if \(!alreadyProduced\) await c\.query/);
  assert.match(handler,/if \(alreadyProduced\) storageKeys\.length=0/);
  assert.match(handler,/statusEvent\(c, cancelled, 'cancelled'/);
});
test('R1895: hidden orders can be restored without changing accounting or order state',()=>{
  const route=slice(api,'const pb1895QueueVisibility =', "if (req.method === 'GET' && url.pathname === '/api/lab/orders')");
  assert.match(route,/req\.method==='POST'\|\|req\.method==='DELETE'/);
  assert.match(route,/statusEvent\(c,order,hidden\?'lab_queue_hidden':'lab_queue_visible'/);
  assert.match(route,/SELECT \* FROM orders WHERE id=\$1 AND lab_id=\$2 FOR UPDATE/);
  assert.doesNotMatch(route,/(DELETE FROM|UPDATE) (invoices|finance_payments|finance_corrections|order_files)/i);
  const listing=slice(api,"if (req.method === 'GET' && url.pathname === '/api/lab/orders')","if (req.method === 'GET' && url.pathname === '/api/lab/archive')");
  assert.match(listing,/lab_queue_visible/);
  assert.match(listing,/lab_queue_hidden/);
  assert.match(fs.readFileSync('dist/web/index.html','utf8'),/labCancel=r1895/);
});

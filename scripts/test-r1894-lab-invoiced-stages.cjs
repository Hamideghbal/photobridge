const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const api=fs.readFileSync('dist/api/server.js','utf8');
function field(start,end){
  const from=bundle.indexOf(start),to=bundle.indexOf(end,from);
  assert(from>0&&to>from,'rendered UI contains '+start);
  return bundle.slice(from+start.indexOf('=')+1,to);
}
function stageFn(mode){
  const expr=field('rn=(le,nt)=>',',en=(le,nt)=>');
  const context={o:mode,kn:(row,statuses)=>statuses.includes(row.status)||(row.status_history||[]).some(x=>statuses.includes(x.status)),Pn:()=>0};
  return vm.runInNewContext('('+expr+')',context);
}
function enabledFn(mode){
  const rn=stageFn(mode);
  return vm.runInNewContext('('+field('la=(le,nt)=>',',Wn=async')+')',{o:mode,rn});
}
test('R1894: an already-issued print invoice enables Ready without history or local folder',()=>{
  const order={id:'old-order',number:42,status:'received',status_history:[],invoice_id:'existing-invoice',downloaded_at:null};
  const ready=stageFn('print'),enabled=enabledFn('print');
  assert.equal(ready(order,'download'),true);
  assert.equal(ready(order,'print'),true);
  assert.equal(ready(order,'ready'),false);
  assert.equal(enabled(order,'ready'),true);
  assert.equal(enabled(order,'download'),false);
  assert.equal(enabled(order,'print'),false);
});
test('R1894: issued album invoices can progress without the original folder',()=>{
  const order={id:'old-album',status:'received',album_stage:'files_received',status_history:[],invoice_id:'existing-invoice',downloaded_at:null};
  const ready=stageFn('album'),enabled=enabledFn('album');
  assert.equal(ready(order,'download_print'),true);
  assert.equal(ready(order,'binding'),true);
  assert.equal(enabled(order,'ready'),true);
});
test('R1894: uninvoiced undownloaded print still requires original receive/download step',()=>{
  const order={status:'received',status_history:[],downloaded_at:null,invoice_id:null};
  const ready=stageFn('print'),enabled=enabledFn('print');
  assert.equal(ready(order,'download'),false);
  assert.equal(ready(order,'print'),false);
  assert.equal(enabled(order,'ready'),false);
});
test('R1894: Ready from any browser uses server status, no file picker or PDF action',async()=>{
  const events=[], context={
    C:()=>{},It:async(o,s)=>{events.push('PATCH:'+s);return{order:{status:s}};},
    Gt:async()=>{events.push('navigate');},ye:async()=>{},P:()=>{},V:String,
    Me:async(url)=>{events.push('GET:'+url);return {invoice:{id:'existing-invoice'}};},
    alert:(message)=>{throw Error('Unexpected alert '+message)},
    Ef:()=>{throw Error('LOCAL_FOLDER_CALLED')},
    Wu:()=>{throw Error('INVOICE_PDF_CALLED')},
    ai:()=>{throw Error('LOCAL_CHECK_CALLED')},
    pb1450AllowStage:async()=>{throw Error('LOCAL_FOLDER_CALLED')},
    pb1894HasIssuedInvoice:async le=>{if(le.invoice_id)return true;const detail=await context.Me('/api/lab/orders/'+le.id);if(detail?.invoice?.id){le.invoice_id=detail.invoice.id;return true}return false}
  };
  const onReady=vm.runInNewContext('('+field('un=async le=>',',Cn=async')+')',context);
  await onReady({id:'legacy',number:42,status:'received',invoice_required:true,invoice_id:'invoice1',downloaded_at:null,status_history:[]});
  assert.deepEqual(events,['PATCH:ready','navigate']);
  events.length=0;
  await onReady({id:'legacy',number:42,status:'received',invoice_required:true,downloaded_at:null,status_history:[]});
  assert.deepEqual(events,['GET:/api/lab/orders/legacy','PATCH:ready','navigate']);
});
test('R1894: album Ready and completion bypass local-folder gate after existing invoice',()=>{
  const handler=field('Cn=async(le,nt)=>',',aa=async');
  assert.match(handler,/nt!=="printing"&&await pb1894HasIssuedInvoice\(le\)/);
  assert.doesNotMatch(handler,/getDirectoryHandle|showDirectoryPicker|\bEf\(|\bWu\(/);
});
test('R1894: print Ready and Delivered gate bypass disk only with stored invoice',()=>{
  const ready=field('un=async le=>',',Cn=async');
  const delivered=field('gn=async le=>',',Vn=async');
  assert.match(ready,/!await pb1894HasIssuedInvoice\(le\)&&!await pb1450AllowStage\(le\)/);
  assert.match(delivered,/!await pb1894HasIssuedInvoice\(le\)&&!await pb1450AllowStage\(le\)/);
  assert.match(bundle,/async function pb1894HasIssuedInvoice\(le\)/);
});
test('R1894: existing server invoice contract remains unchanged and audit is preserved',()=>{
  assert.match(api,/async function createOrGetInvoice\(c, labId, orderId\)/);
  assert.match(api,/const existing = await c\.query\(\x60SELECT i\.\*/);
  assert.match(api,/if \(existing\.rowCount\)/);
  const print=api.slice(api.indexOf("if (labOrder && req.method === 'PATCH')"),api.indexOf("// v0.17.565-pdf-upload",api.indexOf("if (labOrder && req.method === 'PATCH')")));
  assert.match(print,/invoice = await createOrGetInvoice\(c, labId, labOrder\[1\]\)/);
  assert.match(print,/statusEvent\(c, order, status, a\.userId, note\)/);
  assert.match(print,/oldOrder\.settlement_mode === 'prepaid'/);
  const album=api.slice(api.indexOf("if (labAlbumStage && req.method === 'PUT')"),api.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/walkin')",api.indexOf("if (labAlbumStage && req.method === 'PUT')")));
  assert.match(album,/invoice = await createOrGetInvoice\(c, labId, order\.id\)/);
  assert.match(fs.readFileSync('dist/web/index.html','utf8'),/labStage=r1894/);
});

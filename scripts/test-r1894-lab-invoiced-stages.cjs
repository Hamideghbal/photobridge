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
    ai:()=>{throw Error('LOCAL_CHECK_CALLED')}
  };
  const onReady=vm.runInNewContext('('+field('un=async le=>',',Cn=async')+')',context);
  await onReady({id:'legacy',number:42,status:'received',invoice_required:true,invoice_id:'invoice1',downloaded_at:null,status_history:[]});
  assert.deepEqual(events,['PATCH:ready','navigate']);
  events.length=0;
  await onReady({id:'legacy',number:42,status:'received',invoice_required:true,downloaded_at:null,status_history:[]});
  assert.deepEqual(events,['GET:/api/lab/orders/legacy','PATCH:ready','navigate']);
});
test('R1894: album Ready never regenerates an existing PDF',()=>{
  const handler=field('Cn=async(le,nt)=>',',aa=async');
  assert.match(handler,/nt==="ready"&&Zt.invoiceReused/);
  assert.match(api,/invoiceReused/);
});
test('R1894: both server transitions reuse existing invoice',()=>{
  const cases=[
    ['print',"if (labOrder && req.method === 'PATCH')","// v0.17.565-pdf-upload"],
    ['album',"if (labAlbumStage && req.method === 'PUT')","if (req.method === 'GET' && url.pathname === '/api/lab/walkin')"]
  ];
  for(const [name,a,b] of cases){
    const start=api.indexOf(a),stop=api.indexOf(b,start);
    assert(start>0&&stop>start);
    const part=api.slice(start,stop);
    assert(part.includes('SELECT * FROM invoices WHERE order_id=$1 AND lab_id=$2 ORDER BY issued_at ASC LIMIT 1'),name+' verifies persisted invoice');
    assert.match(part,/priorInvoice\.rows\[0\] \|\| await createOrGetInvoice/);
    assert.match(part,/!priorInvoice\.rowCount|!invoiceReused/);
    assert.doesNotMatch(part,/getDirectoryHandle|showDirectoryPicker|folder_permission_denied/);
  }
  assert.match(api,/oldOrder\.settlement_mode === 'prepaid'/);
  assert.match(api,/statusEvent\(c, order, status, a\.userId, note\)/);
  assert.match(fs.readFileSync('dist/web/index.html','utf8'),/labStage=r1894/);
});

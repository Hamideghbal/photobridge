const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {PGlite}=require(process.env.PB_PGLITE_PATH||'@electric-sql/pglite');
const server=fs.readFileSync('dist/api/server.js','utf8'),helpers=fs.readFileSync('scripts/r1854-server-recovery.js.txt','utf8');
const between=(start,end)=>{const a=server.indexOf(start),b=server.indexOf(end,a);assert(a>=0&&b>a,start);return server.slice(a,b)};
const create=between('// R1854 recovery-only paths fail closed on older servers.','const customerOrder =');
const presign=between("if(req.method==='POST'&&url.pathname==='/api/customer/uploads/recovery-presign')",'const localUpload =');
const exclude=between('        // Explicit removal from a print draft only;', '        const pb1854Retry =');
const retry=between('        const pb1854Retry =',"        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {");
// R2047 adds asynchronous filename normalization to the actual presign
// handler. Execute the emitted server declarations in the same VM, using
// the fixture's real PostgreSQL-compatible database, not a naming stub.
const naming=presign.includes('pb2047UniqueUploadBase(')?(()=>{
 const start=server.indexOf('\nfunction pb2047CleanUploadName(');
 const end=server.indexOf('\n/* PB2047 server */',start);
 assert(start>=0&&end>start,'generated R2047 naming helpers exist');
 const code=server.slice(start,end);
 assert.match(code,/async function pb2047UniqueUploadBase\(/);
 return code+'\n';
})():'';
const copyStart=server.indexOf('function orderPrintCopyName(name, copies)');
const copyEnd=server.indexOf('function albumMoney(',copyStart);
assert(copyStart>=0&&copyEnd>copyStart,'actual copy naming helper exists');
const copyNaming=server.slice(copyStart,copyEnd);
const owner='11111111-1111-4111-8111-111111111111',lab='22222222-2222-4222-8222-222222222222',order='33333333-3333-4333-8333-333333333333',file='44444444-4444-4444-8444-444444444444',size='55555555-5555-4555-8555-555555555555',other='66666666-6666-4666-8666-666666666666';
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE TABLE lab_memberships(lab_id uuid,user_id uuid,role text,active boolean,settlement_mode text);CREATE TABLE orders(id uuid PRIMARY KEY,lab_id uuid,customer_id uuid,mode text,status text,delivery text,priority text,album_data jsonb,album_stage text,settlement_mode text,payment_status text);CREATE TABLE order_files(id uuid PRIMARY KEY,order_id uuid,lab_id uuid,customer_id uuid,original_name text,relative_path text,object_key text,content_type text,bytes bigint,width int,height int,dpi int,print_size_id uuid,print_type text,chassis boolean,frame boolean,crop_handling text,print_copies int,addon_selection jsonb,original_state text);`);
 await db.query("INSERT INTO lab_memberships VALUES($1,$2,'customer',true,'ledger')",[lab,owner]);let storage=null,statError=null,signs=0,audits=0,heads=0;
 const context={pool:{query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})},crypto,console:{warn(){}},a:{userId:owner},labId:lab,MAX_UPLOAD_BYTES:200*1024*1024,uploadAvailable:true,storageConfigured:true,storageKey:key=>key,localStorageObjectKey:key=>'local/'+key,storagePresign:async()=>{signs++;return 'https://object.invalid/fresh-signed-url'},storageStat:async()=>{throw Error('legacy_storageStat_drops_S3_http_status')},HeadObjectCommand:class {constructor(input){this.input=input}},S3_BUCKET:'fixture-bucket',s3:{send:async command=>{heads++;assert.equal(command.input.Bucket,'fixture-bucket');assert(command.input.Key);if(statError)throw statError;if(storage===null)throw Object.assign(Error('UnknownError'),{name:'NotFound',$metadata:{httpStatusCode:404}});return {ContentLength:storage}}},safeFileName:n=>n,labCanUsePrintSize:async()=>true,pb1779Snapshot:async()=>({frame:{id:'model',unitPrice:1200}}),bodyJson:async()=>context.body,audit:async()=>audits++,sendJson:(res,status,data)=>({status,data}),req:{method:'POST',headers:{}},res:{}};
 const run=async(code,path,body={})=>{context.req={method:'POST',headers:{}};context.url={pathname:path};context.body=body;return vm.runInNewContext('(async()=>{'+helpers+'\n'+naming+copyNaming+'\n'+code+'})()',context)};
 const payload={orderId:order,clientFileId:file,name:'photo.jpg',relativePath:'10x15/photo.jpg',bytes:123,contentType:'image/jpeg',width:100,height:150,dpi:300,printSizeId:size,printType:'luster',chassis:false,frame:true,frameModelId:'model',cropHandling:'lab',printCopies:2,checksum:'a'.repeat(64)};
 return {db,context,run,payload,exclude,get signs(){return signs},get heads(){return heads},get audits(){return audits},stored:n=>storage=n,error:e=>statError=e,async close(){await db.close()}};
}
test('replayed print draft creation is stable, scoped, and does not duplicate audit events',async()=>{const f=await fixture();try{const body={mode:'print',delivery:'pickup',priority:'normal',recoveryId:order};const a=await f.run(create,'/api/customer/recovery-orders',body),b=await f.run(create,'/api/customer/recovery-orders',body);assert.equal(a.status,201);assert.equal(b.status,200);assert.equal(a.data.order.id,b.data.order.id);assert.equal(f.audits,1);assert.equal((await f.db.query('SELECT count(*)::int n FROM orders')).rows[0].n,1);const changed=await f.run(create,'/api/customer/recovery-orders',{...body,delivery:'courier'});assert.equal(changed.status,409);f.context.a.userId=other;const denied=await f.run(create,'/api/customer/recovery-orders',body);assert.equal(denied.status,409);assert.equal(denied.data.order,undefined)}finally{await f.close()}});
test('same file ID replays immutable copies/model snapshot; changed metadata or ownership cannot overwrite it',async()=>{const f=await fixture();try{await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});const a=await f.run(presign,'/api/customer/uploads/recovery-presign',f.payload);const b=await f.run(presign,'/api/customer/uploads/recovery-presign',f.payload);assert.equal(a.status,201);assert.equal(b.status,200);assert.equal(a.data.fileId,b.data.fileId);assert.equal((await f.db.query('SELECT count(*)::int n FROM order_files')).rows[0].n,1);const row=(await f.db.query('SELECT * FROM order_files')).rows[0];assert.equal(row.print_copies,2);assert.equal(row.original_name,'photo = 2.jpg');assert.equal(row.addon_selection.frame.unitPrice,1200);for(const change of [{printCopies:3},{frameModelId:'different'},{checksum:'b'.repeat(64)},{bytes:124},{relativePath:'other/photo.jpg'}]){const r=await f.run(presign,'/api/customer/uploads/recovery-presign',{...f.payload,...change});assert.equal(r.status,409)}f.context.a.userId=other;const denied=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(denied.status,404);f.context.a.userId=owner;f.context.labId=other;assert.equal((await f.run(retry,'/api/customer/uploads/'+file+'/retry')).status,404)}finally{await f.close()}});
test('storage probe preserves full files, renews only missing/invalid files, and classifies denied access',async()=>{const f=await fixture();try{await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});await f.run(presign,'/api/customer/uploads/recovery-presign',f.payload);let r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.status,200,'raw S3 404 must be treated as a missing file, not 503');assert.equal(r.data.uploaded,false);assert(r.data.uploadUrl);assert.equal(f.heads,1,'recovery must use raw HeadObject, not the legacy error-swallowing wrapper');f.stored(123);const signs=f.signs;r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.data.uploaded,true);assert.equal(r.data.uploadUrl,null);assert.equal(f.signs,signs);f.stored(122);r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.data.uploaded,false);f.error(Object.assign(Error('denied'),{name:'AccessDenied',$metadata:{httpStatusCode:403}}));r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.status,503);assert.equal(r.data.error,'storage_access_denied');assert.equal(r.data.retryable,false);assert.match(r.data.correlationId,/^[0-9a-f-]{36}$/);f.error(Object.assign(Error('outage'),{$metadata:{httpStatusCode:503}}));r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.data.retryable,true);assert.equal(r.data.error,'storage_temporarily_unavailable');f.error(Object.assign(Error('full'),{name:'InsufficientStorage',$metadata:{httpStatusCode:507}}));r=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(r.data.error,'storage_capacity_exceeded');assert.equal(r.data.retryable,false)}finally{await f.close()}});
test('S3 probe preserves provider HTTP 404 versus 403/503 without re-registering a print file',async()=>{
 const f=await fixture();try{
  await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});await f.run(presign,'/api/customer/uploads/recovery-presign',f.payload);
  f.error(Object.assign(Error('UnknownError'),{name:'NotFound',$metadata:{httpStatusCode:404}}));
  const missing=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(missing.status,200);assert.equal(missing.data.uploaded,false);assert(missing.data.uploadUrl);
  f.error(Object.assign(Error('AccessDenied'),{name:'AccessDenied',$metadata:{httpStatusCode:403}}));
  const denied=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(denied.data.error,'storage_access_denied');assert.equal(denied.data.retryable,false);
  f.error(Object.assign(Error('Unavailable'),{$metadata:{httpStatusCode:503}}));
  const unavailable=await f.run(retry,'/api/customer/uploads/'+file+'/retry');assert.equal(unavailable.data.error,'storage_temporarily_unavailable');assert.equal(unavailable.data.retryable,true);
  assert.equal((await f.db.query('SELECT count(*)::int n FROM order_files')).rows[0].n,1);
 }finally{await f.close()}
});
test('recovery invalid UUIDs/checksums never register new rows; legacy album path is kept',async()=>{const f=await fixture();try{assert.equal((await f.run(create,'/api/customer/recovery-orders',{recoveryId:'invalid'})).status,400);assert.equal((await f.run(create,'/api/customer/recovery-orders',{recoveryId:order,mode:'album'})).status,400);await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});assert.equal((await f.run(presign,'/api/customer/uploads/recovery-presign',{...f.payload,checksum:'wrong'})).status,400);assert.equal((await f.db.query('SELECT count(*)::int n FROM order_files')).rows[0].n,0)}finally{await f.close()}});
test('explicit exclusion is scoped, idempotent, retains a tombstone and never removes a verified original',async()=>{
 const f=await fixture();try{
  await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});await f.run(presign,'/api/customer/uploads/recovery-presign',f.payload);
  let r=await f.run(f.exclude,'/api/customer/uploads/'+file+'/exclude',{orderId:order});assert.equal(r.status,200);assert.equal(r.data.excluded,true);assert.equal((await f.db.query('SELECT original_state FROM order_files WHERE id=$1',[file])).rows[0].original_state,'deleted');
  r=await f.run(f.exclude,'/api/customer/uploads/'+file+'/exclude',{orderId:order});assert.equal(r.status,200);
  await f.db.query("UPDATE order_files SET original_state='active' WHERE id=$1",[file]);r=await f.run(f.exclude,'/api/customer/uploads/'+file+'/exclude',{orderId:order});assert.equal(r.status,409);assert.equal(r.data.error,'upload_already_verified');
  f.context.a.userId=other;r=await f.run(f.exclude,'/api/customer/uploads/'+file+'/exclude',{orderId:order});assert.equal(r.status,404);assert.equal((await f.db.query('SELECT original_state FROM order_files WHERE id=$1',[file])).rows[0].original_state,'active');
 }finally{await f.close()}
});

if(naming)test('R2047 recovery normalizes original names and distinguishes collision without changing replay identity',async()=>{
 const f=await fixture();try{
  await f.run(create,'/api/customer/recovery-orders',{recoveryId:order});
  const first={...f.payload,name:'photo = stale.jpg',relativePath:'10x15/photo = stale.jpg'};
  assert.equal((await f.run(presign,'/api/customer/uploads/recovery-presign',first)).status,201);
  const second={...first,clientFileId:other,name:'photo = alternate.jpg',relativePath:'10x15/photo = alternate.jpg'};
  assert.equal((await f.run(presign,'/api/customer/uploads/recovery-presign',second)).status,201);
  assert.equal((await f.run(presign,'/api/customer/uploads/recovery-presign',first)).status,200);
  const rows=(await f.db.query('SELECT id,original_name,print_copies FROM order_files ORDER BY id')).rows;
  assert.deepEqual(rows.map(r=>[r.original_name,r.print_copies]),[['photo = 2.jpg',2],['photo-666666666666 = 2.jpg',2]]);
 }finally{await f.close()}
});

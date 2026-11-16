'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),order='11111111-1111-4111-8111-111111111111';
const file1='22222222-2222-4222-8222-222222222222',file2='33333333-3333-4333-8333-333333333333';
function album(root){
 const code=read(root+'/assets/index-UIRefine-v655-r84.js');
 const a=code.indexOf('function Kv('),b=code.indexOf('function ',a+12);
 assert(a>=0&&b>a,'album editor exists');
 assert.doesNotThrow(()=>new vm.Script(code),root+' compiles');
 return code.slice(a,b);
}
test('R1865: cancel stops transfer while keeping original cached pages and completed rows',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=album(root);
  assert(s.includes('pb1865Cancel=()=>{if(!je)return;dt.current+=1'));
  assert(s.includes('qe.current?.abort()'));
  assert(s.includes('Re("error");pe("ارسال متوقف شد'));
  assert(s.includes('className:"pb1865AlbumCancel",onClick:pb1865Cancel'));
  assert(!s.includes('pb1865Cancel=()=>{Tu('));
  assert(s.includes('Ga=$e=>{if(je)return;'),'previous failure must not prevent removing a page');
  assert(s.includes('Fa=async $e=>{var Lt,pn;if(!$e||je)return;'),'new pages cannot race upload');
  assert(s.includes('className:"albumFileRemove","aria-label":"حذف",disabled:je'));
  assert(s.includes('className:"pb1865AlbumFileStatus "+'));
  assert(s.includes('✓ ارسال شد و تأیید شد'));
  assert(s.includes('در حال ارسال · '));
  assert(s.includes('je&&Number($e.progress||0)>0?"در حال ارسال'), 'cancelled partial page must show as not sent');
  assert(s.includes('ارسال نشده'));
 }
});
test('R1865: only server-active originals survive refresh as 100% with a valid file id',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=album(root);
  assert(s.includes("original_state==='active'"));
  assert(s.includes('serverFileId:String(Ln.id)'));
  assert(s.includes('serverFileId:String(An.fileId)'));
  assert(s.includes('progress:0,serverFileId:null'));
  assert(!s.includes('}catch{return gt}},xe=async'));
  assert(s.includes('const pb1865AlbumData=()=>('));
  assert(s.includes('albumData:pb1865AlbumData()'));
  assert(s.includes('"/draft",{method:"PATCH"'));
  assert(s.includes('keepFileIds:pb1865Keep'));
  assert(s.includes('confirmExcludeStale:true'));
  assert(s.indexOf('album/reconcile')<s.indexOf('/submit'));
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1865-album-upload.css?v=r1865'));
  assert(html.includes('albumUpload=r1865'));
 }
});
const route=read('scripts/r1865-album-reconcile-route.js.txt');
async function call(input,active=[file1,file2],found=true){
 const sql=[];let updates=0;const audits=[];
 const connection={release(){},async query(statement,args){
  sql.push({statement,args});
  if(statement==='BEGIN'||statement==='ROLLBACK'||statement==='COMMIT')return {rowCount:0,rows:[]};
  if(statement.includes('SELECT id FROM orders'))return found?{rowCount:1,rows:[{id:order}]}:{rowCount:0,rows:[]};
  if(statement.includes('SELECT id FROM order_files'))return {rowCount:active.length,rows:active.map(id=>({id}))};
  if(statement.includes('UPDATE order_files')){updates++;return{rowCount:args[3].length,rows:args[3].map(id=>({id}))}}
  throw Error('unexpected SQL '+statement.slice(0,80));
 }};
 const fn=new Function('url','req','bodyJson','pool','a','labId','sendJson','res','audit',
   'return (async()=>{'+route+'})()');
 const reply=await fn({pathname:'/api/customer/orders/'+order+'/album/reconcile'},
   {method:'POST'},async()=>input,{connect:async()=>connection},{userId:'owner'},'lab',
   (_r,status,data)=>({status,data}),{},async(...args)=>audits.push(args));
 return {reply,sql,updates,audits};
}
test('R1865: unconfirmed extra active pages are never excluded',async()=>{
 const {reply,sql,updates}=await call({keepFileIds:[file1]});
 assert.equal(reply.status,409);
 assert.equal(reply.data.error,'album_stale_files_detected');
 assert.equal(reply.data.extra,1);
 assert.equal(updates,0);
 assert(sql.some(q=>q.statement==='ROLLBACK'));
});
test('R1865: explicit consent excludes only stale draft records without S3 deletion',async()=>{
 const {reply,sql,updates,audits}=await call({keepFileIds:[file1],confirmExcludeStale:true});
 assert.equal(reply.status,200);
 assert.equal(reply.data.excluded,1);
 assert.equal(reply.data.active,1);
 assert.equal(reply.data.preservedOriginals,true);
 assert.equal(updates,1);
 const update=sql.find(q=>q.statement.includes('UPDATE order_files'));
 assert.deepEqual(update.args[3],[file2]);
 assert.match(update.statement,/original_state='deleted'/);
 assert(sql.some(q=>q.statement==='COMMIT'));
 assert.equal(audits.length,1);
 assert(!/storageDelete|fs\.promises\.rm|deleteStoredKeyBestEffort/.test(route));
});
test('R1865: cannot exclude or pretend a file belongs to another draft',async()=>{
 const bad=await call({keepFileIds:[file1,'not-a-uuid']});
 assert.equal(bad.reply.status,400);assert.equal(bad.updates,0);
 const foreign=await call({keepFileIds:[file1,file2]},[file1]);
 assert.equal(foreign.reply.status,409);
 assert.equal(foreign.reply.data.error,'album_reconcile_missing_uploads');
 assert.equal(foreign.updates,0);
 const noDraft=await call({keepFileIds:[file1]},[file1],false);
 assert.equal(noDraft.reply.status,404);
 assert.equal(noDraft.updates,0);
});
test('R1865: strict owner/status guards in server and matching Windows hot-update manifest',()=>{
 const server=read('dist/api/server.js');
 assert(server.includes('pb1865Reconcile'));
 assert(server.includes("status='uploading' AND mode='album' FOR UPDATE"));
 assert(server.includes("original_state='active' FOR UPDATE"));
 const m=JSON.parse(read('dist/web/lab-desktop-ui/manifest.json'));
 const hash=d=>crypto.createHash('sha256').update(d).digest('hex');
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1865-album-upload.css']){
  const row=m.files.find(x=>x.name===name);
  assert(row,'missing update asset '+name);
  assert.equal(row.sha256,hash(fs.readFileSync('dist/web/lab-desktop-ui/'+name)),name);
 }
 assert.equal(m.build,hash(JSON.stringify(m.files)));
 assert.equal(read('dist/web/photobridge-r1865-album-upload.css'),read('dist/web/lab-desktop-ui/photobridge-r1865-album-upload.css'));
});

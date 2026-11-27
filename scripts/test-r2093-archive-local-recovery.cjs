const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('scripts/r2093-archive-local-reader.js.txt','utf8');
function folder(name,children={},broken=false){return {name,kind:'directory',async *entries(){if(broken)throw Error('ENOENT');yield*Object.entries(children)}}}
function photo(name,size){return {kind:'file',name,async getFile(){return{name,size}}}}
const f={id:'a',original_name:'IMG_1.jpg',bytes:100,print_copies:2};
const detail={order:{id:'order-id',number:123},files:[f]};
function fixture(root,saved=null,options={}){
 const ctx={yc:()=>({}),pb1550Db:async()=>saved,pb1550Decode:x=>x,qs:async()=>root,Vs:async()=>true,Ya:String,pb1769DownloadName:(f,n)=>n.replace(/\.jpg$/,' = 2.jpg'),window:{},ai:()=>true,pb1450FileInfo:h=>h.getFile(),pb1450Code:e=>e.message,Ky:async()=>{throw Error('file_not_found')},...options};
 vm.runInNewContext(source,ctx);return ctx;
}
test('R2093: finds order-first archive with old alias and copy/model suffix despite a missing pinned folder',async()=>{
 const name='IMG_1 = 2 = Shasi.jpg',root=folder('archive',{Hamkar:folder('Hamkar',{'1405-09-01':folder('day',{OldStudio:folder('OldStudio',{'order-123':folder('order-123',{'10x15':folder('10x15',{[name]:photo(name,100)})})})})})});
 const ctx=fixture(root,{root:folder('old',{},true),targets:{a:{dir:folder('missing',{},true)}}});
 const result=await ctx.pb2093ReadArchive(detail);assert.equal(result.length,1);assert.equal(result[0].file.name,name);assert.equal(result[0].meta.original_name,'IMG_1.jpg');assert.equal(result.localCount,1);
});
test('R2093: cannot recover a same-size different image or a different order',async()=>{
 const ctx=fixture(folder('archive',{'order-124':folder('order-124',{'IMG_1.jpg':photo('IMG_1.jpg',100)}),'order-123':folder('order-123',{'different.jpg':photo('different.jpg',100),'IMG_1.jpg':photo('IMG_1.jpg',99)})}));
 await assert.rejects(ctx.pb2093ReadArchive(detail),e=>e.message==='archive_sources_incomplete'&&e.missing[0]==='IMG_1.jpg');
});
test('R2093: duplicate plausible files are rejected, not guessed',async()=>{
 const name='IMG_1 = 2.jpg',ctx=fixture(folder('archive',{'order-123':folder('order-123',{a:folder('a',{[name]:photo(name,100)}),b:folder('b',{[name]:photo(name,100)})})}));
 await assert.rejects(ctx.pb2093ReadArchive(detail),e=>e.archiveIssues.includes('ambiguous'));
});
test('R2093: partial local archive uses cloud only for missing selected files',async()=>{
 const second={id:'b',original_name:'IMG_2.jpg',bytes:200},calls=[];
 const ctx=fixture(folder('archive',{'invoice-0123':folder('invoice-0123',{'IMG_1.jpg':photo('IMG_1.jpg',100)})}),null,{Ky:async id=>{calls.push(id);return{pbDownloadBytes:200,blob:async()=>({size:200,type:'image/jpeg'})}},File:class{constructor(blobs,name){this.name=name;this.size=blobs[0].size}}});
 const result=await ctx.pb2093ReadArchive({...detail,files:[f,second]});assert.equal(result.localCount,1);assert.equal(result.serverCount,1);assert.deepEqual(calls,['b']);
});
test('R2093: inaccessible disk is reported distinctly; network failure never becomes missing photo',async()=>{
 const ctx=fixture(null);await assert.rejects(ctx.pb2093ReadArchive(detail),e=>e.archiveIssues.includes('root_unavailable'));
 const other=fixture(null,null,{Ky:async()=>{throw Error('network_error')}});await assert.rejects(other.pb2093ReadArchive(detail),/network_error/);
});
test('R2093: shipped Lab uses shared reader and exact output name; compact controls remain expandable',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8'),html=fs.readFileSync(root+'/index.html','utf8');
  assert.match(ui,/function pb1451ReadArchive\(detail,progress\)\{return pb2093ReadArchive/);
  assert.match(ui,/pb1445WriteDownload\(target.dir,name,new Response\(entry.file\)/);
  assert.match(ui,/make\('details',null,'pb2093Extras'\)/);
  assert.match(html,/archiveRecovery=r2093&archiveSelection=r2091/);
 }
});
